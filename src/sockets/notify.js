const { getIo } = require(".");

// Revenue milestones in INR that trigger a "Sales milestone" notification
const DAILY_MILESTONES = [10000, 25000, 50000, 100000, 250000, 500000];

/**
 * Emit a unified notification:new event to everyone in the branch room.
 * Shape is stable — the frontend maps `type` to an icon.
 */
const notify = (branchId, { type, title, description, meta = {} }) => {
  const io = getIo();
  if (!io) return;
  io.to(`branch:${branchId}`).emit("notification:new", {
    type,
    title,
    description,
    meta,
    timestamp: new Date().toISOString(),
  });
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
