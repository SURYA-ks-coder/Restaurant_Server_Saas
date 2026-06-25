const Bill = require("../../pos/models/Bill.model");
const Kot = require("../../kot/models/Kot.model");
const Customer = require("../../customer/Customer.model");
const DiningTable = require("../../table/models/DiningTable.model");
const User = require("../../auth/models/User.model");
const MenuItem = require("../../menuItem/models/MenuItem.model");
const Branch = require("../../branch/models/Branch.model");

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

const _growthPct = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number(((current - previous) / previous) * 100).toFixed(1) * 1;
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
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(monthStart);
  lastMonthEnd.setMilliseconds(-1);

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(yearStart);
  lastYearEnd.setMilliseconds(-1);

  const [today, yesterday, weekly, lastWeekRev, monthly, lastMonthRev, yearly, lastYearRev] =
    await Promise.all([
      _revenueSum({ ...base, createdAt: { $gte: todayStart, $lte: now } }),
      _revenueSum({ ...base, createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      _revenueSum({ ...base, createdAt: { $gte: weekStart, $lte: now } }),
      _revenueSum({ ...base, createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd } }),
      _revenueSum({ ...base, createdAt: { $gte: monthStart, $lte: now } }),
      _revenueSum({ ...base, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
      _revenueSum({ ...base, createdAt: { $gte: yearStart, $lte: now } }),
      _revenueSum({ ...base, createdAt: { $gte: lastYearStart, $lte: lastYearEnd } }),
    ]);

  return {
    today: {
      revenue: today,
      growth: _growthPct(today, yesterday),
    },
    thisWeek: {
      revenue: weekly,
      growth: _growthPct(weekly, lastWeekRev),
    },
    thisMonth: {
      revenue: monthly,
      growth: _growthPct(monthly, lastMonthRev),
    },
    thisYear: {
      revenue: yearly,
      growth: _growthPct(yearly, lastYearRev),
    },
  };
};

// ── 2b. Hourly Revenue ────────────────────────────────────────────────────────
const getHourlyRevenue = async ({ query, tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const targetDate = query.date ? new Date(query.date) : new Date();
  const dayStart = _sod(targetDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const agg = await Bill.aggregate([
    {
      $match: {
        ...base,
        status: { $ne: "cancelled" },
        createdAt: { $gte: dayStart, $lte: dayEnd },
      },
    },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        revenue: { $sum: "$grandTotal" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const formatHour = (h) => {
    if (h === 0) return "12AM";
    if (h < 12) return `${h}AM`;
    if (h === 12) return "12PM";
    return `${h - 12}PM`;
  };

  return agg.map(({ _id, revenue, orders }) => ({
    hour: _id,
    label: formatHour(_id),
    revenue: Number(revenue.toFixed(2)),
    orders,
  }));
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
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const limit = Number(query.limit || 5);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDate = query.startDate ? new Date(query.startDate) : monthStart;
  const endDate = query.endDate ? new Date(query.endDate) : now;

  // Previous period: equal-length window immediately before startDate
  const periodMs = endDate - startDate;
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);

  const baseMatch = { ...base, status: { $ne: "cancelled" } };

  const [currentItems, prevItems] = await Promise.all([
    Bill.aggregate([
      { $match: { ...baseMatch, createdAt: { $gte: startDate, $lte: endDate } } },
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
    ]),
    Bill.aggregate([
      { $match: { ...baseMatch, createdAt: { $gte: prevStart, $lte: prevEnd } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItemId",
          revenueGenerated: { $sum: "$items.total" },
        },
      },
    ]),
  ]);

  const prevMap = Object.fromEntries(
    prevItems.map((i) => [i._id.toString(), i.revenueGenerated]),
  );

  return currentItems.map((item, idx) => {
    const prevRevenue = prevMap[item._id.toString()] || 0;
    const trend =
      item.revenueGenerated > prevRevenue
        ? "up"
        : item.revenueGenerated < prevRevenue
          ? "down"
          : "same";
    return {
      rank: idx + 1,
      itemId: item._id,
      itemName: item.itemName,
      quantitySold: item.quantitySold,
      revenueGenerated: Number(item.revenueGenerated.toFixed(2)),
      trend,
    };
  });
};

// ── 7. Recent Activities ──────────────────────────────────────────────────────
const getRecentActivities = async ({ query, tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const limit = Number(query.limit || 10);
  const each = Math.max(limit, 5);

  const [bills, tables, staff, menuItems, branches] = await Promise.all([
    Bill.find(base)
      .sort({ updatedAt: -1 })
      .limit(each)
      .populate("tableId", "tableName tableNumber")
      .lean(),

    DiningTable.find({ ...base })
      .sort({ updatedAt: -1 })
      .limit(each)
      .lean(),

    User.find({
      restaurantId: base.restaurantId,
      branchIds: base.branchId,
      role: { $in: ["manager", "cashier", "chef", "waiter", "inventory_staff"] },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(each)
      .lean(),

    MenuItem.find({ ...base, isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(each)
      .lean(),

    Branch.find({ restaurantId: base.restaurantId, isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean(),
  ]);

  const activities = [];

  for (const b of bills) {
    const type =
      b.status === "completed"
        ? "order_completed"
        : b.status === "cancelled"
          ? "order_cancelled"
          : "order_updated";
    const label =
      b.status === "completed"
        ? "Completed"
        : b.status === "cancelled"
          ? "Cancelled"
          : "Updated";
    activities.push({
      type,
      title: `Order #${b.billNo} ${label}`,
      description: b.tableId
        ? `Table ${b.tableId.tableNumber || b.tableId.tableName}`
        : b.orderType,
      timestamp: b.updatedAt,
    });
  }

  for (const t of tables) {
    activities.push({
      type: "table_closed",
      title: `Table ${t.tableNumber || t.tableName} Closed`,
      description: `Status changed to ${t.status}`,
      timestamp: t.updatedAt,
    });
  }

  for (const u of staff) {
    activities.push({
      type: "staff_added",
      title: "New Staff Added",
      description: `${u.name} joined as ${u.role}`,
      timestamp: u.createdAt,
    });
  }

  for (const m of menuItems) {
    activities.push({
      type: "menu_updated",
      title: "Menu Updated",
      description: `${m.itemName} was modified`,
      timestamp: m.updatedAt,
    });
  }

  for (const br of branches) {
    activities.push({
      type: "branch_settings",
      title: "Branch Settings Modified",
      description: br.branchName,
      timestamp: br.updatedAt,
    });
  }

  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

// ── 8. Customer Summary ───────────────────────────────────────────────────────
const getCustomerSummary = async ({ tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const VIP_THRESHOLD = 100;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [total, newThisMonth, returning, vip, avgVisitsAgg] = await Promise.all([
    Customer.countDocuments({ ...base, status: "active" }),
    Customer.countDocuments({ ...base, createdAt: { $gte: monthStart } }),
    Customer.countDocuments({ ...base, totalOrders: { $gt: 1 } }),
    Customer.countDocuments({ ...base, loyaltyPoints: { $gte: VIP_THRESHOLD } }),
    // Avg visits/week: avg orders per customer who visited in the last 7 days
    Bill.aggregate([
      {
        $match: {
          ...base,
          status: { $ne: "cancelled" },
          customerId: { $ne: null },
          createdAt: { $gte: weekAgo, $lte: now },
        },
      },
      { $group: { _id: "$customerId", visits: { $sum: 1 } } },
      { $group: { _id: null, avgVisits: { $avg: "$visits" } } },
    ]),
  ]);

  const avgVisitsPerWeek = avgVisitsAgg[0]
    ? Number(avgVisitsAgg[0].avgVisits.toFixed(1))
    : 0;

  return {
    totalCustomers: total,
    newCustomers: newThisMonth,
    returningCustomers: returning,
    vipMembers: vip,
    avgVisitsPerWeek,
  };
};

// ── 9. Branch Performance ─────────────────────────────────────────────────────
const getBranchPerformance = async ({ tenant }) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(monthStart.getTime() - 1);

  const baseMatch = {
    restaurantId: tenant.restaurantId,
    status: { $ne: "cancelled" },
  };

  const [currentAgg, prevAgg] = await Promise.all([
    // This month's revenue per branch
    Bill.aggregate([
      { $match: { ...baseMatch, createdAt: { $gte: monthStart, $lte: now } } },
      {
        $group: {
          _id: "$branchId",
          revenue: { $sum: "$grandTotal" },
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
          revenue: 1,
          totalOrders: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]),

    // Last month's revenue per branch (for growth %)
    Bill.aggregate([
      { $match: { ...baseMatch, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: "$branchId", revenue: { $sum: "$grandTotal" } } },
    ]),
  ]);

  const prevMap = Object.fromEntries(
    prevAgg.map((b) => [b._id.toString(), b.revenue]),
  );

  const maxRevenue = currentAgg[0]?.revenue || 1;

  return currentAgg.map((branch) => {
    const prev = prevMap[branch.branchId.toString()] || 0;
    const growth = _growthPct(branch.revenue, prev);
    return {
      branchId: branch.branchId,
      branchName: branch.branchName,
      revenue: Number(branch.revenue.toFixed(2)),
      totalOrders: branch.totalOrders,
      growth,
      revenueShare: Number(((branch.revenue / maxRevenue) * 100).toFixed(0)),
    };
  });
};

module.exports = {
  getOverview,
  getRevenueSummary,
  getHourlyRevenue,
  getOrderSummary,
  getTableSummary,
  getKitchenSummary,
  getTopSellingItems,
  getRecentActivities,
  getCustomerSummary,
  getBranchPerformance,
};
