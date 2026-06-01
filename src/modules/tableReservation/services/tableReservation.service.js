const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const reservationRepository = require("../repositories/tableReservation.repository");
const tableRepository = require("../../table/repositories/table.repository");
const { getIo } = require("../../../sockets");

const ACTIVE_STATUSES = ["pending", "confirmed", "seated"];
const FINAL_STATUSES = ["completed", "cancelled", "no_show"];

const populate = [
  { path: "tableId", select: "tableName tableNumber capacity floor status" },
  { path: "customerId", select: "customerName mobileNumber" },
];

const buildFilter = (query, tenant) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };

  if (query.tableId) filter.tableId = query.tableId;
  if (query.customerId) filter.customerId = query.customerId;
  if (query.status) filter.status = query.status;
  if (query.from || query.to) {
    filter.startAt = {};
    if (query.from) filter.startAt.$gte = query.from;
    if (query.to) filter.startAt.$lte = query.to;
  }
  if (query.search) {
    const regex = { $regex: query.search, $options: "i" };
    filter.$or = [{ customerName: regex }, { mobileNumber: regex }];
  }

  return filter;
};

const assertTableBelongsToTenant = async ({ tableId, tenant }) => {
  const table = await tableRepository.findOne({
    _id: tableId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!table) throw new AppError("Table not found", httpStatus.NOT_FOUND);
  return table;
};

const assertValidDateRange = ({ startAt, endAt }) => {
  if (endAt <= startAt) {
    throw new AppError("endAt must be after startAt", httpStatus.BAD_REQUEST);
  }
};

const assertNoOverlap = async ({ reservation, tenant, excludeId }) => {
  if (!ACTIVE_STATUSES.includes(reservation.status)) return;

  const conflict = await reservationRepository.findOne(cleanFilter({
    _id: excludeId ? { $ne: excludeId } : undefined,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    tableId: reservation.tableId,
    status: { $in: ACTIVE_STATUSES },
    startAt: { $lt: reservation.endAt },
    endAt: { $gt: reservation.startAt },
  }));
  if (conflict) {
    throw new AppError(
      "Table already has an active reservation for this time",
      httpStatus.CONFLICT,
    );
  }
};

const emitTableStatus = (table, tenant) => {
  const io = getIo();
  if (!io || !table) return;
  io.to(`branch:${tenant.branchId}`).emit("table:status:updated", {
    tableId: table._id,
    tableNumber: table.tableNumber,
    status: table.status,
    branchId: tenant.branchId,
  });
};

const syncTableStatus = async ({ tableId, reservationStatus, tenant, user }) => {
  let nextStatus = null;
  if (reservationStatus === "confirmed") nextStatus = "reserved";
  if (reservationStatus === "seated") nextStatus = "occupied";
  if (FINAL_STATUSES.includes(reservationStatus)) nextStatus = "available";
  if (!nextStatus) return;

  const table = await tableRepository.updateById(tableId, {
    status: nextStatus,
    updatedBy: user.id,
  });
  emitTableStatus(table, tenant);
};

const cleanFilter = (filter) =>
  Object.fromEntries(Object.entries(filter).filter(([, value]) => value !== undefined));

const createReservation = async ({ payload, tenant, user }) => {
  assertValidDateRange(payload);
  const table = await assertTableBelongsToTenant({ tableId: payload.tableId, tenant });
  if (payload.guestCount > table.capacity) {
    throw new AppError("Guest count exceeds table capacity", httpStatus.BAD_REQUEST);
  }

  await assertNoOverlap({
    reservation: payload,
    tenant,
  });

  const reservation = await reservationRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
  await syncTableStatus({
    tableId: reservation.tableId,
    reservationStatus: reservation.status,
    tenant,
    user,
  });
  return reservation.populate(populate);
};

const updateReservation = async ({ id, payload, tenant, user }) => {
  const reservation = await reservationRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!reservation) throw new AppError("Table reservation not found", httpStatus.NOT_FOUND);

  const nextReservation = {
    tableId: payload.tableId || reservation.tableId,
    guestCount: payload.guestCount || reservation.guestCount,
    startAt: payload.startAt || reservation.startAt,
    endAt: payload.endAt || reservation.endAt,
    status: payload.status || reservation.status,
  };
  assertValidDateRange(nextReservation);

  const table = await assertTableBelongsToTenant({
    tableId: nextReservation.tableId,
    tenant,
  });
  if (nextReservation.guestCount > table.capacity) {
    throw new AppError("Guest count exceeds table capacity", httpStatus.BAD_REQUEST);
  }
  await assertNoOverlap({
    reservation: nextReservation,
    tenant,
    excludeId: id,
  });

  const updated = await reservationRepository.updateById(id, {
    ...payload,
    updatedBy: user.id,
  });
  await syncTableStatus({
    tableId: updated.tableId,
    reservationStatus: updated.status,
    tenant,
    user,
  });
  return updated.populate(populate);
};

const updateReservationStatus = async ({ id, payload, tenant, user }) => {
  const reservation = await reservationRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!reservation) throw new AppError("Table reservation not found", httpStatus.NOT_FOUND);

  await assertNoOverlap({
    reservation: {
      tableId: reservation.tableId,
      startAt: reservation.startAt,
      endAt: reservation.endAt,
      status: payload.status,
    },
    tenant,
    excludeId: id,
  });

  const updated = await reservationRepository.updateById(id, {
    status: payload.status,
    cancellationReason: payload.cancellationReason,
    updatedBy: user.id,
  });
  await syncTableStatus({
    tableId: updated.tableId,
    reservationStatus: updated.status,
    tenant,
    user,
  });
  return updated.populate(populate);
};

const getReservation = async ({ id, tenant }) => {
  const reservation = await reservationRepository.model
    .findOne({
      _id: id,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
    })
    .populate(populate);
  if (!reservation) throw new AppError("Table reservation not found", httpStatus.NOT_FOUND);
  return reservation;
};

const listReservations = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "startAt", "endAt", "guestCount", "status"]);
  const [items, total] = await reservationRepository.paginate({
    filter: cleanFilter(buildFilter(query, tenant)),
    sort,
    skip,
    limit,
    populate,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createReservation,
  updateReservation,
  updateReservationStatus,
  getReservation,
  listReservations,
};
