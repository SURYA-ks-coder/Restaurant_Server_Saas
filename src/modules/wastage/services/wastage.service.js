const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const wastageRepository = require("../repositories/wastage.repository");
const inventoryRepository = require("../../inventory/repositories/inventory.repository");
const inventoryTransactionRepository = require("../../inventory/repositories/inventoryTransaction.repository");
const { getIo } = require("../../../sockets");
const { notify } = require("../../../sockets/notify");

const recordWastage = async ({ payload, tenant, user }) => {
  const invItem = await inventoryRepository.findOne({
    _id: payload.inventoryItemId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!invItem)
    throw new AppError("Inventory item not found", httpStatus.NOT_FOUND);

  const previousQuantity = invItem.stockQuantity;
  const updatedQuantity = previousQuantity - payload.quantity;

  if (updatedQuantity < 0)
    throw new AppError(
      `Insufficient stock. Available: ${previousQuantity} ${invItem.unit}`,
      httpStatus.CONFLICT
    );

  const wastage = await wastageRepository.create({
    ...payload,
    inventoryItemName: invItem.materialName,
    unit: invItem.unit,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    recordedBy: user.id,
  });

  await inventoryRepository.updateById(invItem._id, { stockQuantity: updatedQuantity });

  await inventoryTransactionRepository.create({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    inventoryItemId: invItem._id,
    type: "wastage",
    quantity: -payload.quantity,
    previousQuantity,
    updatedQuantity,
    referenceId: wastage._id,
    notes: `Wastage: ${payload.reason}${payload.notes ? ` — ${payload.notes}` : ""}`,
    createdBy: user.id,
  });

  const io = getIo();
  if (io && updatedQuantity <= invItem.minimumStock) {
    io.to(`branch:${tenant.branchId}`).emit("inventory:low-stock", {
      itemId: invItem._id,
      materialName: invItem.materialName,
      stockQuantity: updatedQuantity,
      minimumStock: invItem.minimumStock,
    });
    notify(tenant.branchId, {
      type: "low_stock",
      title: "Low Stock Alert",
      description: `${invItem.materialName} running low (${updatedQuantity} left)`,
      meta: { itemId: invItem._id, materialName: invItem.materialName },
    });
  }

  return wastage;
};

const getWastage = async ({ id, tenant }) => {
  const wastage = await wastageRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!wastage) throw new AppError("Wastage record not found", httpStatus.NOT_FOUND);
  return wastage;
};

const listWastage = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "quantity"]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  };
  if (query.reason) filter.reason = query.reason;
  if (query.inventoryItemId) filter.inventoryItemId = query.inventoryItemId;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [items, total] = await wastageRepository.paginate({
    filter,
    sort,
    skip,
    limit,
    populate: [{ path: "inventoryItemId", select: "materialName unit" }],
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const wastageReport = async ({ query, tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  };
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [summary] = await wastageRepository.model.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
      },
    },
  ]);

  const byReason = await wastageRepository.model.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$reason",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
      },
    },
    { $project: { _id: 0, reason: "$_id", count: 1, totalQuantity: 1 } },
    { $sort: { totalQuantity: -1 } },
  ]);

  const byItem = await wastageRepository.model.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$inventoryItemId",
        name: { $first: "$inventoryItemName" },
        unit: { $first: "$unit" },
        totalQuantity: { $sum: "$quantity" },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, inventoryItemId: "$_id", name: 1, unit: 1, totalQuantity: 1, count: 1 } },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
  ]);

  return {
    totalRecords: summary?.totalRecords || 0,
    totalQuantity: summary?.totalQuantity || 0,
    byReason,
    topWastedItems: byItem,
  };
};

module.exports = { recordWastage, getWastage, listWastage, wastageReport };
