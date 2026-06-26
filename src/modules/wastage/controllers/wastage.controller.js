const { sendSuccess } = require("../../../helpers/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");
const wastageService = require("../services/wastage.service");

const record = asyncHandler(async (req, res) => {
  const data = await wastageService.recordWastage({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { statusCode: 201, message: "Wastage recorded and stock deducted", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await wastageService.getWastage({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Wastage record fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await wastageService.listWastage({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Wastage records fetched", data: items, meta });
});

const report = asyncHandler(async (req, res) => {
  const data = await wastageService.wastageReport({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Wastage report fetched", data });
});

module.exports = { record, get, list, report };
