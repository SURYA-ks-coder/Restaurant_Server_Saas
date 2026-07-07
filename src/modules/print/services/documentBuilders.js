const { formatMoney, formatNumber, formatDateTime } = require("./printFormat");

const ITEM_COLUMNS = [
  { key: "name", label: "Item", width: 0.46, align: "left" },
  { key: "qty", label: "Qty", width: 0.14, align: "center" },
  { key: "price", label: "Price", width: 0.18, align: "right" },
  { key: "total", label: "Total", width: 0.22, align: "right" },
];

const KOT_COLUMNS = [
  { key: "name", label: "Item", width: 0.6, align: "left" },
  { key: "qty", label: "Qty", width: 0.15, align: "center" },
  { key: "note", label: "Note", width: 0.25, align: "left" },
];

const restaurantHeaderBlocks = ({ restaurant, branch }) => {
  const blocks = [
    { type: "text", text: restaurant?.name || "Restaurant", align: "center", bold: true, size: "large" },
  ];
  if (branch?.address) blocks.push({ type: "text", text: branch.address, align: "center", size: "small" });
  if (branch?.phone) blocks.push({ type: "text", text: `Ph: ${branch.phone}`, align: "center", size: "small" });
  return blocks;
};

const buildKotDocument = ({ kot, branch, restaurant, settings, paperWidth = "80mm" }) => {
  const kotSettings = settings?.kot || {};
  const blocks = [
    ...restaurantHeaderBlocks({ restaurant, branch }),
    { type: "line" },
    { type: "text", text: kotSettings.headerText || "KITCHEN ORDER TICKET", align: "center", bold: true },
    { type: "line" },
    { type: "row", left: "KOT #", right: String(kot._id).slice(-6).toUpperCase() },
    { type: "row", left: "Section", right: kot.kitchenSection || "-" },
    { type: "row", left: "Time", right: formatDateTime(kot.createdAt) },
  ];
  if (kotSettings.showTableName !== false && kot.tableName) {
    blocks.push({ type: "row", left: "Table", right: kot.tableName });
  }
  blocks.push(
    { type: "line" },
    {
      type: "table",
      columns: KOT_COLUMNS,
      rows: (kot.items || []).map((item) => ({
        name: item.itemName || "",
        qty: String(item.quantity || 1),
        note: item.note || "",
      })),
    },
  );
  if (kot.notes) {
    blocks.push({ type: "line" }, { type: "text", text: `Note: ${kot.notes}` });
  }
  blocks.push({ type: "line" });
  if (kotSettings.footerText) {
    blocks.push({ type: "text", text: kotSettings.footerText, align: "center", size: "small" });
  }
  blocks.push({ type: "spacer", lines: 2 }, { type: "cut" });

  return { paperWidth, title: "KOT", blocks };
};

const buildBillDocument = ({ bill, branch, restaurant, settings, paperWidth = "80mm" }) => {
  const receiptSettings = settings?.receipt || {};
  const symbol = receiptSettings.currencySymbol || "₹";
  const blocks = [...restaurantHeaderBlocks({ restaurant, branch })];

  if (receiptSettings.showGSTNumber !== false) {
    const gstNumber = receiptSettings.gstNumber || restaurant?.GSTNumber;
    if (gstNumber) blocks.push({ type: "text", text: `GSTIN: ${gstNumber}`, align: "center", size: "small" });
  }
  if (receiptSettings.headerText) {
    blocks.push({ type: "text", text: receiptSettings.headerText, align: "center", size: "small" });
  }

  blocks.push(
    { type: "line" },
    { type: "row", left: "Bill No", right: bill.billNo },
    { type: "row", left: "Date", right: formatDateTime(bill.createdAt) },
    { type: "row", left: "Order Type", right: (bill.orderType || "").replace("_", " ") },
  );
  if (bill.tableName) blocks.push({ type: "row", left: "Table", right: bill.tableName });

  blocks.push(
    { type: "line" },
    {
      type: "table",
      columns: ITEM_COLUMNS,
      rows: (bill.items || []).map((item) => ({
        name: item.itemName || "",
        qty: String(item.quantity || 1),
        price: formatNumber(item.price),
        total: formatNumber(item.total),
      })),
    },
    { type: "line" },
    { type: "row", left: "Sub Total", right: formatMoney(bill.subTotal, symbol) },
  );
  if (bill.taxTotal) blocks.push({ type: "row", left: `Tax (${bill.taxRate || 0}%)`, right: formatMoney(bill.taxTotal, symbol) });
  if (bill.discountTotal) blocks.push({ type: "row", left: "Discount", right: `-${formatMoney(bill.discountTotal, symbol)}` });
  blocks.push(
    { type: "line" },
    { type: "row", left: "Grand Total", right: formatMoney(bill.grandTotal, symbol), bold: true },
    { type: "line" },
  );

  const lastPayment = (bill.payments || [])[bill.payments.length - 1];
  if (lastPayment) {
    blocks.push({ type: "row", left: "Payment", right: `${lastPayment.method?.toUpperCase()} · ${bill.paymentStatus}` });
  }

  blocks.push({ type: "spacer", lines: 1 });
  blocks.push({ type: "text", text: receiptSettings.footerText || "Thank you! Visit again.", align: "center", size: "small" });
  blocks.push({ type: "spacer", lines: 2 }, { type: "cut" });

  return { paperWidth, title: "Bill", blocks };
};

const buildQrOrderDocument = ({ qrOrder, branch, restaurant, settings, paperWidth = "80mm" }) => {
  const slipSettings = settings?.qrOrderSlip || {};
  const symbol = settings?.receipt?.currencySymbol || "₹";
  const blocks = [
    ...restaurantHeaderBlocks({ restaurant, branch }),
    { type: "line" },
    { type: "text", text: slipSettings.headerText || "ORDER CONFIRMATION", align: "center", bold: true },
    { type: "line" },
    { type: "row", left: "Order #", right: qrOrder.orderNo },
    { type: "row", left: "Time", right: formatDateTime(qrOrder.confirmedAt || qrOrder.createdAt) },
  ];
  if (qrOrder.customerName) blocks.push({ type: "row", left: "Customer", right: qrOrder.customerName });

  blocks.push(
    { type: "line" },
    {
      type: "table",
      columns: ITEM_COLUMNS,
      rows: (qrOrder.items || []).map((item) => ({
        name: item.itemName || "",
        qty: String(item.quantity || 1),
        price: formatNumber(item.price),
        total: formatNumber(item.total),
      })),
    },
    { type: "line" },
    { type: "row", left: "Grand Total", right: formatMoney(qrOrder.grandTotal, symbol), bold: true },
    { type: "line" },
  );

  blocks.push({ type: "spacer", lines: 1 });
  blocks.push({ type: "text", text: slipSettings.footerText || "Your order has been placed!", align: "center", size: "small" });
  blocks.push({ type: "spacer", lines: 2 }, { type: "cut" });

  return { paperWidth, title: "QR Order Slip", blocks };
};

module.exports = { buildKotDocument, buildBillDocument, buildQrOrderDocument };
