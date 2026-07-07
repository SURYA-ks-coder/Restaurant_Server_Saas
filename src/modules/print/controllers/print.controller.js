const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const printService = require("../services/print.service");

const printKot = asyncHandler(async (req, res) => {
  const data = await printService.printKot({ kotId: req.params.id, tenant: req.tenant });
  sendSuccess(res, { message: "KOT print dispatched", data });
});

const previewKot = asyncHandler(async (req, res) => {
  const { html } = await printService.printKot({
    kotId: req.params.id,
    tenant: req.tenant,
    dispatch: false,
  });
  res.set("Content-Type", "text/html").send(html);
});

const printBill = asyncHandler(async (req, res) => {
  const data = await printService.printBill({ billId: req.params.id, tenant: req.tenant });
  sendSuccess(res, { message: "Bill print dispatched", data });
});

const previewBill = asyncHandler(async (req, res) => {
  const { html } = await printService.printBill({
    billId: req.params.id,
    tenant: req.tenant,
    dispatch: false,
  });
  res.set("Content-Type", "text/html").send(html);
});

const printQrOrder = asyncHandler(async (req, res) => {
  const data = await printService.printQrOrder({ qrOrderId: req.params.id, tenant: req.tenant });
  sendSuccess(res, { message: "QR order slip print dispatched", data });
});

const previewQrOrder = asyncHandler(async (req, res) => {
  const { html } = await printService.printQrOrder({
    qrOrderId: req.params.id,
    tenant: req.tenant,
    dispatch: false,
  });
  res.set("Content-Type", "text/html").send(html);
});

module.exports = {
  printKot,
  previewKot,
  printBill,
  previewBill,
  printQrOrder,
  previewQrOrder,
};
