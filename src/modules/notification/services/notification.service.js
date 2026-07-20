const notificationRepository = require("../repositories/notification.repository");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

/**
 * Recent notification history for the bell dropdown, scoped to the caller's
 * branch. unreadCount is server-computed so it survives a page refresh
 * instead of resetting to 0 on every mount.
 */
const listNotifications = async ({ tenant, query = {} }) => {
  const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, MAX_LIMIT);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };

  const [items, unreadCount] = await Promise.all([
    notificationRepository.list({ filter, limit }),
    notificationRepository.countUnread(filter),
  ]);

  return { items, unreadCount };
};

const markAllRead = async ({ tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  await notificationRepository.markAllRead(filter);
  return { acknowledged: true };
};

module.exports = { listNotifications, markAllRead };
