const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const roleService = require("../services/role.service");

const create = asyncHandler(async (req, res) => {
  const data = await roleService.createRole({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Role created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await roleService.updateRole({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Role updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await roleService.deleteRole({ id: req.params.id, tenant: req.tenant });
  sendSuccess(res, { message: "Role deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await roleService.getRole({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Role fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await roleService.listRoles({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Roles fetched", data: items, meta });
});

module.exports = { create, update, remove, get, list };
