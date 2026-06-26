const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const kotRepository = require("../repositories/kot.repository");
const billRepository = require("../../pos/repositories/pos.repository");
const inventoryRepository = require("../../inventory/repositories/inventory.repository");
const inventoryTransactionRepository = require("../../inventory/repositories/inventoryTransaction.repository");
const Recipe = require("../../inventory/models/Recipe.model");
const { getIo } = require("../../../sockets");
const { notify } = require("../../../sockets/notify");

// Deduct ingredients from stock for all items in a KOT based on Recipes.
// Non-blocking: logs warnings for missing recipes or insufficient stock.
const deductStockForKot = async ({ kot, tenant, userId }) => {
  for (const kotItem of kot.items) {
    const recipe = await Recipe.findOne({
      menuItemId: kotItem.menuItemId,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      isDeleted: false,
    });
    if (!recipe) continue;

    for (const ingredient of recipe.ingredients) {
      const deductQty = ingredient.quantity * (kotItem.quantity || 1);
      const invItem = await inventoryRepository.findOne({
        _id: ingredient.inventoryItemId,
        restaurantId: tenant.restaurantId,
        branchId: tenant.branchId,
      });
      if (!invItem) continue;

      const previousQuantity = invItem.stockQuantity;
      const updatedQuantity = previousQuantity - deductQty;

      await inventoryRepository.updateById(invItem._id, { stockQuantity: updatedQuantity });
      await inventoryTransactionRepository.create({
        restaurantId: tenant.restaurantId,
        branchId: tenant.branchId,
        inventoryItemId: invItem._id,
        type: "usage",
        referenceType: "kot",
        quantity: -deductQty,
        previousQuantity,
        updatedQuantity,
        referenceId: kot._id,
        notes: `KOT preparation: ${kotItem.itemName || kotItem.menuItemId}`,
        createdBy: userId,
      });

      const io = getIo();
      if (io && updatedQuantity <= invItem.minimumStock) {
        io.to(`branch:${tenant.branchId}`).emit("inventory:low-stock", {
          itemId: invItem._id,
          materialName: invItem.materialName,
          stockQuantity: updatedQuantity,
          minimumStock: invItem.minimumStock,
          branchId: tenant.branchId,
        });
        notify(tenant.branchId, {
          type: "low_stock",
          title: "Low Stock Alert",
          description: `${invItem.materialName} running low (${updatedQuantity} left)`,
          meta: { itemId: invItem._id, materialName: invItem.materialName, stockQuantity: updatedQuantity },
        });
      }
    }
  }
};

const createKot = async ({ payload, tenant, user }) => {
  const bill = await billRepository.findOne({
    _id: payload.billId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!bill) throw new AppError("Bill not found for KOT", httpStatus.NOT_FOUND);

  const kot = await kotRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });

  const io = getIo();
  if (io)
    io.to(`branch:${tenant.branchId}`).emit("kot:created", {
      kotId: kot._id,
      branchId: tenant.branchId,
      status: kot.status,
    });

  notify(tenant.branchId, {
    type: "kot_created",
    title: "New KOT",
    description: `${kot.items?.length || 0} items · ${kot.kitchenSection}`,
    meta: { kotId: kot._id, billId: payload.billId },
  });

  return kot;
};

const getKot = async ({ id, tenant }) => {
  const kot = await kotRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!kot) throw new AppError("KOT not found", httpStatus.NOT_FOUND);
  return kot;
};

const listKots = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "priority", "status"]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.status) filter.status = query.status;
  if (query.kitchenSection) filter.kitchenSection = query.kitchenSection;
  if (query.billId) filter.billId = query.billId;

  const [items, total] = await kotRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const updateKotStatus = async ({ id, payload, tenant, user }) => {
  const kot = await kotRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!kot) throw new AppError("KOT not found", httpStatus.NOT_FOUND);
  kot.status = payload.status;
  if (payload.status === "preparing") kot.preparationStartedAt = new Date();
  if (payload.status === "ready") kot.readyAt = new Date();
  kot.updatedBy = user.id;

  kot.items = kot.items?.map((each) => ({ ...each, status: payload.status === "ready" ? "ready" : each.status }));

  // Deduct stock ingredients once when chef starts preparation
  if (payload.status === "preparing" && !kot.stockDeducted) {
    await deductStockForKot({ kot, tenant, userId: user.id });
    kot.stockDeducted = true;
  }

  const updated = await kot.save();

  // Sync bill items status and bill status
  const bill = await billRepository.findOne({
    _id: kot.billId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (bill) {
    const kotItemStatusMap = {};
    kot.items.forEach((item) => {
      kotItemStatusMap[item.menuItemId.toString()] = item.status;
    });
    bill.items = bill.items.map((billItem) => {
      const syncedStatus = kotItemStatusMap[billItem.menuItemId.toString()];
      if (syncedStatus) billItem.status = syncedStatus;
      return billItem;
    });
    if (payload.status === "cancelled") bill.status = "cancelled";
    await bill.save();
  }

  const io = getIo();
  if (io)
    io.to(`branch:${tenant.branchId}`).emit("kot:status:updated", {
      kotId: id,
      status: updated.status,
    });

  if (payload.status === "ready") {
    notify(tenant.branchId, {
      type: "kot_ready",
      title: "Order Ready to Serve",
      description: kot.tableName
        ? `Table ${kot.tableName} is ready`
        : `KOT is ready for serving`,
      meta: { kotId: id, billId: kot.billId },
    });
  }

  return updated;
};

const updateKotItemStatus = async ({ id, itemId, payload, tenant, user }) => {
  const kot = await kotRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!kot) throw new AppError("KOT not found", httpStatus.NOT_FOUND);

  const item = kot.items.id(itemId);
  if (!item) throw new AppError("KOT item not found", httpStatus.NOT_FOUND);
  item.status = payload.status;

  if (payload.status === "preparing") item.preparationStartedAt = new Date();
  if (payload.status === "ready") item.readyAt = new Date();
  await kot.save();

  // Sync matching bill item status
  const bill = await billRepository.findOne({
    _id: kot.billId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (bill) {
    const menuItemIdStr = item.menuItemId.toString();
    const billItem = bill.items.find(
      (bi) => bi.menuItemId.toString() === menuItemIdStr,
    );
    if (billItem) {
      billItem.status = payload.status;
      await bill.save();
    }
  }

  if (payload.status === "preparing" || payload.status === "ready") {
    updateKotStatus({
      id,
      payload: { status: "preparing" },
      tenant,
      user,
    }).catch((err) => {
      console.error("Error updating KOT status to preparing:", err);
    });
  }
  const io = getIo();
  if (io)
    io.to(`branch:${tenant.branchId}`).emit("kot:item:status:updated", {
      kotId: id,
      itemId,
      status: payload.status,
    });
  return kot;
};

const updateKotPriority = async ({ id, payload, tenant, user }) => {
  const kot = await kotRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!kot) throw new AppError("KOT not found", httpStatus.NOT_FOUND);
  kot.priority = payload.priority;
  kot.updatedBy = user.id;
  const updated = await kot.save();
  const io = getIo();
  if (io)
    io.to(`branch:${tenant.branchId}`).emit("kot:priority:updated", {
      kotId: id,
      priority: updated.priority,
    });
  return updated;
};

const markKotServed = async ({ id, tenant, user }) => {
  const kot = await kotRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!kot) throw new AppError("KOT not found", httpStatus.NOT_FOUND);
  kot.status = "served";
  kot.updatedBy = user.id;
  const updated = await kot.save();
  const io = getIo();
  if (io) io.to(`branch:${tenant.branchId}`).emit("kot:served", { kotId: id });

  notify(tenant.branchId, {
    type: "kot_served",
    title: "Order Served",
    description: kot.tableName ? `Table ${kot.tableName} served` : "Order served",
    meta: { kotId: id },
  });

  return updated;
};

module.exports = {
  createKot,
  getKot,
  listKots,
  updateKotStatus,
  updateKotItemStatus,
  updateKotPriority,
  markKotServed,
};
