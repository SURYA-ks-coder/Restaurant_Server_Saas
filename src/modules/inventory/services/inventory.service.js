const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const inventoryRepository = require("../repositories/inventory.repository");
const inventoryTransactionRepository = require("../repositories/inventoryTransaction.repository");
const { getIo } = require("../../../sockets");

const createInventoryItem = async ({ payload, tenant, user }) => {
  const exists = await inventoryRepository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    materialName: payload.materialName,
  });
  if (exists)
    throw new AppError("Inventory item already exists", httpStatus.CONFLICT);

  return inventoryRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
};

const updateInventoryItem = async ({ id, payload, tenant, user }) => {
  const item = await inventoryRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!item)
    throw new AppError("Inventory item not found", httpStatus.NOT_FOUND);
  return inventoryRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const getInventoryItem = async ({ id, tenant }) => {
  const item = await inventoryRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!item)
    throw new AppError("Inventory item not found", httpStatus.NOT_FOUND);
  return item;
};

const listInventoryItems = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, [
    "createdAt",
    "materialName",
    "stockQuantity",
    "minimumStock",
  ]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.status) filter.status = query.status;
  if (query.search)
    filter.materialName = { $regex: query.search, $options: "i" };
  const [items, total] = await inventoryRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const adjustStock = async ({ id, payload, tenant, user, type }) => {
  const item = await inventoryRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!item)
    throw new AppError("Inventory item not found", httpStatus.NOT_FOUND);

  const quantityChange =
    type === "purchase" ? Number(payload.quantity) : -Number(payload.quantity);
  const updatedQuantity = item.stockQuantity + quantityChange;
  if (updatedQuantity < 0)
    throw new AppError("Insufficient stock quantity", httpStatus.CONFLICT);

  const transaction = await inventoryTransactionRepository.create({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    inventoryItemId: item._id,
    type,
    quantity: quantityChange,
    previousQuantity: item.stockQuantity,
    updatedQuantity,
    referenceId: null,
    notes: payload.notes,
    createdBy: user.id,
  });

  const updatedItem = await inventoryRepository.updateById(id, {
    stockQuantity: updatedQuantity,
    updatedBy: user.id,
  });
  const io = getIo();
  if (io && updatedItem.stockQuantity <= updatedItem.minimumStock) {
    io.to(`branch:${tenant.branchId}`).emit("inventory:low-stock", {
      itemId: updatedItem._id,
      materialName: updatedItem.materialName,
      stockQuantity: updatedItem.stockQuantity,
      minimumStock: updatedItem.minimumStock,
      branchId: tenant.branchId,
    });
  }

  return { item: updatedItem, transaction };
};

const listLowStock = async ({ tenant }) => {
  return inventoryRepository.model
    .find({
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      $expr: { $lte: ["$stockQuantity", "$minimumStock"] },
    })
    .sort({ stockQuantity: 1 });
};

const getStockHistory = async ({ id, tenant }) => {
  const item = await inventoryRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!item)
    throw new AppError("Inventory item not found", httpStatus.NOT_FOUND);

  return inventoryTransactionRepository.model
    .find({
      inventoryItemId: item._id,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
    })
    .sort({ createdAt: -1 });
};

const inventoryReport = async ({ tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    status: "active",
  };
  const [summary] = await inventoryRepository.model.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        itemCount: { $sum: 1 },
        totalStockValue: { $sum: { $multiply: ["$stockQuantity", "$purchasePrice"] } },
        lowStockCount: {
          $sum: {
            $cond: [{ $lte: ["$stockQuantity", "$minimumStock"] }, 1, 0],
          },
        },
      },
    },
  ]);
  const byCategory = await inventoryRepository.model.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $ifNull: ["$category", "Uncategorized"] },
        itemCount: { $sum: 1 },
        stockValue: { $sum: { $multiply: ["$stockQuantity", "$purchasePrice"] } },
      },
    },
    { $project: { _id: 0, category: "$_id", itemCount: 1, stockValue: 1 } },
    { $sort: { stockValue: -1 } },
  ]);

  return {
    itemCount: summary?.itemCount || 0,
    totalStockValue: Number((summary?.totalStockValue || 0).toFixed(2)),
    lowStockCount: summary?.lowStockCount || 0,
    byCategory,
  };
};

module.exports = {
  createInventoryItem,
  updateInventoryItem,
  getInventoryItem,
  listInventoryItems,
  adjustStock,
  listLowStock,
  getStockHistory,
  inventoryReport,
};
