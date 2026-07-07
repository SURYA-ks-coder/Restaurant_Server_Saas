const formatMoney = (value, symbol = "₹") =>
  `${symbol}${Number(value || 0).toFixed(2)}`;

const formatNumber = (value) => Number(value || 0).toFixed(2);

const formatDateTime = (date) =>
  new Date(date || Date.now()).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

module.exports = { formatMoney, formatNumber, formatDateTime };
