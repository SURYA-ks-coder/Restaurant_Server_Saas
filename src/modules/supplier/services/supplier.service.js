const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const supplierRepository = require("../repositories/supplier.repository");

const buildFilter = (query, tenant) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  };
  if (query.status) filter.status = query.status;
  if (query.search)
    filter.supplierName = { $regex: query.search, $options: "i" };
  return filter;
};

const createSupplier = async ({ payload, tenant, user, file }) => {
  const exists = await supplierRepository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    supplierName: payload.supplierName,
    isDeleted: false,
  });
  if (exists)
    throw new AppError("Supplier already exists", httpStatus.CONFLICT);

  return supplierRepository.create({
    ...payload,
    image: file ? `/uploads/${file.filename}` : payload.image,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
};

const updateSupplier = async ({ id, payload, tenant, user, file }) => {
  const supplier = await supplierRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!supplier) throw new AppError("Supplier not found", httpStatus.NOT_FOUND);
  if (file) payload.image = `/uploads/${file.filename}`;
  return supplierRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteSupplier = async ({ id, tenant, user }) => {
  const supplier = await supplierRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!supplier) throw new AppError("Supplier not found", httpStatus.NOT_FOUND);
  return supplierRepository.softDeleteById(id, user.id);
};

const getSupplier = async ({ id, tenant }) => {
  const supplier = await supplierRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!supplier) throw new AppError("Supplier not found", httpStatus.NOT_FOUND);
  return supplier;
};

const listSuppliers = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, [
    "createdAt",
    "supplierName",
    "displayOrder",
    "status",
  ]);
  const [items, total] = await supplierRepository.paginate({
    filter: buildFilter(query, tenant),
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplier,
  listSuppliers,
};
