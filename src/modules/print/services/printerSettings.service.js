const crypto = require("crypto");
const printerSettingsRepository = require("../repositories/printerSettings.repository");
const { isAgentOnline } = require("./printAgentGateway");

const getOrCreateSettings = async ({ tenant }) => {
  let settings = await printerSettingsRepository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!settings) {
    settings = await printerSettingsRepository.create({
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      printers: [],
    });
  }
  return settings;
};

const updateSettings = async ({ payload, tenant, user }) => {
  const settings = await getOrCreateSettings({ tenant });
  if (payload.receipt) Object.assign(settings.receipt, payload.receipt);
  if (payload.kot) Object.assign(settings.kot, payload.kot);
  if (payload.qrOrderSlip) Object.assign(settings.qrOrderSlip, payload.qrOrderSlip);
  settings.updatedBy = user.id;
  return settings.save();
};

const addPrinter = async ({ payload, tenant, user }) => {
  const settings = await getOrCreateSettings({ tenant });
  settings.printers.push(payload);
  settings.updatedBy = user.id;
  await settings.save();
  return settings;
};

const updatePrinter = async ({ printerId, payload, tenant, user }) => {
  const settings = await getOrCreateSettings({ tenant });
  const printer = settings.printers.id(printerId);
  if (!printer) return null;
  Object.assign(printer, payload);
  settings.updatedBy = user.id;
  await settings.save();
  return settings;
};

const removePrinter = async ({ printerId, tenant, user }) => {
  const settings = await getOrCreateSettings({ tenant });
  const printer = settings.printers.id(printerId);
  if (!printer) return null;
  printer.deleteOne();
  settings.updatedBy = user.id;
  await settings.save();
  return settings;
};

// Generates (or rotates) the branch's print-agent key. The key is returned
// once here; it is never included in normal settings reads (select: false).
// Rotating disconnects nothing immediately but any agent using the old key
// will fail its next reconnect.
const generateAgentKey = async ({ tenant, user }) => {
  const settings = await getOrCreateSettings({ tenant });
  const agentKey = crypto.randomBytes(32).toString("hex");
  settings.agentKey = agentKey;
  settings.updatedBy = user.id;
  await settings.save();
  return { agentKey, branchId: String(tenant.branchId) };
};

const getAgentStatus = async ({ tenant }) => ({
  branchId: String(tenant.branchId),
  online: await isAgentOnline(tenant.branchId),
});

module.exports = {
  getOrCreateSettings,
  updateSettings,
  addPrinter,
  updatePrinter,
  removePrinter,
  generateAgentKey,
  getAgentStatus,
};
