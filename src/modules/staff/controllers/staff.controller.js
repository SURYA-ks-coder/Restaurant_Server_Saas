const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const staffService = require("../services/staff.service");

const create = asyncHandler(async (req, res) => {
  const data = await staffService.createStaff({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Staff created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await staffService.updateStaff({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Staff updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await staffService.deleteStaff({ id: req.params.id, tenant: req.tenant });
  sendSuccess(res, { message: "Staff deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await staffService.getStaff({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Staff fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await staffService.listStaff({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Staff fetched", data: items, meta });
});

const listByRole = asyncHandler(async (req, res) => {
  const { items, meta } = await staffService.listStaffByRole({
    roleId: req.params.roleId,
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Staff fetched", data: items, meta });
});

const assignRole = asyncHandler(async (req, res) => {
  const data = await staffService.assignRoleToStaff({
    staffIds: req.body.staffIds,
    roleId: req.body.roleId,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Role assigned to staff", data });
});

module.exports = { create, update, remove, get, list, listByRole, assignRole };
