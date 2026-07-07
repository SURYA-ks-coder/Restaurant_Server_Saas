# Printer Integration — Client Guide

Covers `/api/v1/print/*`. All routes require `Authorization: Bearer <token>` and an active branch (`x-branch-id` header or the user's default branch), same as every other module.

## 1. How printing actually happens

Two delivery paths exist per printer, configured per branch:

- **`connectionType: "lan"`** — the server sends raw ESC/POS bytes directly to the printer's IP over the restaurant's local network. Nothing for the client to do; it happens server-side.
- **`connectionType: "browser"`** — there's no LAN printer configured for that document type, so the server can't print it itself. It returns rendered HTML instead; the client must open it and call `window.print()` against whatever printer is set up on that machine (thermal, USB, or a regular printer).

A single "print" call can have both: any `lan` printers configured for that document type get dispatched automatically, **and** the response always includes `html` so the client can *also* trigger a browser print (e.g. as the primary path when no LAN printer exists, or as a duplicate copy).

**Auto-print already happens for you** — no client call needed for the common path:
- KOT prints automatically when a kitchen order is created (POS dine-in order or the KOT module).
- Bill prints automatically when a payment completes an order.
- QR order slip prints automatically when a customer places a QR order.

The endpoints below are for **manual/re-print** (e.g. "Reprint Bill" button, "Reprint KOT" button) and for **settings management**.

## 2. Printer settings (per branch)

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/print/settings` | `print:read` | Fetch (or lazily create) this branch's printer config |
| PUT | `/print/settings` | `print:manage` | Update `receipt` / `kot` / `qrOrderSlip` template fields |
| POST | `/print/settings/printers` | `print:manage` | Add a printer |
| PATCH | `/print/settings/printers/:printerId` | `print:manage` | Edit a printer |
| DELETE | `/print/settings/printers/:printerId` | `print:manage` | Remove a printer |

**Printer shape** (used in add/update):

```json
{
  "name": "Kitchen Printer 1",
  "purpose": "kot",              // "kot" | "bill" | "qr_order"
  "kitchenSections": ["Kitchen"], // only for purpose="kot"; empty = matches every section
  "connectionType": "lan",       // "lan" | "browser"
  "ip": "192.168.1.50",          // required when connectionType="lan"
  "port": 9100,
  "paperWidth": "80mm",          // "58mm" | "80mm"
  "isActive": true
}
```

**Template settings** (`PUT /print/settings` body — send only the section you're changing):

```json
{
  "receipt": {
    "headerText": "GST inclusive",
    "footerText": "Thank you! Visit again.",
    "showGSTNumber": true,
    "gstNumber": "29ABCDE1234F1Z5",
    "currencySymbol": "₹"
  },
  "kot": { "headerText": "KITCHEN ORDER TICKET", "showTableName": true },
  "qrOrderSlip": { "headerText": "ORDER CONFIRMATION" }
}
```

Settings example UI: a "Printers" tab under branch settings listing configured printers with add/edit/delete, plus a form for the three template sections above.

## 3. Triggering / previewing a print

| Method | Path | Permission |
|---|---|---|
| POST | `/print/kot/:id` | `kot:read` |
| GET | `/print/kot/:id/preview` | `kot:read` |
| POST | `/print/bill/:id` | `pos:read` |
| GET | `/print/bill/:id/preview` | `pos:read` |
| POST | `/print/qr-order/:id` | `qrOrder:read` |
| GET | `/print/qr-order/:id/preview` | `qrOrder:read` |

`:id` is the KOT / Bill / QrOrder `_id`.

**POST response:**

```json
{
  "success": true,
  "message": "Bill print dispatched",
  "data": {
    "html": "<!doctype html>...",
    "printers": [
      { "printerId": "...", "name": "Billing Counter", "connectionType": "lan", "dispatched": true },
      { "printerId": "...", "name": "Backup Printer", "connectionType": "browser", "dispatched": false }
    ]
  }
}
```

`printers` tells you what happened per configured printer:
- `connectionType: "lan", dispatched: true` — already printed physically, nothing more to do.
- `connectionType: "lan", dispatched: false` (with an `error` field) — the network printer failed (offline, wrong IP, timeout). Surface this to the user; you likely still want to fall back to browser print.
- `connectionType: "browser"` — always `dispatched: false`, by design. This is your cue to open `data.html` and print it client-side.
- `printers: []` — no printer configured at all for that document/branch. Treat this the same as a browser-connectionType entry: open `data.html` yourself.

**GET `.../preview`** returns the HTML directly (`Content-Type: text/html`) with no side effects — no LAN dispatch. Use this for an on-screen "Preview receipt" viewer, or to feed an `<iframe>`.

## 4. Client integration pattern

```js
async function printBill(billId) {
  const res = await api.post(`/print/bill/${billId}`);
  const { html, printers } = res.data.data;

  const needsBrowserPrint =
    printers.length === 0 ||
    printers.some((p) => !p.dispatched);

  if (needsBrowserPrint) {
    printHtmlInBrowser(html);
  }

  const failedLan = printers.filter((p) => p.connectionType === "lan" && !p.dispatched && p.error);
  if (failedLan.length) {
    toast.warn(`Kitchen printer offline: ${failedLan.map((p) => p.name).join(", ")}`);
  }
}

function printHtmlInBrowser(html) {
  const win = window.open("", "_blank", "width=400,height=600");
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}
```

Alternative to `window.open`: fetch `GET /print/bill/:id/preview` directly into a hidden `<iframe src="...">` and call `iframe.contentWindow.print()` — avoids popup-blocker issues since it's a same-tab navigation rather than `window.open`.

## 5. Typical UI hookup points

- **KOT screen / kitchen display**: a "Reprint" button per KOT card → `POST /print/kot/:id`.
- **POS / billing screen**: a "Print Bill" button on the checkout panel → `POST /print/bill/:id` (this duplicates the automatic print-on-payment, useful for reprints or printing before payment is recorded, e.g. a proforma).
- **QR order admin view**: a "Reprint Slip" action → `POST /print/qr-order/:id`.
- **Branch settings**: printer + template management screens described in §2, gated behind `print:manage` (only Owner/Manager by default — see `DEFAULT_ROLES` in `src/database/seedDefaults.js`).

## 6. Permissions note

`print:read` / `print:manage` are new permission strings. They're only seeded automatically for **newly created** restaurants (via `seedRestaurantDefaults`). For restaurants that already existed before this feature shipped, an Owner/platform admin needs to add `print:read` / `print:manage` to the relevant custom roles through the existing role-management screen — restaurant/platform owners bypass permission checks entirely, so they can use every endpoint above regardless.
