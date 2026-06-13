const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const departmentService = require("../services/department.service");

const create = asyncHandler(async (req, res) => {
  const data = await departmentService.createDepartment({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Department created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await departmentService.updateDepartment({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Department updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await departmentService.deleteDepartment({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Department deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await departmentService.getDepartment({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Department fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await departmentService.listDepartments({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Departments fetched", data: items, meta });
});

module.exports = { create, update, remove, get, list };
