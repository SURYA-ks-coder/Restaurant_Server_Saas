# Backend Architecture

## Core Principles

- Every business document stores `restaurantId` and `branchId` where branch-level data is required.
- `restaurantId` is the tenant boundary for the shared MongoDB architecture. API middleware exposes it as both `req.tenant.restaurantId` and `req.tenant.tenantId`.
- Controllers only handle HTTP input/output.
- Services contain business rules such as branch ownership, duplicate checks, recipe stock deduction and billing workflows.
- Repositories wrap Mongoose queries and keep database access consistent.
- Middleware handles authentication, authorization, branch access, validation, uploads, logging, rate limits and errors.

## Multi-Tenant Architecture

This backend uses a shared database with shared collections. Tenant isolation is enforced with a required tenant field on each tenant-owned document:

```json
{
  "restaurantId": "tenant restaurant id",
  "branchId": "optional branch scope"
}
```

Authentication flow:

- JWT access tokens include `tenantId`, `restaurantId`, `branchIds`, role and permissions.
- `authenticate` loads the user from MongoDB and rejects tokens whose tenant claim does not match the persisted user.
- `enforceBranchAccess` validates that `x-branch-id` or the user's default branch belongs to the same restaurant.
- `attachTenantScope` injects `req.tenant` and helper filters:

```js
req.tenant.filter({ status: "active" });
// { status: "active", restaurantId: req.user.restaurantId }

req.tenant.branchFilter({ isDeleted: false });
// { isDeleted: false, restaurantId: req.user.restaurantId, branchId: req.user.activeBranchId }
```

Service query rule:

- Restaurant-level resources must filter by `restaurantId`.
- Branch-level resources must filter by both `restaurantId` and `branchId`.
- Never trust tenant ids from request bodies. Use `req.tenant` only.
- Owner access bypasses permission checks, but not tenant or branch existence validation.

Mongoose strategy:

- Shared collections keep `restaurantId` indexed for all tenant-owned models.
- Branch-owned models keep compound indexes like `{ restaurantId: 1, branchId: 1 }`.
- The `tenantScope.plugin` adds `Model.withTenant(tenantId, filter)` and `.byTenant(tenantId)` helpers for new models.
- Unique business keys are tenant scoped, for example branch code uses `{ restaurantId: 1, code: 1 }`.

Security best practices:

- Do not expose cross-tenant lookup APIs without an explicit super-admin route.
- Do not allow `restaurantId`, `tenantId`, or `branchId` from the body to override middleware context.
- Keep indexes aligned with tenant filters to avoid full collection scans as tenants grow.
- Run subscription and plan checks after tenant injection and before resource creation.
- Add tests for every new model proving tenant A cannot read, update, or delete tenant B data.

## API Standards

Base URL: `/api/v1`

Success response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource fetched",
  "data": {},
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Error response:

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [{ "field": "itemName", "message": "\"itemName\" is required" }]
}
```

## Module Roadmap

- Onboarding: `Restaurant`, owner user, default branch, slug/subdomain, logo, GST details, trial activation and setup wizard.
- Subscription: `SubscriptionPlan`, `RestaurantSubscription`, plan limits, feature middleware, upgrade/downgrade and expiration processing.
- POS Billing: `Bill`, payment capture, tax/discount calculation, receipt printing and recipe deduction.
- Table Management: `DiningTable`, reservation and live table status through Socket.IO.
- Kitchen KOT: `Kot`, kitchen section queues and realtime status events.
- Inventory: `InventoryItem`, stock ledger, vendor purchases, wastage, low-stock alerts.
- Recipe Deduction: `Recipe` maps menu items to inventory quantities, deducted inside POS transaction.
- Expenses: `Expense` for cash flow and branch profitability reports.
- Reports: aggregate bills, payments, taxes, item sales, stock, expenses and loyalty.
- QR Ordering: public order session tied to table and branch.
- Loyalty: customers, points ledger and redemption rules.
- Staff: users, shifts, attendance and role permission assignments.
- Notifications: persistent `Notification` records plus Socket.IO `notification:new`.
- Dashboard Analytics: Mongo aggregation services scoped by restaurant and branch.
