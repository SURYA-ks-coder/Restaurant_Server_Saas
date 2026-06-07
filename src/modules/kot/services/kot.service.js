const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const kotRepository = require("../repositories/kot.repository");
const billRepository = require("../../pos/repositories/pos.repository");
const { getIo } = require("../../../sockets");

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
  const updated = await kot.save();
  const io = getIo();
  if (io)
    io.to(`branch:${tenant.branchId}`).emit("kot:status:updated", {
      kotId: id,
      status: updated.status,
    });
  return updated;
};

const updateKotItemStatus = async ({ id, itemId, payload, tenant, user }) => {
  const kot = await kotRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!kot) throw new AppError("KOT not found", httpStatus.NOT_FOUND);
  console.log("Updating KOT item status", {
    id,
    itemId,
    status: payload.status,
    kot: kot.items,
  });
  const item = kot.items.id(itemId);
  if (!item) throw new AppError("KOT item not found", httpStatus.NOT_FOUND);
  item.status = payload.status;

  if (payload.status === "preparing") item.preparationStartedAt = new Date();
  if (payload.status === "ready") item.readyAt = new Date();
  await kot.save();
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
