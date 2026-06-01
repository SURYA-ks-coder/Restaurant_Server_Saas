const Bill = require("../../pos/models/Bill.model");
const Expense = require("../../expense/models/Expense.model");
const Kot = require("../../kot/models/Kot.model");

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
};
