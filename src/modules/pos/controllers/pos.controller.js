const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const posService = require("../services/pos.service");

const create = asyncHandler(async (req, res) => {
  const { bill, customer } = await posService.createBill({
    payload: req.body,
    tenant: req.tenant || {
      branchId: req.body.branchId,
      restaurantId: req.body.restaurantId,
    },
    user: req.user || { id: req.body.userId },
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Order created successfully",
    data: bill,
    meta: customer
      ? {
          customer: {
            id: customer._id,
            customerName: customer.customerName,
            mobileNumber: customer.mobileNumber,
          },
        }
      : null,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await posService.updateBill({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Order updated successfully",
    data,
  });
});

const addItem = asyncHandler(async (req, res) => {
  const data = await posService.addBillItem({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Item added successfully",
    data,
  });
});

const updateItemQuantity = asyncHandler(async (req, res) => {
  const data = await posService.updateBillItemQuantity({
    id: req.params.id,
    itemId: req.params.itemId,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Item quantity updated successfully",
    data,
  });
});

const removeItem = asyncHandler(async (req, res) => {
  const data = await posService.removeBillItem({
    id: req.params.id,
    itemId: req.params.itemId,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Item removed successfully",
    data,
  });
});

const applyDiscount = asyncHandler(async (req, res) => {
  const data = await posService.applyBillDiscount({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Discount applied successfully",
    data,
  });
});

const recordPayment = asyncHandler(async (req, res) => {
  const data = await posService.recordPayment({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Payment recorded successfully",
    data,
  });
});

const holdOrder = asyncHandler(async (req, res) => {
  const data = await posService.holdBill({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Order held successfully",
    data,
  });
});

const resumeOrder = asyncHandler(async (req, res) => {
  const data = await posService.resumeBill({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Order resumed successfully",
    data,
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const data = await posService.cancelBill({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Order cancelled successfully",
    data,
  });
});

const generateInvoice = asyncHandler(async (req, res) => {
  const data = await posService.generateInvoice({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Invoice generated successfully",
    data,
  });
});

const get = asyncHandler(async (req, res) => {
  const data = await posService.getBill({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Order fetched successfully",
    data,
  });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await posService.listBills({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Orders fetched successfully",
    data: items,
    meta,
  });
});
const todayOrders = async (req, res, next) => {
  try {
    const data = await posService.todayOrders({
      body: req.body,
      tenant: req.tenant,
    });

    sendSuccess(res, {
      statusCode: httpStatus.OK,
      message: "Dashboard stats fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const liveStatus = asyncHandler(async (req, res) => {
  const data = await posService.liveStatus({ tenant: req.tenant });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Live status fetched successfully",
    data,
  });
});

module.exports = {
  create,
  update,
  addItem,
  updateItemQuantity,
  removeItem,
  applyDiscount,
  recordPayment,
  holdOrder,
  resumeOrder,
  cancelOrder,
  generateInvoice,
  get,
  list,
  todayOrders,
  liveStatus,
};
