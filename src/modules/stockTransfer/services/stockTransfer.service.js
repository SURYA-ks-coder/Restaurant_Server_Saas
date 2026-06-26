const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const stockTransferRepository = require("../repositories/stockTransfer.repository");
const inventoryRepository = require("../../inventory/repositories/inventory.repository");
const inventoryTransactionRepository = require("../../inventory/repositories/inventoryTransaction.repository");
const { getIo } = require("../../../sockets");
const { notify } = require("../../../sockets/notify");

const resolveInventoryItems = async (items, branchId, restaurantId) => {
  const resolved = [];
  for (const item of items) {
    const inv = await inventoryRepository.findOne({
      _id: item.inventoryItemId,
      restaurantId,
      branchId,
    });
    if (!inv)
      throw new AppError(
        `Inventory item not found in source branch: ${item.inventoryItemId}`,
        httpStatus.NOT_FOUND
      );
    resolved.push({ ...item, inventoryItemName: inv.materialName, unit: inv.unit });
  }
  return resolved;
};

const createTransfer = async ({ payload, tenant, user }) => {
  if (payload.fromBranchId === payload.toBranchId && !payload.fromWarehouseId && !payload.toWarehouseId)
    throw new AppError(
      "Source and destination must differ (branch or warehouse)",
      httpStatus.BAD_REQUEST
    );

  const resolvedItems = await resolveInventoryItems(
    payload.items,
    payload.fromBranchId,
    tenant.restaurantId
  );

  const transfer = await stockTransferRepository.create({
    ...payload,
    items: resolvedItems,
    restaurantId: tenant.restaurantId,
    requestedBy: user.id,
  });

  const io = getIo();
  if (io)
    io.to(`branch:${payload.fromBranchId}`).emit("stockTransfer:created", {
      transferId: transfer._id,
      status: transfer.status,
    });

  return transfer;
};

const approveTransfer = async ({ id, tenant, user }) => {
  const transfer = await stockTransferRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!transfer) throw new AppError("Transfer not found", httpStatus.NOT_FOUND);
  if (transfer.status !== "pending")
    throw new AppError(
      `Cannot approve a transfer in '${transfer.status}' status`,
      httpStatus.CONFLICT
    );

  return stockTransferRepository.updateById(id, {
    status: "approved",
    approvedBy: user.id,
  });
};

const completeTransfer = async ({ id, tenant, user }) => {
  const transfer = await stockTransferRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!transfer) throw new AppError("Transfer not found", httpStatus.NOT_FOUND);
  if (transfer.status !== "approved")
    throw new AppError(
      `Cannot complete a transfer in '${transfer.status}' status`,
      httpStatus.CONFLICT
    );

  for (const item of transfer.items) {
    // Deduct from source branch
    const sourceItem = await inventoryRepository.findOne({
      _id: item.inventoryItemId,
      restaurantId: tenant.restaurantId,
      branchId: transfer.fromBranchId,
    });
    if (!sourceItem)
      throw new AppError(
        `Source inventory item not found: ${item.inventoryItemId}`,
        httpStatus.NOT_FOUND
      );
    if (sourceItem.stockQuantity < item.quantity)
      throw new AppError(
        `Insufficient stock for '${sourceItem.materialName}' in source branch`,
        httpStatus.CONFLICT
      );

    const newSourceQty = sourceItem.stockQuantity - item.quantity;
    await inventoryRepository.updateById(sourceItem._id, { stockQuantity: newSourceQty });
    await inventoryTransactionRepository.create({
      restaurantId: tenant.restaurantId,
      branchId: transfer.fromBranchId,
      inventoryItemId: sourceItem._id,
      type: "transfer_out",
      quantity: -item.quantity,
      previousQuantity: sourceItem.stockQuantity,
      updatedQuantity: newSourceQty,
      referenceId: transfer._id,
      notes: `Transfer to branch ${transfer.toBranchId}`,
      createdBy: user.id,
    });

    // Add to destination branch (find or use same item id if inter-warehouse)
    const destItem = await inventoryRepository.findOne({
      _id: item.inventoryItemId,
      restaurantId: tenant.restaurantId,
      branchId: transfer.toBranchId,
    });

    if (destItem) {
      const newDestQty = destItem.stockQuantity + item.quantity;
      await inventoryRepository.updateById(destItem._id, { stockQuantity: newDestQty });
      await inventoryTransactionRepository.create({
        restaurantId: tenant.restaurantId,
        branchId: transfer.toBranchId,
        inventoryItemId: destItem._id,
        type: "transfer_in",
        quantity: item.quantity,
        previousQuantity: destItem.stockQuantity,
        updatedQuantity: newDestQty,
        referenceId: transfer._id,
        notes: `Transfer from branch ${transfer.fromBranchId}`,
        createdBy: user.id,
      });
    }

    // Emit low-stock alert for source if needed
    const io = getIo();
    if (io && newSourceQty <= sourceItem.minimumStock) {
      io.to(`branch:${transfer.fromBranchId}`).emit("inventory:low-stock", {
        itemId: sourceItem._id,
        materialName: sourceItem.materialName,
        stockQuantity: newSourceQty,
        minimumStock: sourceItem.minimumStock,
      });
      notify(transfer.fromBranchId, {
        type: "low_stock",
        title: "Low Stock Alert",
        description: `${sourceItem.materialName} running low (${newSourceQty} left)`,
        meta: { itemId: sourceItem._id, materialName: sourceItem.materialName },
      });
    }
  }

  return stockTransferRepository.updateById(id, {
    status: "completed",
    completedAt: new Date(),
    updatedBy: user.id,
  });
};

const rejectTransfer = async ({ id, payload, tenant, user }) => {
  const transfer = await stockTransferRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!transfer) throw new AppError("Transfer not found", httpStatus.NOT_FOUND);
  if (!["pending", "approved"].includes(transfer.status))
    throw new AppError(
      `Cannot reject a transfer in '${transfer.status}' status`,
      httpStatus.CONFLICT
    );

  return stockTransferRepository.updateById(id, {
    status: "rejected",
    rejectionReason: payload.reason,
    updatedBy: user.id,
  });
};

const getTransfer = async ({ id, tenant }) => {
  const transfer = await stockTransferRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!transfer) throw new AppError("Transfer not found", httpStatus.NOT_FOUND);
  return transfer;
};

const listTransfers = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "status"]);
  const filter = {
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  };
  if (query.status) filter.status = query.status;
  if (query.fromBranchId) filter.fromBranchId = query.fromBranchId;
  if (query.toBranchId) filter.toBranchId = query.toBranchId;

  const [items, total] = await stockTransferRepository.paginate({
    filter,
    sort,
    skip,
    limit,
    populate: [
      { path: "fromBranchId", select: "name" },
      { path: "toBranchId", select: "name" },
      { path: "requestedBy", select: "name email" },
      { path: "approvedBy", select: "name email" },
    ],
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createTransfer,
  approveTransfer,
  completeTransfer,
  rejectTransfer,
  getTransfer,
  listTransfers,
};
