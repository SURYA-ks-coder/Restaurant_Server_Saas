// Endpoints containing ":id" (or ":itemId", ":roleId", ":printerId") are path templates —
// replace the token with the actual value before calling, e.g.
// API.GET_POS_ORDER_BY_ID.replace(":id", orderId)

const API = {
  HEALTH: "health",

  // Auth
  REGISTER: "auth/register",
  LOGIN: "auth/login",
  REFRESH_TOKEN: "auth/refresh-token",
  FORGOT_PASSWORD: "auth/forgot-password",
  RESET_PASSWORD: "auth/reset-password",
  LOGOUT: "auth/logout",
  CHANGE_PASSWORD: "auth/change-password",
  GET_ME: "auth/me",

  // Onboarding / Restaurant
  CHECK_DOMAIN: "onboarding/domain/check",
  CREATE_RESTAURANT: "onboarding/register",
  GET_RESTAURANT_LIST: "onboarding/list",
  GET_RESTAURANT_BY_ID: "onboarding/getRestaurantById",
  UPDATE_RESTAURANT: "onboarding/update",
  UPDATE_RESTAURANT_STATUS: "onboarding/status",
  SETUP_RESTAURANT_WIZARD: "onboarding/setup-wizard",
  UPLOAD_RESTAURANT_LOGO: "onboarding/logo",

  // Branch
  CREATE_BRANCH: "branches",
  GET_BRANCH_LIST: "branches/list",
  GET_BRANCH_BY_ID: "branches/getBranchById",
  UPDATE_BRANCH: "branches/UpdateBranch",
  DELETE_BRANCH: "branches",

  // Subscription
  GET_SUBSCRIPTION_PLAN_LIST: "subscription/list",
  GET_CURRENT_SUBSCRIPTION: "subscription/current",
  SELECT_SUBSCRIPTION_PLAN: "subscription/select-plan",
  UPGRADE_SUBSCRIPTION: "subscription/upgrade",
  DOWNGRADE_SUBSCRIPTION: "subscription/downgrade",
  EXPIRE_SUBSCRIPTION: "subscription/expire",
  CREATE_SUBSCRIPTION_PLAN: "subscription/plans",
  UPDATE_SUBSCRIPTION_PLAN: "subscription/plans",

  // Category
  GET_QR_CATEGORY_LIST: "categories/QRorders/list",
  GET_CATEGORY_LIST: "categories/list",
  GET_CATEGORY_BY_ID: "categories/getCategoryById",
  CREATE_CATEGORY: "categories",
  UPDATE_CATEGORY: "categories/updateCategory",
  DELETE_CATEGORY: "categories/deleteCategory",

  // Subcategory
  GET_SUBCATEGORY_LIST: "subcategories/list",
  GET_SUBCATEGORY_BY_ID: "subcategories/getSubCategoryById",
  CREATE_SUBCATEGORY: "subcategories",
  UPDATE_SUBCATEGORY: "subcategories/updateSubCategory",
  DELETE_SUBCATEGORY: "subcategories/deleteSubCategory",

  // Menu Item
  GET_MENU_ITEM_LIST: "menuitems/list",
  GET_LOW_STOCK_MENU_ITEMS: "menuitems/low-stock",
  GET_MENU_ITEM_BY_ID: "menuitems/getMenuItemById",
  CREATE_MENU_ITEM: "menuitems",
  UPDATE_MENU_ITEM: "menuitems/updateMenuItem",
  UPDATE_MENU_ITEM_AVAILABILITY: "menuitems/:id/availability",
  UPDATE_MENU_ITEM_PRICES: "menuitems/:id/prices",
  DELETE_MENU_ITEM: "menuitems/deleteMenuItem",

  // QR Order
  RESOLVE_QR_ORDER_TOKEN: "qrOrders/resolve",
  GET_QR_ORDER_LIST: "qrOrders",
  GET_QR_ORDER_BY_ID: "qrOrders",
  CREATE_QR_ORDER: "qrOrders",
  UPDATE_QR_ORDER_CART: "qrOrders/:id/cart",
  PLACE_QR_ORDER: "qrOrders/:id/place",
  RECORD_QR_ORDER_PAYMENT: "qrOrders/:id/payment",
  CANCEL_QR_ORDER: "qrOrders/:id/cancel",

  // Table
  GET_TABLE_STATS: "tables/stats",
  GET_SINGLE_TABLE_STATS: "tables/:id/stats",
  GET_TABLE_LIST: "tables/list",
  GET_ACTIVE_TABLE_LIST: "tables/activeTables",
  GET_TABLE_BY_ID: "tables/getTableById",
  CREATE_TABLE: "tables",
  UPDATE_TABLE: "tables/updateTable",
  UPDATE_TABLE_STATUS: "tables/tableStatusUpdate",
  OCCUPY_TABLE: "tables/:id/occupy",
  FREE_TABLE: "tables/:id/free",
  GENERATE_TABLE_QR_CODE: "tables/generateQRCode",

  // Table Reservation
  GET_TABLE_RESERVATION_LIST: "table-reservations/list",
  GET_TABLE_RESERVATION_BY_ID: "table-reservations",
  CREATE_TABLE_RESERVATION: "table-reservations",
  UPDATE_TABLE_RESERVATION: "table-reservations",
  UPDATE_TABLE_RESERVATION_STATUS: "table-reservations/:id/status",
  DELETE_TABLE_RESERVATION: "table-reservations",
  CANCEL_TABLE_RESERVATION: "table-reservations/:id/cancel",
  SEAT_TABLE_RESERVATION: "table-reservations/:id/seat",
  COMPLETE_TABLE_RESERVATION: "table-reservations/:id/complete",

  // POS
  CREATE_QR_POS_ORDER: "pos/createQRorders",
  CREATE_POS_ORDER: "pos",
  GET_POS_ORDER_LIST: "pos/list",
  GET_POS_ORDERS_BY_DATE: "pos/ordersBydate",
  GET_POS_LIVE_STATUS: "pos/liveStatus",
  GET_POS_ORDER_BY_ID: "pos",
  UPDATE_POS_ORDER: "pos",
  ADD_POS_ORDER_ITEM: "pos/:id/items",
  UPDATE_POS_ORDER_ITEM: "pos/:id/items/:itemId",
  REMOVE_POS_ORDER_ITEM: "pos/:id/items/:itemId",
  APPLY_POS_DISCOUNT: "pos/:id/discount",
  RECORD_POS_PAYMENT: "pos/:id/payment",
  HOLD_POS_ORDER: "pos/:id/hold",
  RESUME_POS_ORDER: "pos/:id/resume",
  CANCEL_POS_ORDER: "pos/:id/cancel",
  GENERATE_POS_INVOICE: "pos/:id/invoice",

  // KOT
  GET_KOT_LIST: "kot/list",
  GET_KOT_BY_ID: "kot",
  CREATE_KOT: "kot",
  UPDATE_KOT_STATUS: "kot/KOTstatusUpdate",
  UPDATE_KOT_ITEM_STATUS: "kot/updateItemStatus",
  UPDATE_KOT_PRIORITY: "kot/:id/priority",
  MARK_KOT_SERVED: "kot/:id/serve",

  // Inventory
  GET_INVENTORY_LIST: "inventory",
  GET_LOW_STOCK_INVENTORY: "inventory/low-stock",
  GET_INVENTORY_REPORT: "inventory/report",
  GET_INVENTORY_BY_ID: "inventory",
  CREATE_INVENTORY: "inventory",
  UPDATE_INVENTORY: "inventory",
  ADD_INVENTORY_STOCK: "inventory/:id/stock/add",
  REMOVE_INVENTORY_STOCK: "inventory/:id/stock/remove",
  GET_INVENTORY_HISTORY: "inventory/:id/history",

  // Recipe
  GET_RECIPE_LIST: "recipes",
  GET_RECIPE_BY_ID: "recipes",
  CREATE_RECIPE: "recipes",
  UPDATE_RECIPE: "recipes",
  DELETE_RECIPE: "recipes",

  // Expense
  GET_EXPENSE_LIST: "expenses",
  GET_EXPENSE_BY_ID: "expenses",
  CREATE_EXPENSE: "expenses",
  UPDATE_EXPENSE: "expenses",
  DELETE_EXPENSE: "expenses",

  // Customer
  GET_CUSTOMER_LIST: "customers",
  GET_CUSTOMER_BY_ID: "customers",
  CREATE_CUSTOMER: "customers",
  UPDATE_CUSTOMER: "customers",
  DELETE_CUSTOMER: "customers",
  GET_CUSTOMER_HISTORY: "customers/:id/history",

  // Staff
  GET_STAFF_LIST: "staff/list",
  GET_MY_TEAM: "staff/my-team",
  GET_STAFF_BY_ROLE: "staff/by-role/:roleId",
  GET_STAFF_BY_ID: "staff/getUserById",
  CREATE_STAFF: "staff",
  ASSIGN_STAFF_ROLE: "staff/assignRole",
  UPDATE_STAFF: "staff/UpdateUser",
  DELETE_STAFF: "staff/deleteUser",

  // Role
  GET_ROLE_MENU_LIST: "roles/menus",
  GET_ROLE_LIST: "roles/list",
  GET_ROLE_BY_ID: "roles/getRoleById",
  CREATE_ROLE: "roles",
  UPDATE_ROLE: "roles/updateRole",
  DELETE_ROLE: "roles/deleteRole",

  // Department
  GET_DEPARTMENT_LIST: "departments/list",
  GET_DEPARTMENT_BY_ID: "departments/getDepartmentsById",
  CREATE_DEPARTMENT: "departments",
  UPDATE_DEPARTMENT: "departments/updateDepartment",
  DELETE_DEPARTMENT: "departments",

  // Shift
  GET_SHIFT_LIST: "shifts/list",
  GET_SHIFT_BY_ID: "shifts/getStaffShiftById",
  CREATE_SHIFT: "shifts",
  UPDATE_SHIFT: "shifts/updateStaffShift",
  DELETE_SHIFT: "shifts/deleteStaffShift",

  // Designation
  GET_DESIGNATION_LIST: "designations/list",
  GET_DESIGNATION_BY_ID: "designations/getDesignationById",
  CREATE_DESIGNATION: "designations",
  UPDATE_DESIGNATION: "designations/updateDesignation",
  DELETE_DESIGNATION: "designations",

  // Reports (GET)
  GET_REPORTS_DASHBOARD_SUMMARY: "reports/dashboard",
  GET_REPORTS_DASHBOARD_TOP_ITEMS: "reports/dashboard/top-items",
  GET_REPORTS_DASHBOARD_PEAK_HOURS: "reports/dashboard/peak-hours",
  GET_REPORTS_DASHBOARD_REVENUE: "reports/dashboard/revenue",
  GET_REPORTS_DASHBOARD_EXPENSES: "reports/dashboard/expenses",
  GET_REPORTS_DAILY_SALES: "reports/daily-sales",
  GET_REPORTS_MONTHLY_SALES: "reports/monthly-sales",
  GET_REPORTS_PROFIT: "reports/profit",
  GET_REPORTS_EXPENSE: "reports/expense",
  GET_REPORTS_ITEM_SALES: "reports/item-sales",
  GET_REPORTS_TAX: "reports/tax",
  GET_REPORTS_KOT: "reports/kot",
  GET_REPORTS_SALES: "reports/sales",
  GET_REPORTS_ORDERS: "reports/orders",
  GET_REPORTS_TOP_SELLING_ITEMS: "reports/items/top-selling",
  GET_REPORTS_LEAST_SELLING_ITEMS: "reports/items/least-selling",
  GET_REPORTS_STAFF_PERFORMANCE: "reports/staff-performance",
  GET_REPORTS_CUSTOMERS: "reports/customers",
  GET_REPORTS_TAX_DETAIL: "reports/tax-detail",
  GET_REPORTS_BRANCHES: "reports/branches",
  GET_REPORTS_AUDIT_LOGS: "reports/audit-logs",
  GET_REPORTS_INVENTORY: "reports/inventory",
  GET_REPORTS_EXPENSES_DETAIL: "reports/expenses",
  GET_REPORTS_PROFIT_LOSS: "reports/profit-loss",

  // Reports (POST — body-driven, exportable reports)
  CREATE_REPORTS_SALES: "reports/sales",
  CREATE_REPORTS_SALES_SUMMARY: "reports/sales/summary",
  CREATE_REPORTS_REVENUE: "reports/sales/revenue",
  CREATE_REPORTS_HOURLY_SALES: "reports/sales/hourly",
  CREATE_REPORTS_TOP_SELLING_ITEMS: "reports/top-selling-items",
  CREATE_REPORTS_SALES_BY_CATEGORY: "reports/sales/category",
  CREATE_REPORTS_INVENTORY: "reports/inventory",
  CREATE_REPORTS_LOW_STOCK: "reports/inventory/low-stock",
  CREATE_REPORTS_SUPPLIERS: "reports/inventory/suppliers",
  CREATE_REPORTS_INVENTORY_USAGE: "reports/inventory/usage",
  CREATE_REPORTS_PURCHASE_ORDERS: "reports/inventory/purchase-orders",
  CREATE_REPORTS_ORDERS: "reports/orders",
  CREATE_REPORTS_CANCELLED_ORDERS: "reports/orders/cancelled",
  CREATE_REPORTS_KOT: "reports/kot",
  CREATE_REPORTS_TABLE_OCCUPANCY: "reports/tables/occupancy",
  CREATE_REPORTS_QR_ORDERS: "reports/qr-orders",
  CREATE_REPORTS_STAFF_DIRECTORY: "reports/staff",
  CREATE_REPORTS_ATTENDANCE: "reports/staff/attendance",
  CREATE_REPORTS_DEPARTMENT: "reports/staff/department",
  CREATE_REPORTS_SHIFTS: "reports/staff/shifts",
  CREATE_REPORTS_EXPENSES: "reports/expenses",
  CREATE_REPORTS_PROFIT_LOSS: "reports/financial/profit-loss",
  CREATE_REPORTS_BILL_SETTLEMENT: "reports/bills/settlement",
  CREATE_REPORTS_TAX_SUMMARY: "reports/financial/tax",

  // Dashboard
  GET_DASHBOARD_OVERVIEW: "dashboard/overview",
  GET_DASHBOARD_REVENUE_SUMMARY: "dashboard/revenue-summary",
  GET_DASHBOARD_HOURLY_REVENUE: "dashboard/hourlyRevenue",
  GET_DASHBOARD_ORDER_SUMMARY: "dashboard/order-summary",
  GET_DASHBOARD_TABLE_SUMMARY: "dashboard/table-summary",
  GET_DASHBOARD_KITCHEN_SUMMARY: "dashboard/kitchen-summary",
  GET_DASHBOARD_TOP_SELLING_ITEMS: "dashboard/top-selling-items",
  GET_DASHBOARD_RECENT_ACTIVITIES: "dashboard/recent-activities",
  GET_DASHBOARD_CUSTOMER_SUMMARY: "dashboard/customer-summary",
  GET_DASHBOARD_BRANCH_PERFORMANCE: "dashboard/branch-performance",

  // Supplier
  GET_SUPPLIER_LIST: "suppliers/list",
  GET_SUPPLIER_BY_ID: "suppliers/getSupplierById",
  CREATE_SUPPLIER: "suppliers",
  UPDATE_SUPPLIER: "suppliers/updateSupplier",
  DELETE_SUPPLIER: "suppliers/deleteSupplier",

  // Warehouse
  GET_WAREHOUSE_LIST: "warehouses",
  GET_WAREHOUSE_BY_ID: "warehouses",
  CREATE_WAREHOUSE: "warehouses",
  UPDATE_WAREHOUSE: "warehouses",
  DELETE_WAREHOUSE: "warehouses",

  // Stock Transfer
  GET_STOCK_TRANSFER_LIST: "stock-transfers",
  GET_STOCK_TRANSFER_BY_ID: "stock-transfers",
  CREATE_STOCK_TRANSFER: "stock-transfers",
  APPROVE_STOCK_TRANSFER: "stock-transfers/:id/approve",
  COMPLETE_STOCK_TRANSFER: "stock-transfers/:id/complete",
  REJECT_STOCK_TRANSFER: "stock-transfers/:id/reject",

  // Wastage
  GET_WASTAGE_LIST: "wastage",
  GET_WASTAGE_REPORT: "wastage/report",
  GET_WASTAGE_BY_ID: "wastage",
  RECORD_WASTAGE: "wastage",

  // Print
  GET_PRINTER_SETTINGS: "print/settings",
  UPDATE_PRINTER_SETTINGS: "print/settings",
  ADD_PRINTER: "print/settings/printers",
  UPDATE_PRINTER: "print/settings/printers/:printerId",
  REMOVE_PRINTER: "print/settings/printers/:printerId",
  PRINT_KOT: "print/kot/:id",
  PREVIEW_KOT: "print/kot/:id/preview",
  PRINT_BILL: "print/bill/:id",
  PREVIEW_BILL: "print/bill/:id/preview",
  PRINT_QR_ORDER: "print/qr-order/:id",
  PREVIEW_QR_ORDER: "print/qr-order/:id/preview",
};

module.exports = API;
