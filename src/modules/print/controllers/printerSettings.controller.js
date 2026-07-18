const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const printerSettingsService = require("../services/printerSettings.service");

const get = asyncHandler(async (req, res) => {
  const data = await printerSettingsService.getOrCreateSettings({ tenant: req.tenant });
  sendSuccess(res, { message: "Printer settings fetched", data });
});

const update = asyncHandler(async (req, res) => {
  const data = await printerSettingsService.updateSettings({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Printer settings updated", data });
});

const addPrinter = asyncHandler(async (req, res) => {
  const data = await printerSettingsService.addPrinter({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Printer added", data });
});

const updatePrinter = asyncHandler(async (req, res) => {
  const data = await printerSettingsService.updatePrinter({
    printerId: req.params.printerId,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Printer updated", data });
});

const removePrinter = asyncHandler(async (req, res) => {
  const data = await printerSettingsService.removePrinter({
    printerId: req.params.printerId,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Printer removed", data });
});

const generateAgentKey = asyncHandler(async (req, res) => {
  const data = await printerSettingsService.generateAgentKey({
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    message: "Print agent key generated — store it now, it is not shown again",
    data,
  });
});

const getAgentStatus = asyncHandler(async (req, res) => {
  const data = await printerSettingsService.getAgentStatus({ tenant: req.tenant });
  sendSuccess(res, { message: "Print agent status fetched", data });
});

module.exports = {
  get,
  update,
  addPrinter,
  updatePrinter,
  removePrinter,
  generateAgentKey,
  getAgentStatus,
};
