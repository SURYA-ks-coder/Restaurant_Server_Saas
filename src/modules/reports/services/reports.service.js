const mongoose = require("mongoose");
const Bill = require("../../pos/models/Bill.model");
const Expense = require("../../expense/models/Expense.model");
const Kot = require("../../kot/models/Kot.model");
const Customer = require("../../customer/Customer.model");
const User = require("../../auth/models/User.model");
const InventoryItem = require("../../inventory/models/InventoryItem.model");
const InventoryTransaction = require("../../inventory/models/InventoryTransaction.model");
const {
  parsePagination,
  paginationMeta,
} = require("../../../helpers/queryBuilder");

const buildFilter = ({ query, tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }
  return filter;
};

const dailySales = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalSales: { $sum: "$grandTotal" },
        totalTaxes: { $sum: "$taxTotal" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const monthlySales = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        totalSales: { $sum: "$grandTotal" },
        totalTaxes: { $sum: "$taxTotal" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};

const expenseReport = async ({ query, tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.startDate || query.endDate) {
    filter.expenseDate = {};
    if (query.startDate) filter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.expenseDate.$lte = new Date(query.endDate);
  }

  return Expense.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$expenseDate" } },
        totalExpense: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const profitReport = async ({ query, tenant }) => {
  const [sales] = await Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$grandTotal" },
        totalCost: { $sum: "$subTotal" },
        totalTax: { $sum: "$taxTotal" },
      },
    },
  ]);
  const expenseFilter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.startDate || query.endDate) {
    expenseFilter.expenseDate = {};
    if (query.startDate) expenseFilter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) expenseFilter.expenseDate.$lte = new Date(query.endDate);
  }
  const [expense] = await Expense.aggregate([
    { $match: expenseFilter },
    { $group: { _id: null, totalExpense: { $sum: "$amount" } } },
  ]);
  return {
    totalSales: sales?.totalSales || 0,
    totalCost: sales?.totalCost || 0,
    totalTax: sales?.totalTax || 0,
    totalExpense: expense?.totalExpense || 0,
    grossProfit: Number(((sales?.totalSales || 0) - (sales?.totalCost || 0)).toFixed(2)),
    netProfit: Number((
      (sales?.totalSales || 0) -
        (sales?.totalCost || 0) -
        (expense?.totalExpense || 0)
    ).toFixed(2)),
  };
};

const itemSales = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItemId",
        itemName: { $first: "$items.itemName" },
        quantitySold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.total" },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
};

const taxReport = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalTax: { $sum: "$taxTotal" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const kotReport = async ({ query, tenant }) => {
  return Kot.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

const dashboardSummary = async ({ query, tenant }) => {
  const billFilter = buildFilter({ query, tenant });
  const expenseFilter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.startDate || query.endDate) {
    expenseFilter.expenseDate = {};
    if (query.startDate) expenseFilter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) expenseFilter.expenseDate.$lte = new Date(query.endDate);
  }

  const [sales] = await Bill.aggregate([
    { $match: billFilter },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$grandTotal" },
        tax: { $sum: "$taxTotal" },
        discounts: { $sum: "$discountTotal" },
        orders: { $sum: 1 },
      },
    },
  ]);
  const [expenses] = await Expense.aggregate([
    { $match: expenseFilter },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const revenue = sales?.revenue || 0;
  const expenseTotal = expenses?.total || 0;
  return {
    revenue,
    tax: sales?.tax || 0,
    discounts: sales?.discounts || 0,
    orderCount: sales?.orders || 0,
    averageOrderValue: sales?.orders ? Number((revenue / sales.orders).toFixed(2)) : 0,
    expenses: expenseTotal,
    expenseCount: expenses?.count || 0,
    profit: Number((revenue - expenseTotal).toFixed(2)),
  };
};

const topSellingItems = async ({ query, tenant }) => {
  const limit = Number(query.limit || 10);
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItemId",
        label: { $first: "$items.itemName" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.total" },
      },
    },
    { $sort: { quantity: -1, revenue: -1 } },
    { $limit: limit },
  ]);
};

const peakHours = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$grandTotal" },
      },
    },
    { $project: { _id: 0, hour: "$_id", orders: 1, revenue: 1 } },
    { $sort: { hour: 1 } },
  ]);
};

const revenueAnalytics = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$grandTotal" },
        orders: { $sum: 1 },
      },
    },
    { $project: { _id: 0, label: "$_id", revenue: 1, orders: 1 } },
    { $sort: { label: 1 } },
  ]);
};

const expenseAnalytics = async ({ query, tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    status: { $ne: "cancelled" },
  };
  if (query.startDate || query.endDate) {
    filter.expenseDate = {};
    if (query.startDate) filter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.expenseDate.$lte = new Date(query.endDate);
  }
  return Expense.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$category",
        amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, label: "$_id", amount: 1, count: 1 } },
    { $sort: { amount: -1 } },
  ]);
};

// ── helpers for new reports ───────────────────────────────────────────────────
const _toObjId = (id) => new mongoose.Types.ObjectId(id);

const _reportFilter = ({ query, tenant }) => {
  const filter = { restaurantId: tenant.restaurantId };
  filter.branchId = query.branchId ? _toObjId(query.branchId) : tenant.branchId;
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }
  return filter;
};

// ── Sales Report ──────────────────────────────────────────────────────────────
const salesReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = _reportFilter({ query, tenant });

  const [summaryAgg, records, total] = await Promise.all([
    Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
          totalTax: { $sum: "$taxTotal" },
          totalDiscount: { $sum: "$discountTotal" },
        },
      },
    ]),
    Bill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Bill.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    totalTax: 0,
    totalDiscount: 0,
  };

  return {
    totalRevenue: s.totalRevenue,
    totalOrders: s.totalOrders,
    totalTax: s.totalTax,
    totalDiscount: s.totalDiscount,
    averageOrderValue:
      s.totalOrders > 0 ? Number((s.totalRevenue / s.totalOrders).toFixed(2)) : 0,
    records: records.map((r) => ({
      billId: r._id,
      billNo: r.billNo,
      orderType: r.orderType,
      grandTotal: r.grandTotal,
      subTotal: r.subTotal,
      taxTotal: r.taxTotal,
      discountTotal: r.discountTotal,
      paymentStatus: r.paymentStatus,
      status: r.status,
      createdAt: r.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Orders Report ─────────────────────────────────────────────────────────────
const ordersReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = _reportFilter({ query, tenant });
  if (query.status) filter.status = query.status;

  const [summaryAgg, records, total] = await Promise.all([
    Bill.aggregate([
      { $match: _reportFilter({ query, tenant }) },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Bill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Bill.countDocuments(filter),
  ]);

  const statusMap = Object.fromEntries(summaryAgg.map((a) => [a._id, a.count]));
  const totalAll = Object.values(statusMap).reduce((s, v) => s + v, 0);

  return {
    totalOrders: totalAll,
    completedOrders: statusMap.completed || 0,
    cancelledOrders: statusMap.cancelled || 0,
    records: records.map((r) => ({
      billId: r._id,
      billNo: r.billNo,
      orderType: r.orderType,
      tableId: r.tableId,
      grandTotal: r.grandTotal,
      status: r.status,
      paymentStatus: r.paymentStatus,
      createdAt: r.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Top Selling Items Report ──────────────────────────────────────────────────
const topSellingItemsReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { ..._reportFilter({ query, tenant }), status: { $ne: "cancelled" } };

  const agg = await Bill.aggregate([
    { $match: filter },
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
    { $skip: skip },
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

  return agg;
};

// ── Least Selling Items Report ────────────────────────────────────────────────
const leastSellingItemsReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { ..._reportFilter({ query, tenant }), status: { $ne: "cancelled" } };

  return Bill.aggregate([
    { $match: filter },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItemId",
        itemName: { $first: "$items.itemName" },
        quantitySold: { $sum: "$items.quantity" },
        revenueGenerated: { $sum: "$items.total" },
      },
    },
    { $sort: { quantitySold: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        itemId: "$_id",
        itemName: 1,
        quantitySold: 1,
      },
    },
  ]);
};

// ── Staff Performance Report ──────────────────────────────────────────────────
const staffPerformanceReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {
    ..._reportFilter({ query, tenant }),
    status: "completed",
  };

  return Bill.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$createdBy",
        ordersHandled: { $sum: 1 },
        salesAmount: { $sum: "$grandTotal" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "_staff",
      },
    },
    { $unwind: { path: "$_staff", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        staffId: "$_id",
        staffName: { $ifNull: ["$_staff.name", "Unknown"] },
        ordersHandled: 1,
        salesAmount: 1,
        averageOrderValue: {
          $cond: [
            { $gt: ["$ordersHandled", 0] },
            { $round: [{ $divide: ["$salesAmount", "$ordersHandled"] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { salesAmount: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
};

// ── Customer Report ───────────────────────────────────────────────────────────
const customersReport = async ({ query, tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const dateFilter = {};
  if (query.startDate) dateFilter.$gte = new Date(query.startDate);
  if (query.endDate) dateFilter.$lte = new Date(query.endDate);
  const hasDate = Object.keys(dateFilter).length > 0;

  const [total, newCustomers, repeat, topCustomers] = await Promise.all([
    Customer.countDocuments(base),
    Customer.countDocuments({
      ...base,
      ...(hasDate ? { createdAt: dateFilter } : {}),
    }),
    Customer.countDocuments({ ...base, totalOrders: { $gt: 1 } }),
    Customer.find(base)
      .sort({ totalOrders: -1, loyaltyPoints: -1 })
      .limit(10)
      .select("customerName mobileNumber totalOrders loyaltyPoints")
      .lean(),
  ]);

  return {
    totalCustomers: total,
    newCustomers,
    repeatCustomers: repeat,
    topCustomers: topCustomers.map((c) => ({
      customerId: c._id,
      customerName: c.customerName,
      mobileNumber: c.mobileNumber,
      totalOrders: c.totalOrders,
      loyaltyPoints: c.loyaltyPoints,
    })),
  };
};

// ── Tax Report (detailed) ─────────────────────────────────────────────────────
const taxDetailReport = async ({ query, tenant }) => {
  const filter = _reportFilter({ query, tenant });

  const [agg] = await Bill.aggregate([
    { $match: { ...filter, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: null,
        totalTaxCollected: { $sum: "$taxTotal" },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$grandTotal" },
      },
    },
  ]);

  const total = agg?.totalTaxCollected || 0;

  return {
    totalTaxCollected: total,
    cgst: Number((total / 2).toFixed(2)),
    sgst: Number((total / 2).toFixed(2)),
    serviceTax: 0,
    totalOrders: agg?.totalOrders || 0,
    totalRevenue: agg?.totalRevenue || 0,
  };
};

// ── Branch Report ─────────────────────────────────────────────────────────────
const branchesReport = async ({ query, tenant }) => {
  const dateFilter = {};
  if (query.startDate) dateFilter.$gte = new Date(query.startDate);
  if (query.endDate) dateFilter.$lte = new Date(query.endDate);
  const hasDate = Object.keys(dateFilter).length > 0;

  return Bill.aggregate([
    {
      $match: {
        restaurantId: tenant.restaurantId,
        status: { $ne: "cancelled" },
        ...(hasDate ? { createdAt: dateFilter } : {}),
      },
    },
    {
      $group: {
        _id: "$branchId",
        totalRevenue: { $sum: "$grandTotal" },
        totalOrders: { $sum: 1 },
        totalTax: { $sum: "$taxTotal" },
        totalDiscount: { $sum: "$discountTotal" },
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
        totalTax: 1,
        totalDiscount: 1,
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
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
const auditLogsReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = _reportFilter({ query, tenant });

  const [records, total] = await Promise.all([
    Bill.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email role")
      .lean(),
    Bill.countDocuments(filter),
  ]);

  return {
    records: records.map((b) => ({
      user: b.createdBy?.name || "Unknown",
      role: b.createdBy?.role || "-",
      action: `bill_${b.status}`,
      module: "POS",
      detail: `Bill #${b.billNo} — ${b.orderType} — ₹${b.grandTotal}`,
      timestamp: b.updatedAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Inventory Report ──────────────────────────────────────────────────────────
const inventoryReport = async ({ query, tenant }) => {
  const base = {
    restaurantId: tenant.restaurantId,
    branchId: query.branchId ? _toObjId(query.branchId) : tenant.branchId,
  };
  const txFilter = { ...base };
  if (query.startDate || query.endDate) {
    txFilter.createdAt = {};
    if (query.startDate) txFilter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) txFilter.createdAt.$lte = new Date(query.endDate);
  }

  const [summaryAgg, lowStockItems, categoryBreakdown, recentTransactions] = await Promise.all([
    InventoryItem.aggregate([
      { $match: base },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          activeItems: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          totalValue: { $sum: { $multiply: ["$stockQuantity", "$purchasePrice"] } },
          outOfStock: { $sum: { $cond: [{ $eq: ["$stockQuantity", 0] }, 1, 0] } },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$minimumStock", 0] },
                    { $lte: ["$stockQuantity", "$minimumStock"] },
                    { $gt: ["$stockQuantity", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    InventoryItem.find({
      ...base,
      status: "active",
      $expr: {
        $and: [{ $gt: ["$minimumStock", 0] }, { $lte: ["$stockQuantity", "$minimumStock"] }],
      },
    })
      .sort({ stockQuantity: 1 })
      .limit(20)
      .select("materialName category unit stockQuantity minimumStock purchasePrice")
      .lean(),
    InventoryItem.aggregate([
      { $match: base },
      {
        $group: {
          _id: "$category",
          itemCount: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$stockQuantity", "$purchasePrice"] } },
          totalStock: { $sum: "$stockQuantity" },
        },
      },
      {
        $project: {
          _id: 0,
          category: { $ifNull: ["$_id", "Uncategorised"] },
          itemCount: 1,
          totalValue: { $round: ["$totalValue", 2] },
          totalStock: 1,
        },
      },
      { $sort: { totalValue: -1 } },
    ]),
    InventoryTransaction.find(txFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("inventoryItemId", "materialName unit")
      .populate("createdBy", "name")
      .lean(),
  ]);

  const s = summaryAgg[0] || {
    totalItems: 0,
    activeItems: 0,
    totalValue: 0,
    outOfStock: 0,
    lowStockCount: 0,
  };

  return {
    summary: {
      totalItems: s.totalItems,
      activeItems: s.activeItems,
      totalInventoryValue: Number((s.totalValue || 0).toFixed(2)),
      outOfStockItems: s.outOfStock,
      lowStockItems: s.lowStockCount,
    },
    lowStockAlerts: lowStockItems.map((item) => ({
      itemId: item._id,
      materialName: item.materialName,
      category: item.category || "Uncategorised",
      unit: item.unit,
      currentStock: item.stockQuantity,
      minimumStock: item.minimumStock,
      purchasePrice: item.purchasePrice,
    })),
    categoryBreakdown,
    recentTransactions: recentTransactions.map((t) => ({
      transactionId: t._id,
      itemName: t.inventoryItemId?.materialName || "Unknown",
      unit: t.inventoryItemId?.unit || "",
      type: t.type,
      quantity: t.quantity,
      previousQuantity: t.previousQuantity,
      updatedQuantity: t.updatedQuantity,
      notes: t.notes || null,
      createdBy: t.createdBy?.name || "Unknown",
      createdAt: t.createdAt,
    })),
  };
};

// ── Expenses Detail Report ────────────────────────────────────────────────────
const expensesDetailReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const base = {
    restaurantId: tenant.restaurantId,
    branchId: query.branchId ? _toObjId(query.branchId) : tenant.branchId,
    isDeleted: false,
  };
  const filter = { ...base };
  if (query.startDate || query.endDate) {
    filter.expenseDate = {};
    if (query.startDate) filter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.expenseDate.$lte = new Date(query.endDate);
  }
  if (query.category) filter.category = query.category;
  if (query.paymentMode) filter.paymentMode = query.paymentMode;

  const [summaryAgg, byCategory, byPaymentMode, records, total] = await Promise.all([
    Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, category: "$_id", amount: 1, count: 1 } },
      { $sort: { amount: -1 } },
    ]),
    Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$paymentMode",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, paymentMode: "$_id", amount: 1, count: 1 } },
      { $sort: { amount: -1 } },
    ]),
    Expense.find(filter)
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name")
      .lean(),
    Expense.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || { totalAmount: 0, count: 0 };

  return {
    totalAmount: s.totalAmount,
    totalCount: s.count,
    byCategory,
    byPaymentMode,
    records: records.map((e) => ({
      expenseId: e._id,
      expenseName: e.expenseName,
      category: e.category,
      amount: e.amount,
      expenseDate: e.expenseDate,
      paymentMode: e.paymentMode,
      notes: e.notes || null,
      createdBy: e.createdBy?.name || "Unknown",
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Profit & Loss Report ──────────────────────────────────────────────────────
const profitLossReport = async ({ query, tenant }) => {
  const billFilter = _reportFilter({ query, tenant });
  const expenseBase = {
    restaurantId: tenant.restaurantId,
    branchId: query.branchId ? _toObjId(query.branchId) : tenant.branchId,
    isDeleted: false,
  };
  const expenseFilter = { ...expenseBase };
  if (query.startDate || query.endDate) {
    expenseFilter.expenseDate = {};
    if (query.startDate) expenseFilter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) expenseFilter.expenseDate.$lte = new Date(query.endDate);
  }

  const activeBillFilter = { ...billFilter, status: { $ne: "cancelled" } };

  const [salesAgg, expenseAgg, monthlySales, monthlyExpenses] = await Promise.all([
    Bill.aggregate([
      { $match: activeBillFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalCOGS: { $sum: "$subTotal" },
          totalTax: { $sum: "$taxTotal" },
          totalDiscount: { $sum: "$discountTotal" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: expenseFilter },
      { $group: { _id: null, totalExpenses: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: activeBillFilter },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$grandTotal" },
          cogs: { $sum: "$subTotal" },
          tax: { $sum: "$taxTotal" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: { year: { $year: "$expenseDate" }, month: { $month: "$expenseDate" } },
          expenses: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const s = salesAgg[0] || {
    totalRevenue: 0,
    totalCOGS: 0,
    totalTax: 0,
    totalDiscount: 0,
    totalOrders: 0,
  };
  const e = expenseAgg[0] || { totalExpenses: 0, count: 0 };
  const grossProfit = Number((s.totalRevenue - s.totalCOGS).toFixed(2));
  const netProfit = Number((grossProfit - e.totalExpenses).toFixed(2));

  const expenseMap = {};
  monthlyExpenses.forEach((row) => {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    expenseMap[key] = row.expenses;
  });

  const periodBreakdown = monthlySales.map((row) => {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    const exp = expenseMap[key] || 0;
    const gross = Number((row.revenue - row.cogs).toFixed(2));
    return {
      period: key,
      revenue: row.revenue,
      cogs: row.cogs,
      grossProfit: gross,
      expenses: exp,
      netProfit: Number((gross - exp).toFixed(2)),
      tax: row.tax,
      orders: row.orders,
    };
  });

  return {
    summary: {
      totalRevenue: s.totalRevenue,
      totalCOGS: s.totalCOGS,
      grossProfit,
      totalExpenses: e.totalExpenses,
      netProfit,
      totalTax: s.totalTax,
      totalDiscount: s.totalDiscount,
      totalOrders: s.totalOrders,
      grossMargin:
        s.totalRevenue > 0
          ? Number(((grossProfit / s.totalRevenue) * 100).toFixed(2))
          : 0,
      netMargin:
        s.totalRevenue > 0
          ? Number(((netProfit / s.totalRevenue) * 100).toFixed(2))
          : 0,
    },
    periodBreakdown,
  };
};

module.exports = {
  dailySales,
  monthlySales,
  profitReport,
  expenseReport,
  itemSales,
  taxReport,
  kotReport,
  dashboardSummary,
  topSellingItems,
  peakHours,
  revenueAnalytics,
  expenseAnalytics,
  // new
  salesReport,
  ordersReport,
  topSellingItemsReport,
  leastSellingItemsReport,
  staffPerformanceReport,
  customersReport,
  taxDetailReport,
  branchesReport,
  auditLogsReport,
  inventoryReport,
  expensesDetailReport,
  profitLossReport,
};
