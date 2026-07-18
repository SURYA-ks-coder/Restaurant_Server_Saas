# FlavorHub Print Agent

Small background app that lets a **cloud-hosted** FlavorHub server print to thermal
printers inside the restaurant's local network. It connects *outward* to the server
(no router/port-forwarding setup needed), receives print jobs, and forwards them to
the printer over the LAN.

```
Cloud server ──(Socket.IO, outbound)── Print agent (restaurant PC) ──(TCP 9100)── Thermal printer
```

If no agent is connected for a branch, the server falls back to printing directly
(works when the server itself runs on-premise) and finally to browser printing.

## Setup (once per branch)

1. In the dashboard, add your printers under **Print Settings** with connection
   type `lan`, their IP and port (usually 9100).
2. Generate an agent key: `POST /print/settings/agent-key` (Print Settings → Agent).
   Copy the key — it is shown only once.
3. On any always-on PC in the restaurant (same network as the printers), install
   [Node.js](https://nodejs.org), copy this `print-agent` folder, then:

   ```
   cd print-agent
   npm install
   ```

4. Create a `.env` file next to `agent.js`:

   ```
   SERVER_URL=https://api.yourdomain.com
   BRANCH_ID=<branch id>
   AGENT_KEY=<key from step 2>
   ```

5. Start it:

   ```
   npm start
   ```

You should see `Connected to server, printing for branch ...`, and the dashboard's
`GET /print/agent/status` will report `online: true`. KOTs and bills now print
automatically.

## Running it permanently (one-time setup — no daily starting needed)

The agent reconnects automatically after internet/server outages, so the only
thing to handle is PC reboots. Set up auto-start once and forget it.

**Windows** (`pm2 startup` does not work on Windows — use pm2-windows-startup):

```
npm install -g pm2 pm2-windows-startup
pm2-startup install
pm2 start agent.js --name flavorhub-print-agent
pm2 save
```

**Linux / macOS:**

```
npm install -g pm2
pm2 start agent.js --name flavorhub-print-agent
pm2 save
pm2 startup   # then run the command it prints
```

After this, the agent starts by itself on every boot. Check it anytime with
`pm2 status` or `pm2 logs flavorhub-print-agent`.

## Troubleshooting

- **`Connection failed: Invalid print agent credentials`** — the AGENT_KEY or
  BRANCH_ID is wrong, or the key was rotated. Generate a new key and update `.env`.
- **`Print FAILED ... timed out`** — the agent can't reach the printer IP. Check
  the printer is on, its IP is correct in Print Settings, and it's on the same
  network as this PC.
- **Dashboard shows agent offline** — check this app is running (`pm2 status`)
  and that outbound connections to SERVER_URL are allowed.
