const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const warehouseRepository = require("../repositories/warehouse.repository");

const createWarehouse = async ({ payload, tenant, user }) => {
  const exists = await warehouseRepository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    name: payload.name,
    isDeleted: false,
  });
  if (exists)
    throw new AppError("Warehouse with this name already exists", httpStatus.CONFLICT);

  return warehouseRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
};

const updateWarehouse = async ({ id, payload, tenant, user }) => {
  const warehouse = await warehouseRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!warehouse)
    throw new AppError("Warehouse not found", httpStatus.NOT_FOUND);

  if (payload.name && payload.name !== warehouse.name) {
    const duplicate = await warehouseRepository.findOne({
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      name: payload.name,
      isDeleted: false,
      _id: { $ne: id },
    });
    if (duplicate)
      throw new AppError("Warehouse with this name already exists", httpStatus.CONFLICT);
  }

  return warehouseRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const getWarehouse = async ({ id, tenant }) => {
  const warehouse = await warehouseRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!warehouse)
    throw new AppError("Warehouse not found", httpStatus.NOT_FOUND);
  return warehouse;
};

const listWarehouses = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "name"]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  };
  if (query.type) filter.type = query.type;
  if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
  if (query.search) filter.name = { $regex: query.search, $options: "i" };

  const [items, total] = await warehouseRepository.paginate({ filter, sort, skip, limit });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const deleteWarehouse = async ({ id, tenant, user }) => {
  const warehouse = await warehouseRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!warehouse)
    throw new AppError("Warehouse not found", httpStatus.NOT_FOUND);

  return warehouseRepository.updateById(id, {
    isDeleted: true,
    deletedAt: new Date(),
    updatedBy: user.id,
  });
};

module.exports = {
  createWarehouse,
  updateWarehouse,
  getWarehouse,
  listWarehouses,
  deleteWarehouse,
};
