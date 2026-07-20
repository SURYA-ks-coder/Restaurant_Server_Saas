const { getIo } = require(".");
const logger = require("../config/logger");

// Revenue milestones in INR that trigger a "Sales milestone" notification
const DAILY_MILESTONES = [10000, 25000, 50000, 100000, 250000, 500000];

// branchId -> restaurantId, so persistence doesn't need a Branch lookup on
// every single notification (branches never change tenant).
const branchRestaurantCache = new Map();

const resolveRestaurantId = async (branchId) => {
  const key = String(branchId);
  if (branchRestaurantCache.has(key)) return branchRestaurantCache.get(key);

  // Required lazily to avoid a require cycle (model -> ... -> sockets)
  const Branch = require("../modules/branch/models/Branch.model");
  const branch = await Branch.findById(branchId).select("restaurantId").lean();
  if (!branch) return null;

  branchRestaurantCache.set(key, branch.restaurantId);
  return branch.restaurantId;
};

const persistNotification = async (branchId, { type, title, description, meta }) => {
  const restaurantId = await resolveRestaurantId(branchId);
  if (!restaurantId) return;

  // Required lazily to avoid a require cycle (model -> ... -> sockets)
  const Notification = require("../modules/notification/models/Notification.model");
  await Notification.create({
    restaurantId,
    branchId,
    type,
    title,
    message: description || "",
    payload: meta || {},
  });
};

/**
 * Emit a unified notification:new event to everyone in the branch room, and
 * persist it so the bell has history across refreshes/reconnects instead of
 * only what arrived while a socket happened to be open.
 * Shape is stable — the frontend maps `type` to an icon.
 */
const notify = (branchId, { type, title, description, meta = {} }) => {
  const io = getIo();
  if (io) {
    io.to(`branch:${branchId}`).emit("notification:new", {
      type,
      title,
      description,
      meta,
      timestamp: new Date().toISOString(),
    });
  }

  persistNotification(branchId, { type, title, description, meta }).catch(
    (error) => logger.error(`Failed to persist notification: ${error.message}`),
  );
};

/**
 * Check whether today's cumulative revenue just crossed a preset milestone.
 * Call after a payment is recorded with the previous and current totals.
 */
const checkSalesMilestone = (branchId, prevRevenue, currentRevenue) => {
  const crossed = DAILY_MILESTONES.find(
    (m) => prevRevenue < m && currentRevenue >= m,
  );
  if (!crossed) return;
  notify(branchId, {
    type: "sales_milestone",
    title: "Sales Milestone Reached!",
    description: `Daily revenue crossed ₹${crossed.toLocaleString("en-IN")}`,
    meta: { milestone: crossed, currentRevenue },
  });
};

module.exports = { notify, checkSalesMilestone };
