const sendSuccess = (res, { statusCode = 200, message = "Success", data = null, meta = null }) => {
  const body = { success: true, statusCode, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const sendError = (res, { statusCode = 500, message = "Something went wrong", errors = null }) => {
  const body = { success: false, statusCode, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };
