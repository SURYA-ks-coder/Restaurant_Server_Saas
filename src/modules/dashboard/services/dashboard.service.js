const Bill = require("../../pos/models/Bill.model");
const Kot = require("../../kot/models/Kot.model");
const Customer = require("../../customer/Customer.model");
const DiningTable = require("../../table/models/DiningTable.model");
const User = require("../../auth/models/User.model");

// ── date helpers ──────────────────────────────────────────────────────────────
const _sod = (d = new Date()) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

const _startOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

const _revenueSum = async (filter) => {
  const [r] = await Bill.aggregate([
    { $match: { ...filter, status: { $ne: "cancelled" } } },
    { $group: { _id: null, total: { $sum: "$grandTotal" } } },
  ]);
  return r?.total || 0;
};

// ── 1. Overview ───────────────────────────────────────────────────────────────
const getOverview = async ({ tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const todayStart = _sod();
  const now = new Date();

  const [billAgg, tableAgg, kotQueue, staffCount] = await Promise.all([
    Bill.aggregate([
      { $match: { ...base, createdAt: { $gte: todayStart, $lte: now } } },
      {
        $group: {
          _id: null,
          todayRevenue: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$grandTotal", 0] },
          },
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          grandSum: { $sum: "$grandTotal" },
        },
      },
    ]),
    DiningTable.aggregate([
      { $match: base },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Kot.countDocuments({ ...base, status: { $in: ["pending", "preparing"] } }),
    User.countDocuments({
      restaurantId: tenant.restaurantId,
      branchIds: tenant.branchId,
      status: "active",
      isDeleted: false,
      role: { $in: ["manager", "cashier", "chef", "waiter", "inventory_staff"] },
    }),
  ]);

  const b = billAgg[0] || {
    todayRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    grandSum: 0,
  };
  const tMap = Object.fromEntries(tableAgg.map((t) => [t._id, t.count]));

  return {
    todayRevenue: b.todayRevenue,
    totalOrders: b.totalOrders,
    activeTables: (tMap.occupied || 0) + (tMap.reserved || 0),
    occupiedTables: tMap.occupied || 0,
    availableTables: tMap.available || 0,
    kitchenQueue: kotQueue,
    pendingOrders: b.pendingOrders,
    completedOrders: b.completedOrders,
    averageOrderValue:
      b.totalOrders > 0 ? Number((b.grandSum / b.totalOrders).toFixed(2)) : 0,
    staffOnDuty: staffCount,
  };
};

// ── 2. Revenue Summary ────────────────────────────────────────────────────────
const getRevenueSummary = async ({ tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const now = new Date();
  const todayStart = _sod();
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = _startOfWeek();
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);
  lastWeekEnd.setMilliseconds(-1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [today, yesterday, weekly, lastWeekRev, monthly, yearly] =
    await Promise.all([
      _revenueSum({ ...base, createdAt: { $gte: todayStart, $lte: now } }),
      _revenueSum({ ...base, createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      _revenueSum({ ...base, createdAt: { $gte: weekStart, $lte: now } }),
      _revenueSum({ ...base, createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd } }),
      _revenueSum({ ...base, createdAt: { $gte: monthStart, $lte: now } }),
      _revenueSum({ ...base, createdAt: { $gte: yearStart, $lte: now } }),
    ]);

  const revenueGrowthPercentage =
    lastWeekRev === 0
      ? weekly > 0 ? 100 : 0
      : Number(((weekly - lastWeekRev) / lastWeekRev) * 100).toFixed(2);

  return {
    todayRevenue: today,
    yesterdayRevenue: yesterday,
    weeklyRevenue: weekly,
    monthlyRevenue: monthly,
    yearlyRevenue: yearly,
    revenueGrowthPercentage: Number(revenueGrowthPercentage),
  };
};

// ── 3. Order Summary ──────────────────────────────────────────────────────────
const getOrderSummary = async ({ tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };

  const [orderAgg, itemAgg] = await Promise.all([
    Bill.aggregate([
      { $match: base },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: base },
      { $unwind: "$items" },
      { $group: { _id: "$items.status", count: { $sum: 1 } } },
    ]),
  ]);

  const oMap = Object.fromEntries(orderAgg.map((a) => [a._id, a.count]));
  const iMap = Object.fromEntries(itemAgg.map((a) => [a._id, a.count]));
  const total = Object.values(oMap).reduce((s, v) => s + v, 0);

  return {
    totalOrders: total,
    pendingOrders: oMap.pending || 0,
    preparingOrders: iMap.preparing || 0,
    readyOrders: iMap.ready || 0,
    servedOrders: iMap.served || 0,
    completedOrders: oMap.completed || 0,
    cancelledOrders: oMap.cancelled || 0,
  };
};

// ── 4. Table Summary ──────────────────────────────────────────────────────────
const getTableSummary = async ({ tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };

  const [agg, total] = await Promise.all([
    DiningTable.aggregate([
      { $match: base },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    DiningTable.countDocuments(base),
  ]);

  const map = Object.fromEntries(agg.map((a) => [a._id, a.count]));

  return {
    totalTables: total,
    occupiedTables: map.occupied || 0,
    availableTables: map.available || 0,
    reservedTables: map.reserved || 0,
    cleaningTables: map.cleaning || 0,
  };
};

// ── 5. Kitchen Summary ────────────────────────────────────────────────────────
const getKitchenSummary = async ({ tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const delayThreshold = new Date(Date.now() - 30 * 60 * 1000);

  const [statusAgg, prepAgg, delayed] = await Promise.all([
    Kot.aggregate([
      { $match: base },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Kot.aggregate([
      {
        $match: {
          ...base,
          preparationStartedAt: { $ne: null },
          readyAt: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avgMs: { $avg: { $subtract: ["$readyAt", "$preparationStartedAt"] } },
        },
      },
    ]),
    Kot.countDocuments({
      ...base,
      status: "preparing",
      preparationStartedAt: { $lt: delayThreshold },
    }),
  ]);

  const map = Object.fromEntries(statusAgg.map((a) => [a._id, a.count]));
  const avgMs = prepAgg[0]?.avgMs || 0;

  return {
    pendingKOT: map.pending || 0,
    preparingKOT: map.preparing || 0,
    readyKOT: map.ready || 0,
    averagePreparationTime: Number((avgMs / 60000).toFixed(1)),
    delayedOrders: delayed,
  };
};

// ── 6. Top Selling Items ──────────────────────────────────────────────────────
const getTopSellingItems = async ({ query, tenant }) => {
  const limit = Number(query.limit || 10);
  const match = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    status: { $ne: "cancelled" },
  };
  if (query.startDate) match.createdAt = { ...match.createdAt, $gte: new Date(query.startDate) };
  if (query.endDate) match.createdAt = { ...match.createdAt, $lte: new Date(query.endDate) };

  return Bill.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItemId",
        itemName: { $first: "$items.itemName" },
        quantitySold: { $sum: "$items.quantity" },
        revenueGenerated: { $sum: "$items.total" },
      },
    },
    { $sort: { quantitySold: -1, revenueGenerated: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        itemId: "$_id",
        itemName: 1,
        quantitySold: 1,
        revenueGenerated: 1,
      },
    },
  ]);
};

// ── 7. Recent Activities ──────────────────────────────────────────────────────
const getRecentActivities = async ({ query, tenant }) => {
  const limit = Number(query.limit || 10);
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };

  const bills = await Bill.find(base)
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate("createdBy", "name")
    .lean();

  return bills.map((b) => ({
    activityType:
      b.status === "completed"
        ? "order_completed"
        : b.status === "cancelled"
          ? "order_cancelled"
          : "order_created",
    description: `Bill #${b.billNo} — ${b.orderType} — ₹${b.grandTotal}`,
    performedBy: b.createdBy?.name || "System",
    timestamp: b.updatedAt,
  }));
};

// ── 8. Customer Summary ───────────────────────────────────────────────────────
const getCustomerSummary = async ({ tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const VIP_THRESHOLD = 100;

  const [total, newToday, returning, vip] = await Promise.all([
    Customer.countDocuments({ ...base, status: "active" }),
    Customer.countDocuments({ ...base, createdAt: { $gte: _sod() } }),
    Customer.countDocuments({ ...base, totalOrders: { $gt: 1 } }),
    Customer.countDocuments({ ...base, loyaltyPoints: { $gte: VIP_THRESHOLD } }),
  ]);

  return {
    totalCustomers: total,
    newCustomersToday: newToday,
    returningCustomers: returning,
    vipCustomers: vip,
  };
};

// ── 9. Branch Performance ─────────────────────────────────────────────────────
const getBranchPerformance = async ({ tenant }) => {
  const agg = await Bill.aggregate([
    {
      $match: {
        restaurantId: tenant.restaurantId,
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: "$branchId",
        totalRevenue: { $sum: "$grandTotal" },
        totalOrders: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "branches",
        localField: "_id",
        foreignField: "_id",
        as: "_branch",
      },
    },
    { $unwind: { path: "$_branch", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        branchId: "$_id",
        branchName: { $ifNull: ["$_branch.branchName", "Unknown"] },
        totalRevenue: 1,
        totalOrders: 1,
        averageOrderValue: {
          $cond: [
            { $gt: ["$totalOrders", 0] },
            { $round: [{ $divide: ["$totalRevenue", "$totalOrders"] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  return agg;
};

module.exports = {
  getOverview,
  getRevenueSummary,
  getOrderSummary,
  getTableSummary,
  getKitchenSummary,
  getTopSellingItems,
  getRecentActivities,
  getCustomerSummary,
  getBranchPerformance,
};
