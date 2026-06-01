const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const Restaurant = require("../../restaurant/models/Restaurant.model");
const Branch = require("../../branch/models/Branch.model");
const User = require("../../auth/models/User.model");
const planRepository = require("../repositories/subscriptionPlan.repository");
const subscriptionRepository = require("../repositories/restaurantSubscription.repository");

const DEFAULT_PLANS = [
  {
    planName: "Free Trial",
    price: 0,
    billingCycle: "trial",
    trialDays: 14,
    maxBranches: 1,
    maxUsers: 3,
    maxOrders: 100,
    features: ["menu", "pos", "qr_order"],
    isSystem: true,
  },
  {
    planName: "Starter",
    price: 999,
    billingCycle: "monthly",
    maxBranches: 1,
    maxUsers: 5,
    maxOrders: 1000,
    features: ["menu", "pos", "qr_order", "inventory"],
    isSystem: true,
  },
  {
    planName: "Professional",
    price: 2499,
    billingCycle: "monthly",
    maxBranches: 5,
    maxUsers: 25,
    maxOrders: 10000,
    features: [
      "menu",
      "pos",
      "qr_order",
      "inventory",
      "reports",
      "staff",
      "kot",
    ],
    isSystem: true,
  },
  {
    planName: "Enterprise",
    price: 0,
    billingCycle: "custom",
    maxBranches: 0,
    maxUsers: 0,
    maxOrders: 0,
    features: [
      "menu",
      "pos",
      "qr_order",
      "inventory",
      "reports",
      "staff",
      "kot",
      "multi_branch",
      "custom_domain",
    ],
    isSystem: true,
  },
];

const addDays = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const ensureDefaultPlans = async () => {
  for (const plan of DEFAULT_PLANS) {
    const exists = await planRepository.findOne({ planName: plan.planName });
    if (!exists) await planRepository.create({ ...plan, status: "active" });
  }
};

const getPlanByNameOrId = async (value = "basic") => {
  await ensureDefaultPlans();
  const filter = /^[0-9a-fA-F]{24}$/.test(String(value))
    ? { _id: value, status: "active" }
    : { planName: value, status: "active" };
  const plan = await planRepository.findOne(filter);
  if (!plan)
    throw new AppError("Subscription plan not found", httpStatus.NOT_FOUND);
  return plan;
};

const calculateExpiry = (plan, startDate) => {
  if (plan.billingCycle === "trial")
    return addDays(startDate, plan.trialDays || 14);
  if (plan.billingCycle === "monthly") return addDays(startDate, 30);
  if (plan.billingCycle === "yearly") return addDays(startDate, 365);
  return null;
};

const applyPlanToRestaurant = async ({ restaurantId, plan, userId }) => {
  const now = new Date();
  await subscriptionRepository.model.updateMany(
    { restaurantId, status: { $in: ["trialing", "active", "past_due"] } },
    { status: "cancelled" },
  );

  const isTrial = plan.billingCycle === "trial";
  const subscription = await subscriptionRepository.create({
    restaurantId,
    planId: plan._id,
    planName: plan.planName,
    billingCycle: plan.billingCycle,
    price: plan.price,
    startsAt: now,
    expiresAt: calculateExpiry(plan, now),
    trialStartDate: isTrial ? now : undefined,
    trialEndDate: isTrial ? calculateExpiry(plan, now) : undefined,
    status: isTrial ? "trialing" : "active",
    limitsSnapshot: {
      maxBranches: plan.maxBranches,
      maxUsers: plan.maxUsers,
      maxOrders: plan.maxOrders,
    },
    featuresSnapshot: plan.features,
    changedBy: userId,
  });

  const restaurantUpdate = {
    subscriptionPlan: plan._id,
    subscriptionPlanName: plan.planName,
    currentSubscriptionId: subscription._id,
    status: isTrial ? "trialing" : "active",
    "onboardingSteps.subscription": true,
  };
  if (isTrial) {
    restaurantUpdate.trialStartDate = subscription.trialStartDate;
    restaurantUpdate.trialEndDate = subscription.trialEndDate;
  }
  await Restaurant.findByIdAndUpdate(restaurantId, restaurantUpdate, {
    runValidators: true,
  });
  return subscription;
};

const createPlan = async (payload) => {
  const exists = await planRepository.findOne({ planName: payload.planName });
  if (exists)
    throw new AppError("Plan name already exists", httpStatus.CONFLICT);
  return planRepository.create(payload);
};

const updatePlan = async ({ id, payload }) => {
  const plan = await planRepository.updateById(id, payload);
  if (!plan) throw new AppError("Plan not found", httpStatus.NOT_FOUND);
  return plan;
};

const listPlans = async (query = {}) => {
  await ensureDefaultPlans();
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "planName", "price"]);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.billingCycle) filter.billingCycle = query.billingCycle;
  const [items, total] = await planRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const getCurrentSubscription = async (restaurantId) => {
  const subscription = await subscriptionRepository
    .findCurrent(restaurantId)
    .populate("planId");
  if (!subscription)
    throw new AppError("No active subscription found", httpStatus.NOT_FOUND);
  return subscription;
};

const changePlan = async ({ restaurantId, planId, userId }) => {
  const plan = await getPlanByNameOrId(planId);
  return applyPlanToRestaurant({ restaurantId, plan, userId });
};

const expireSubscriptions = async () => {
  const now = new Date();
  const expired = await subscriptionRepository.model.updateMany(
    {
      expiresAt: { $lte: now },
      status: { $in: ["trialing", "active", "past_due"] },
    },
    { status: "expired" },
  );
  await Restaurant.updateMany(
    {
      currentSubscriptionId: { $exists: true },
      trialEndDate: { $lte: now },
      status: "trialing",
    },
    { status: "expired" },
  );
  return expired;
};

const getUsage = async (restaurantId) => {
  const [branches, users] = await Promise.all([
    Branch.countDocuments({ restaurantId, isDeleted: false, status: "active" }),
    User.countDocuments({ restaurantId, isDeleted: false, status: "active" }),
  ]);
  return { branches, users };
};

const assertLimit = async ({ restaurantId, resource }) => {
  const subscription = await getCurrentSubscription(restaurantId);
  const usage = await getUsage(restaurantId);
  const limits = subscription.limitsSnapshot || {};
  if (
    resource === "branches" &&
    limits.maxBranches > 0 &&
    usage.branches >= limits.maxBranches
  ) {
    throw new AppError(
      "Branch limit reached for current subscription plan",
      httpStatus.FORBIDDEN,
    );
  }
  if (
    resource === "users" &&
    limits.maxUsers > 0 &&
    usage.users >= limits.maxUsers
  ) {
    throw new AppError(
      "User limit reached for current subscription plan",
      httpStatus.FORBIDDEN,
    );
  }
  return { subscription, usage };
};

const hasFeature = async ({ restaurantId, feature }) => {
  const subscription = await getCurrentSubscription(restaurantId);
  if (subscription.expiresAt && subscription.expiresAt <= new Date()) {
    throw new AppError("Subscription has expired", httpStatus.PAYMENT_REQUIRED);
  }
  if (!subscription.featuresSnapshot.includes(feature)) {
    throw new AppError(
      "Feature is not available in current subscription plan",
      httpStatus.FORBIDDEN,
    );
  }
  return subscription;
};

module.exports = {
  DEFAULT_PLANS,
  ensureDefaultPlans,
  getPlanByNameOrId,
  applyPlanToRestaurant,
  createPlan,
  updatePlan,
  listPlans,
  getCurrentSubscription,
  changePlan,
  expireSubscriptions,
  assertLimit,
  hasFeature,
};
