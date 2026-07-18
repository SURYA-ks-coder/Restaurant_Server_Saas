const { getIo } = require("../../../sockets");

const AGENT_ACK_TIMEOUT_MS = 15000;

const agentRoom = (branchId) => `print-agent:${branchId}`;

const isAgentOnline = async (branchId) => {
  const io = getIo();
  if (!io) return false;
  const sockets = await io.of("/print-agent").in(agentRoom(branchId)).fetchSockets();
  return sockets.length > 0;
};

// Sends one print job to the branch's agent and waits for its ack.
// Resolves { ok, error? } from the agent, or rejects on timeout / no listener.
const sendPrintJob = (branchId, job) =>
  new Promise((resolve, reject) => {
    const io = getIo();
    if (!io) return reject(new Error("Socket server not initialised"));
    io.of("/print-agent")
      .to(agentRoom(branchId))
      .timeout(AGENT_ACK_TIMEOUT_MS)
      .emit("print:job", job, (err, responses) => {
        if (err) return reject(new Error("Print agent did not acknowledge in time"));
        // One response per connected agent socket; first non-empty wins
        const response = (responses || []).find(Boolean);
        if (!response) return reject(new Error("Print agent returned no response"));
        return resolve(response);
      });
  });

module.exports = { isAgentOnline, sendPrintJob };
