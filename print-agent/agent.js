/**
 * FlavorHub on-site print agent.
 *
 * Runs on any machine inside the restaurant's network. Connects OUT to the
 * cloud server over Socket.IO (so no port-forwarding is needed), receives
 * ready-to-print ESC/POS jobs, and forwards the raw bytes to the local
 * thermal printer over TCP (usually port 9100).
 *
 * Configuration (via .env file or environment variables):
 *   SERVER_URL  - e.g. https://api.yourdomain.com
 *   BRANCH_ID   - the branch this agent prints for
 *   AGENT_KEY   - generated in the dashboard (POST /print/settings/agent-key)
 */
require("dotenv").config();
const net = require("net");
const { io } = require("socket.io-client");

const SERVER_URL = process.env.SERVER_URL;
const BRANCH_ID = process.env.BRANCH_ID;
const AGENT_KEY = process.env.AGENT_KEY;
const PRINT_TIMEOUT_MS = 10000;

if (!SERVER_URL || !BRANCH_ID || !AGENT_KEY) {
  console.error("Missing configuration. Set SERVER_URL, BRANCH_ID and AGENT_KEY (see README).");
  process.exit(1);
}

const log = (...args) => console.log(new Date().toISOString(), ...args);

// Writes raw ESC/POS bytes to the printer and resolves once the socket flushes.
const sendToPrinter = ({ ip, port, buffer }) =>
  new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: ip, port: port || 9100 });
    const fail = (error) => {
      socket.destroy();
      reject(error);
    };
    socket.setTimeout(PRINT_TIMEOUT_MS, () => fail(new Error(`Printer ${ip} timed out`)));
    socket.on("error", fail);
    socket.on("connect", () => {
      socket.end(buffer, () => resolve());
    });
  });

const socket = io(`${SERVER_URL.replace(/\/$/, "")}/print-agent`, {
  auth: { agentKey: AGENT_KEY, branchId: BRANCH_ID },
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 30000,
});

socket.on("connect", () => log(`Connected to server, printing for branch ${BRANCH_ID}`));
socket.on("connect_error", (err) => log(`Connection failed: ${err.message} (retrying)`));
socket.on("disconnect", (reason) => log(`Disconnected: ${reason}`));

socket.on("print:job", async (job, ack) => {
  const done = typeof ack === "function" ? ack : () => {};
  try {
    if (!job?.ip || !job?.data) throw new Error("Malformed print job");
    const buffer = Buffer.from(job.data, "base64");
    log(`Printing to ${job.name || job.ip} (${job.ip}:${job.port || 9100}, ${buffer.length} bytes)`);
    await sendToPrinter({ ip: job.ip, port: job.port, buffer });
    log(`Printed OK on ${job.name || job.ip}`);
    done({ ok: true, printerId: job.printerId });
  } catch (error) {
    log(`Print FAILED on ${job?.name || job?.ip}: ${error.message}`);
    done({ ok: false, printerId: job?.printerId, error: error.message });
  }
});
