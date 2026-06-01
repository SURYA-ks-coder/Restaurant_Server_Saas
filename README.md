# Restaurant Management SaaS Backend

Node.js, Express, MongoDB, JWT, Socket.IO, MVC modules, repository pattern, RBAC, branch access, uploads, pagination, search and filtering.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

API base path: `/api/v1`

Swagger UI: `/api-docs`

## Implemented modules

- Auth: register, login, logout, refresh, forgot password, reset password, change password, current user.
- Category: CRUD, image upload, pagination, search, sorting, status filtering, soft delete.
- Subcategory: CRUD, category filter, pagination, search, soft delete.
- Menu Item: CRUD, image upload, pricing, availability, low-stock alerts, search, filters.

## Architecture

Each feature module follows:

```text
controllers -> services -> repositories -> models
routes -> validators -> middleware
```

Shared middleware handles auth, permissions, tenant/branch scope, validation, upload, logging and errors.
