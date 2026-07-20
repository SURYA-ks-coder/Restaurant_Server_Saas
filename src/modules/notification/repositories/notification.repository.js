const Notification = require("../models/Notification.model");

const create = (data) => Notification.create(data);

const list = ({ filter, limit }) =>
  Notification.find(filter).sort({ createdAt: -1 }).limit(limit);

const countUnread = (filter) =>
  Notification.countDocuments({ ...filter, readAt: null });

const markAllRead = (filter) =>
  Notification.updateMany({ ...filter, readAt: null }, { readAt: new Date() });

module.exports = { create, list, countUnread, markAllRead };
