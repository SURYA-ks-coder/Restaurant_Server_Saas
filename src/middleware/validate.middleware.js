const AppError = require("../utils/AppError");

const validate = (schema) => (req, res, next) => {
  const targets = ["body", "params", "query"];
  const errors = [];

  for (const target of targets) {
    if (!schema[target]) continue;
    const { value, error } = schema[target].validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    if (error) {
      errors.push(
        ...error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message
        }))
      );
    } else {
      req[target] = value;
    }
  }

  if (errors.length) return next(new AppError("Validation failed", 422, errors));
  return next();
};

module.exports = validate;
