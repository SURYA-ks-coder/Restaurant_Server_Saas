const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const purchaseRepository = require("../repositories/purchase.repository");
const inventoryRepository = require("../../inventory/repositories/inventory.repository");
const inventoryTransactionRepository = require("../../inventory/repositories/inventoryTransaction.repository");
const supplierRepository = require("../../supplier/repositories/supplier.repository");

const round2 = (value) => Number(Number(value).toFixed(2));

const generatePurchaseNumber = async (tenant) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = await purchaseRepository.model.countDocuments({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdAt: { $gte: startOfDay },
  });
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  return `PUR-${datePart}-${String(todayCount + 1).padStart(4, "0")}`;
};

const createPurchase = async ({ payload, tenant, user }) => {
  let supplier = null;
  if (payload.supplierId) {
    supplier = await supplierRepository.findOne({
      _id: payload.supplierId,
      restaurantId: tenant.restaurantId,
      isDeleted: false,
    });
    if (!supplier) throw new AppError("Supplier not found", httpStatus.NOT_FOUND);
  }

  // Resolve and snapshot every line item before touching stock.
  const resolvedItems = [];
  for (const line of payload.items) {
    const invItem = await inventoryRepository.findOne({
      _id: line.inventoryItemId,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
    });
    if (!invItem)
      throw new AppError(
        `Inventory item not found: ${line.inventoryItemId}`,
        httpStatus.NOT_FOUND,
      );
    resolvedItems.push({
      invItem,
      item: {
        inventoryItemId: invItem._id,
        inventoryItemName: invItem.materialName,
        unit: invItem.unit,
        quantity: line.quantity,
        unitCost: round2(line.unitCost),
        total: round2(line.quantity * line.unitCost),
      },
    });
  }

  const totalAmount = round2(
    resolvedItems.reduce((sum, { item }) => sum + item.total, 0),
  );

  const purchase = await purchaseRepository.create({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    purchaseNumber: await generatePurchaseNumber(tenant),
    supplierId: supplier ? supplier._id : null,
    supplierName: supplier ? supplier.supplierName : "",
    invoiceNumber: payload.invoiceNumber || "",
    purchaseDate: payload.purchaseDate || new Date(),
    items: resolvedItems.map(({ item }) => item),
    totalAmount,
    notes: payload.notes,
    createdBy: user.id,
  });

  // Raise stock, record the ledger entry, and keep the latest unit cost.
  for (const { invItem, item } of resolvedItems) {
    const previousQuantity = invItem.stockQuantity;
    const updatedQuantity = previousQuantity + item.quantity;

    await inventoryRepository.updateById(invItem._id, {
      stockQuantity: updatedQuantity,
      purchasePrice: item.unitCost,
      updatedBy: user.id,
    });
    await inventoryTransactionRepository.create({
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      inventoryItemId: invItem._id,
      type: "purchase",
      referenceType: "purchase",
      quantity: item.quantity,
      previousQuantity,
      updatedQuantity,
      referenceId: purchase._id,
      notes: `Purchase ${purchase.purchaseNumber}${
        purchase.supplierName ? ` from ${purchase.supplierName}` : ""
      }`,
      createdBy: user.id,
    });
  }

  return purchase;
};

const cancelPurchase = async ({ id, payload, tenant, user }) => {
  const purchase = await purchaseRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!purchase) throw new AppError("Purchase not found", httpStatus.NOT_FOUND);
  if (purchase.status !== "received")
    throw new AppError(
      `Cannot cancel a purchase in '${purchase.status}' status`,
      httpStatus.CONFLICT,
    );

  // Ensure the full reversal is possible before deducting anything.
  const reversals = [];
  for (const item of purchase.items) {
    const invItem = await inventoryRepository.findOne({
      _id: item.inventoryItemId,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
    });
    if (!invItem)
      throw new AppError(
        `Inventory item not found: ${item.inventoryItemName}`,
        httpStatus.NOT_FOUND,
      );
    if (invItem.stockQuantity < item.quantity)
      throw new AppError(
        `Cannot cancel: '${invItem.materialName}' has only ${invItem.stockQuantity} ${invItem.unit} left (needs ${item.quantity} reversed)`,
        httpStatus.CONFLICT,
      );
    reversals.push({ invItem, item });
  }

  for (const { invItem, item } of reversals) {
    const previousQuantity = invItem.stockQuantity;
    const updatedQuantity = previousQuantity - item.quantity;
    await inventoryRepository.updateById(invItem._id, {
      stockQuantity: updatedQuantity,
      updatedBy: user.id,
    });
    await inventoryTransactionRepository.create({
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      inventoryItemId: invItem._id,
      type: "adjustment",
      referenceType: "purchase",
      quantity: -item.quantity,
      previousQuantity,
      updatedQuantity,
      referenceId: purchase._id,
      notes: `Purchase ${purchase.purchaseNumber} cancelled${
        payload.reason ? `: ${payload.reason}` : ""
      }`,
      createdBy: user.id,
    });
  }

  return purchaseRepository.updateById(id, {
    status: "cancelled",
    cancellationReason: payload.reason || "",
    updatedBy: user.id,
  });
};

const getPurchase = async ({ id, tenant }) => {
  const purchase = await purchaseRepository.model
    .findOne({
      _id: id,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      isDeleted: false,
    })
    .populate([
      { path: "supplierId", select: "supplierName phone email" },
      { path: "createdBy", select: "name email" },
    ]);
  if (!purchase) throw new AppError("Purchase not found", httpStatus.NOT_FOUND);
  return purchase;
};

const listPurchases = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "purchaseDate", "totalAmount"]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  };
  if (query.status) filter.status = query.status;
  if (query.supplierId) filter.supplierId = query.supplierId;
  if (query.search)
    filter.$or = [
      { purchaseNumber: { $regex: query.search, $options: "i" } },
      { supplierName: { $regex: query.search, $options: "i" } },
      { invoiceNumber: { $regex: query.search, $options: "i" } },
    ];
  if (query.startDate || query.endDate) {
    filter.purchaseDate = {};
    if (query.startDate) filter.purchaseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.purchaseDate.$lte = new Date(query.endDate);
  }

  const [items, total] = await purchaseRepository.paginate({
    filter,
    sort,
    skip,
    limit,
    populate: [{ path: "supplierId", select: "supplierName" }],
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const purchaseSummary = async ({ query, tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
    status: "received",
  };
  if (query.startDate || query.endDate) {
    filter.purchaseDate = {};
    if (query.startDate) filter.purchaseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.purchaseDate.$lte = new Date(query.endDate);
  }

  const [summary] = await purchaseRepository.model.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        purchaseCount: { $sum: 1 },
        totalSpend: { $sum: "$totalAmount" },
      },
    },
  ]);
  const bySupplier = await purchaseRepository.model.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $ifNull: ["$supplierName", ""] },
        purchaseCount: { $sum: 1 },
        totalSpend: { $sum: "$totalAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        supplierName: { $cond: [{ $eq: ["$_id", ""] }, "No supplier", "$_id"] },
        purchaseCount: 1,
        totalSpend: 1,
      },
    },
    { $sort: { totalSpend: -1 } },
    { $limit: 10 },
  ]);

  return {
    purchaseCount: summary?.purchaseCount || 0,
    totalSpend: round2(summary?.totalSpend || 0),
    bySupplier,
  };
};

module.exports = {
  createPurchase,
  cancelPurchase,
  getPurchase,
  listPurchases,
  purchaseSummary,
};
