const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const QRCode = require("qrcode");
const env = require("../../../config/env");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const tableRepository = require("../repositories/table.repository");
const { getIo } = require("../../../sockets");

const STATUSES = ["available", "occupied", "reserved", "cleaning"];

const buildTableOrderUrl = ({ table, tenant }) => {
  const orderUrl = new URL("/qr-order", env.clientUrl);
  orderUrl.searchParams.set("restaurantId", String(tenant.restaurantId));
  orderUrl.searchParams.set("branchId", String(tenant.branchId));
  orderUrl.searchParams.set("tableId", String(table._id));
  orderUrl.searchParams.set("tableNumber", table.tableNumber);

  return orderUrl.toString();
};

const buildFilter = (query, tenant) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };

  if (query.status) filter.status = query.status;
  if (query.search) {
    const regex = { $regex: query.search, $options: "i" };
    filter.$or = [
      { tableName: regex },
      { tableNumber: regex },
      { floor: regex },
    ];
  }

  return filter;
};

const createTable = async ({ payload, tenant, user }) => {
  const exists = await tableRepository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    tableNumber: payload.tableNumber,
  });
  if (exists)
    throw new AppError("Table number already exists", httpStatus.CONFLICT);

  return tableRepository.create({
    ...payload,
    qrCode: payload.qrCode || null,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
};

const updateTable = async ({ id, payload, tenant, user }) => {
  const table = await tableRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!table) throw new AppError("Table not found", httpStatus.NOT_FOUND);

  if (payload.tableNumber && payload.tableNumber !== table.tableNumber) {
    const duplicate = await tableRepository.findOne({
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      tableNumber: payload.tableNumber,
      _id: { $ne: id },
    });
    if (duplicate)
      throw new AppError("Table number already exists", httpStatus.CONFLICT);
  }

  return tableRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const updateTableStatus = async ({ id, payload, tenant, user }) => {
  if (!payload.status || !STATUSES.includes(payload.status)) {
    throw new AppError(
      `Status must be one of: ${STATUSES.join(", ")}`,
      httpStatus.BAD_REQUEST,
    );
  }

  const table = await tableRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!table) throw new AppError("Table not found", httpStatus.NOT_FOUND);

  const updated = await tableRepository.updateById(id, {
    status: payload.status,
    updatedBy: user.id,
  });
  const io = getIo();
  if (io) {
    io.to(`branch:${tenant.branchId}`).emit("table:status:updated", {
      tableId: updated._id,
      tableNumber: updated.tableNumber,
      status: updated.status,
      branchId: tenant.branchId,
    });
  }
  return updated;
};

const generateTableQrCode = async ({ id, tenant, user }) => {
  const table = await tableRepository.findOne({
    _id: id, // table ID
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!table) throw new AppError("Table not found", httpStatus.NOT_FOUND);

  const orderUrl = buildTableOrderUrl({ table, tenant });
  const qrCodeDataUrl = await QRCode.toDataURL(orderUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  });
  await tableRepository.updateById(id, {
    qrCode: orderUrl,
    qrCodeDataUrl: qrCodeDataUrl,
    updatedBy: user.id,
  });

  return {
    qrCode: orderUrl,
    orderUrl,
    qrCodeDataUrl,
  };
};

const getTable = async ({ id, tenant }) => {
  const table = await tableRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!table) throw new AppError("Table not found", httpStatus.NOT_FOUND);
  return table;
};

const listTables = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, [
    "createdAt",
    "tableName",
    "tableNumber",
    "capacity",
    "floor",
    "status",
  ]);
  const [items, total] = await tableRepository.paginate({
    filter: buildFilter(query, tenant),
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const listActiveTables = async ({ query, tenant }) => {
  const activeQuery = { ...query };
  if (!activeQuery.status) activeQuery.status = { $in: STATUSES };

  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, [
    "createdAt",
    "tableName",
    "tableNumber",
    "capacity",
    "floor",
    "status",
  ]);
  const filter = buildFilter(query, tenant);
  if (!query.status) filter.status = { $in: STATUSES };

  const [items, total] = await tableRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createTable,
  updateTable,
  updateTableStatus,
  generateTableQrCode,
  getTable,
  listTables,
  listActiveTables,
};
