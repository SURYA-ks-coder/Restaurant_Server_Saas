const AppError = require("../utils/AppError");

const tenantScopePlugin = (schema, { field = "restaurantId" } = {}) => {
  schema.query.byTenant = function byTenant(tenantId) {
    return this.where({ [field]: tenantId });
  };

  schema.statics.withTenant = function withTenant(tenantId, filter = {}) {
    if (!tenantId) throw new AppError("Tenant id is required for scoped query", 400);
    return { ...filter, [field]: tenantId };
  };
};

module.exports = tenantScopePlugin;
