const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const billRepository = require("../../pos/repositories/pos.repository");
const kotRepository = require("../../kot/repositories/kot.repository");
const qrOrderRepository = require("../../qrOrder/repositories/qrOrder.repository");
const branchRepository = require("../../branch/repositories/branch.repository");
const Restaurant = require("../../restaurant/models/Restaurant.model");
const printerSettingsRepository = require("../repositories/printerSettings.repository");
const { buildKotDocument, buildBillDocument, buildQrOrderDocument } = require("./documentBuilders");
const { renderHtml } = require("./htmlRenderer");
const { printToNetwork, buildBuffer } = require("./escposRenderer");
const { isAgentOnline, sendPrintJob } = require("./printAgentGateway");

const loadContext = async (tenant) => {
  const [branch, restaurant, settings] = await Promise.all([
    branchRepository.findOne({ _id: tenant.branchId }),
    Restaurant.findOne({ _id: tenant.restaurantId }),
    printerSettingsRepository.findOne({
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
    }),
  ]);
  return { branch, restaurant, settings };
};

const matchingPrinters = ({ settings, purpose, kitchenSection }) => {
  if (!settings?.printers?.length) return [];
  return settings.printers.filter((printer) => {
    if (printer.purpose !== purpose || !printer.isActive) return false;
    if (purpose === "kot" && printer.kitchenSections?.length) {
      return printer.kitchenSections.includes(kitchenSection);
    }
    return true;
  });
};

// LAN printers are reached one of two ways:
//  - via the branch's on-site print agent (cloud deployments, agent connected)
//  - direct TCP from this server (on-premise deployments, or agent offline)
const dispatchToPrinters = async (printers, doc, branchId) => {
  const results = [];
  if (!printers.length) return results;

  const agentOnline = branchId ? await isAgentOnline(branchId) : false;

  for (const printer of printers) {
    if (printer.connectionType !== "lan") {
      results.push({ printerId: printer._id, name: printer.name, connectionType: printer.connectionType, dispatched: false });
      continue;
    }

    if (agentOnline) {
      try {
        const response = await sendPrintJob(branchId, {
          printerId: String(printer._id),
          name: printer.name,
          ip: printer.ip,
          port: printer.port || 9100,
          data: buildBuffer(doc).toString("base64"),
        });
        results.push({
          printerId: printer._id,
          name: printer.name,
          connectionType: "lan",
          via: "agent",
          dispatched: !!response.ok,
          ...(response.ok ? {} : { error: response.error || "Agent failed to print" }),
        });
        continue;
      } catch (error) {
        // Agent unreachable mid-dispatch — fall through to a direct attempt
      }
    }

    try {
      await printToNetwork({ ip: printer.ip, port: printer.port }, doc);
      results.push({ printerId: printer._id, name: printer.name, connectionType: "lan", via: "direct", dispatched: true });
    } catch (error) {
      results.push({
        printerId: printer._id,
        name: printer.name,
        connectionType: "lan",
        via: agentOnline ? "agent" : "direct",
        dispatched: false,
        error: error.message,
      });
    }
  }
  return results;
};

const printKot = async ({ kotId, tenant, dispatch = true }) => {
  const kot = await kotRepository.findOne({
    _id: kotId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!kot) throw new AppError("KOT not found", httpStatus.NOT_FOUND);

  const { branch, restaurant, settings } = await loadContext(tenant);
  const doc = buildKotDocument({ kot, branch, restaurant, settings, paperWidth: "80mm" });
  const html = renderHtml(doc);
  const printers = matchingPrinters({ settings, purpose: "kot", kitchenSection: kot.kitchenSection });
  const dispatched = dispatch ? await dispatchToPrinters(printers, doc, tenant.branchId) : [];

  return { html, printers: dispatched };
};

const printBill = async ({ billId, tenant, dispatch = true }) => {
  const bill = await billRepository.findOne({
    _id: billId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!bill) throw new AppError("Bill not found", httpStatus.NOT_FOUND);

  const { branch, restaurant, settings } = await loadContext(tenant);
  const doc = buildBillDocument({ bill, branch, restaurant, settings, paperWidth: "80mm" });
  const html = renderHtml(doc);
  const printers = matchingPrinters({ settings, purpose: "bill" });
  const dispatched = dispatch ? await dispatchToPrinters(printers, doc, tenant.branchId) : [];

  return { html, printers: dispatched };
};

const printQrOrder = async ({ qrOrderId, tenant, dispatch = true }) => {
  const qrOrder = await qrOrderRepository.findOne({
    _id: qrOrderId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!qrOrder) throw new AppError("QR order not found", httpStatus.NOT_FOUND);

  const { branch, restaurant, settings } = await loadContext(tenant);
  const doc = buildQrOrderDocument({ qrOrder, branch, restaurant, settings, paperWidth: "80mm" });
  const html = renderHtml(doc);
  const printers = matchingPrinters({ settings, purpose: "qr_order" });
  const dispatched = dispatch ? await dispatchToPrinters(printers, doc, tenant.branchId) : [];

  return { html, printers: dispatched };
};

module.exports = { printKot, printBill, printQrOrder };
