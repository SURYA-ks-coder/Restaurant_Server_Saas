const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");
const logger = require("../config/logger");
const { allowedOrigins } = require("../config/cors");

let ioInstance = null;

const safeKeyCompare = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// On-site print agents connect here with a per-branch agent key instead of a
// user JWT. Each authenticated agent joins print-agent:<branchId>, which the
// print service targets when dispatching jobs to LAN printers.
const initPrintAgentNamespace = (io) => {
  // Required lazily to avoid a require cycle (model -> ... -> sockets)
  const PrinterSettings = require("../modules/print/models/PrinterSettings.model");
  const ns = io.of("/print-agent");

  ns.use(async (socket, next) => {
    try {
      const { agentKey, branchId } = socket.handshake.auth || {};
      if (!agentKey || !branchId)
        return next(new Error("agentKey and branchId are required"));
      const settings = await PrinterSettings.findOne({ branchId }).select("+agentKey");
      if (!settings?.agentKey || !safeKeyCompare(settings.agentKey, agentKey))
        return next(new Error("Invalid print agent credentials"));
      socket.branchId = String(branchId);
      return next();
    } catch (error) {
      return next(new Error("Print agent authentication failed"));
    }
  });

  ns.on("connection", (socket) => {
    socket.join(`print-agent:${socket.branchId}`);
    logger.info(`Print agent connected for branch ${socket.branchId}`);
    socket.emit("agent:connected", { branchId: socket.branchId });
    socket.on("disconnect", () =>
      logger.info(`Print agent disconnected for branch ${socket.branchId}`),
    );
  });
};

const canAccessBranch = (socket, branchId) => {
  const branchIds = (socket.user.branchIds || []).map(String);
  const isOwner = (socket.user.roleName || "").toLowerCase() === "owner";
  return isOwner || branchIds.includes(String(branchId));
};

const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });
  ioInstance = io;

  initPrintAgentNamespace(io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Socket authentication required"));
      socket.user = jwt.verify(token, env.jwt.accessSecret);
      return next();
    } catch (error) {
      return next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", (socket) => {
    const { restaurantId, branchIds = [] } = socket.user;
    socket.join(`restaurant:${restaurantId}`);
    socket.join(`user:${socket.user.sub}`);
    branchIds.forEach((branchId) => socket.join(`branch:${branchId}`));
    socket.emit("socket:connected", {
      socketId: socket.id,
      restaurantId,
      branchIds,
    });

    socket.on("branch:join", ({ branchId } = {}) => {
      if (!branchId || !canAccessBranch(socket, branchId)) return;
      socket.join(`branch:${branchId}`);
      socket.emit("branch:joined", { branchId });
    });

    socket.on("branch:leave", ({ branchId } = {}) => {
      if (!branchId) return;
      socket.leave(`branch:${branchId}`);
      socket.emit("branch:left", { branchId });
    });

    socket.on("kot:status:update", (payload) => {
      if (!canAccessBranch(socket, payload.branchId)) return;
      io.to(`branch:${payload.branchId}`).emit("kot:status:updated", payload);
    });

    socket.on("table:status:update", (payload) => {
      if (!canAccessBranch(socket, payload.branchId)) return;
      io.to(`branch:${payload.branchId}`).emit("table:status:updated", payload);
    });

    socket.on("order:created", (payload) => {
      if (!canAccessBranch(socket, payload.branchId)) return;
      io.to(`branch:${payload.branchId}`).emit("order:created", payload);
      io.to(`branch:${payload.branchId}`).emit("kot:created", payload);
    });

    socket.on("inventory:low-stock", (payload) => {
      if (!canAccessBranch(socket, payload.branchId)) return;
      io.to(`branch:${payload.branchId}`).emit("inventory:low-stock", payload);
    });

    socket.on("notification:send", (payload) => {
      if (payload.branchId && !canAccessBranch(socket, payload.branchId))
        return;
      io.to(
        payload.userId
          ? `user:${payload.userId}`
          : `branch:${payload.branchId}`,
      ).emit("notification:new", payload);
    });

    socket.on("waiter:alert", (payload) => {
      if (!canAccessBranch(socket, payload.branchId)) return;
      io.to(`branch:${payload.branchId}`).emit("waiter:alert", payload);
    });

    socket.on("dashboard:subscribe", ({ branchId } = {}) => {
      if (!branchId || !canAccessBranch(socket, branchId)) return;
      socket.join(`dashboard:${branchId}`);
      socket.emit("dashboard:subscribed", { branchId });
    });

    socket.on("disconnect", () =>
      logger.debug(`Socket disconnected: ${socket.id}`),
    );
  });

  return io;
};

const getIo = () => ioInstance;

module.exports = initSockets;
module.exports.getIo = getIo;
