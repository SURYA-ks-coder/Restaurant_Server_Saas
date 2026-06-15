const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const Restaurant = require("../../restaurant/models/Restaurant.model");
const Branch = require("../../branch/models/Branch.model");
const User = require("../../auth/models/User.model");
const authService = require("../../auth/services/auth.service");
const subscriptionService = require("../../subscription/services/subscription.service");
const { seedRestaurantDefaults } = require("../../../database/seedDefaults");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");

const OWNER_PERMISSIONS = [
  "restaurant:read",
  "restaurant:update",
  "branch:read",
  "branch:create",
  "branch:update",
  "branch:delete",
  "subscription:read",
  "subscription:manage",
  "category:read",
  "category:create",
  "category:update",
  "category:delete",
  "subcategory:read",
  "subcategory:create",
  "subcategory:update",
  "subcategory:delete",
  "menu:read",
  "menu:create",
  "menu:update",
  "menu:delete",
  "table:read",
  "table:create",
  "table:update",
  "table:delete",
  "reservation:read",
  "reservation:create",
  "reservation:update",
  "reservation:delete",
  "pos:read",
  "pos:create",
  "kot:read",
  "kot:update",
  "inventory:read",
  "inventory:create",
  "inventory:update",
  "reports:read",
  "staff:read",
  "staff:create",
  "staff:update",
  "staff:delete",
  "role:read",
  "role:create",
  "role:update",
  "role:delete",
];

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const buildUniqueSlug = async (restaurantName, requestedSlug) => {
  const base = slugify(requestedSlug || restaurantName);
  if (!base)
    throw new AppError(
      "Restaurant slug could not be generated",
      httpStatus.BAD_REQUEST,
    );
  let slug = base;
  let counter = 2;
  while (await Restaurant.exists({ slug })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
};

const normalizeBranchPayload = (payload) => ({
  branchName: payload.branch?.branchName || payload.branchName || "Main Branch",
  branchCode: payload.branch?.branchCode || payload.branchCode || "MAIN",
  address: payload.branch?.address || payload.branchAddress || payload.address,
  phone: payload.branch?.phone || payload.branchPhone || payload.mobileNumber,
  manager: payload.branch?.manager,
});

const publicRestaurant = (restaurant) => ({
  _id: restaurant._id,
  restaurantName: restaurant.restaurantName || restaurant.name,
  ownerName: restaurant.ownerName,
  slug: restaurant.slug,
  subdomain: restaurant.subdomain,
  customDomain: restaurant.customDomain,
  domainStatus: restaurant.domainStatus,
  logo: restaurant.logo,
  email: restaurant.email,
  mobileNumber: restaurant.mobileNumber || restaurant.phone,
  GSTNumber: restaurant.GSTNumber,
  address: restaurant.address,
  city: restaurant.city,
  state: restaurant.state,
  country: restaurant.country,
  pincode: restaurant.pincode,
  currency: restaurant.currency,
  timezone: restaurant.timezone,
  subscriptionPlan: restaurant.subscriptionPlanName,
  trialStartDate: restaurant.trialStartDate,
  trialEndDate: restaurant.trialEndDate,
  status: restaurant.status,
  setupStatus: restaurant.setupStatus,
  onboardingSteps: restaurant.onboardingSteps,
});

const registerRestaurant = async ({ payload, file }) => {
  const emailExists = await User.exists({
    email: payload.email,
    isDeleted: false,
  });
  if (emailExists)
    throw new AppError(
      "Owner email is already registered",
      httpStatus.CONFLICT,
    );

  const slug = await buildUniqueSlug(
    payload.restaurantName,
    payload.slug || payload.subdomain,
  );
  if (
    payload.customDomain &&
    (await Restaurant.exists({ customDomain: payload.customDomain }))
  ) {
    throw new AppError("Custom domain is already in use", httpStatus.CONFLICT);
  }

  const plan = await subscriptionService.getPlanByNameOrId(
    payload.subscriptionPlan,
  );
  const restaurant = await Restaurant.create({
    restaurantName: payload.restaurantName,
    name: payload.restaurantName,
    ownerName: payload.ownerName,
    mobileNumber: payload.mobileNumber,
    phone: payload.mobileNumber,
    email: payload.email,
    GSTNumber: payload.GSTNumber,
    address: payload.address,
    city: payload.city,
    state: payload.state,
    country: payload.country,
    pincode: payload.pincode,
    logo: file ? file.location : payload.logo,
    currency: payload.currency,
    timezone: payload.timezone,
    slug,
    subdomain: payload.subdomain || slug,
    customDomain: payload.customDomain,
    domainStatus: payload.customDomain ? "pending" : "not_configured",
    setupStatus: "in_progress",
    onboardingSteps: {
      restaurantProfile: true,
      gstDetails: Boolean(payload.GSTNumber),
      logo: Boolean(file),
      branch: true,
      domain: Boolean(payload.customDomain || slug),
    },
  });

  const branchPayload = normalizeBranchPayload(payload);
  const branch = await Branch.create({
    restaurantId: restaurant._id,
    ...branchPayload,
    code: branchPayload.branchCode,
    isDefault: true,
    status: "active",
  });

  const owner = await User.create({
    restaurantId: restaurant._id,
    branchIds: [branch._id],
    defaultBranchId: branch._id,
    name: payload.ownerName,
    ownerName: payload.ownerName,
    email: payload.email,
    phone: payload.mobileNumber,
    password: payload.password,
    role: "owner",
    permissions: OWNER_PERMISSIONS,
    status: "active",
  });
  if (!branch.manager) {
    branch.manager = owner._id;
    await branch.save();
  }

  await subscriptionService.applyPlanToRestaurant({
    restaurantId: restaurant._id,
    plan,
    userId: owner._id,
  });

  await seedRestaurantDefaults({
    restaurantId: restaurant._id,
    branchId: branch._id,
    ownerId: owner._id,
  });

  const refreshedRestaurant = await Restaurant.findById(restaurant._id);
  const authUser = await User.findById(owner._id).select(
    "+password +refreshTokenHash +tokenVersion",
  );
  const auth = await authService.login({
    restaurantId: restaurant._id,
    email: owner.email,
    password: payload.password,
  });

  return {
    restaurant: publicRestaurant(refreshedRestaurant),
    branch,
    owner: authService.publicUser(authUser),
    tokens: auth.tokens,
  };
};

const updateSetupWizard = async ({ tenant, user, payload, file }) => {
  const restaurant = await Restaurant.findById(tenant.restaurantId);
  if (!restaurant)
    throw new AppError("Restaurant not found", httpStatus.NOT_FOUND);

  if (payload.subdomain && payload.subdomain !== restaurant.subdomain) {
    const exists = await Restaurant.exists({
      _id: { $ne: restaurant._id },
      subdomain: payload.subdomain,
    });
    if (exists)
      throw new AppError("Subdomain is already in use", httpStatus.CONFLICT);
  }
  if (
    payload.customDomain &&
    payload.customDomain !== restaurant.customDomain
  ) {
    const exists = await Restaurant.exists({
      _id: { $ne: restaurant._id },
      customDomain: payload.customDomain,
    });
    if (exists)
      throw new AppError(
        "Custom domain is already in use",
        httpStatus.CONFLICT,
      );
  }

  const update = { setupStatus: "in_progress" };
  const fields = [
    "restaurantName",
    "GSTNumber",
    "address",
    "city",
    "state",
    "country",
    "pincode",
    "currency",
    "timezone",
    "customDomain",
    "subdomain",
  ];
  fields.forEach((field) => {
    if (payload[field] !== undefined) update[field] = payload[field];
  });
  if (payload.restaurantName) update.name = payload.restaurantName;
  if (file) update.logo = file.location;
  if (payload.customDomain) {
    update.domainStatus = "pending";
    update["onboardingSteps.domain"] = true;
  }
  if (payload.GSTNumber) update["onboardingSteps.gstDetails"] = true;
  if (file) update["onboardingSteps.logo"] = true;
  update["onboardingSteps.restaurantProfile"] = true;

  if (payload.subscriptionPlan) {
    const plan = await subscriptionService.getPlanByNameOrId(
      payload.subscriptionPlan,
    );
    await subscriptionService.applyPlanToRestaurant({
      restaurantId: tenant.restaurantId,
      plan,
      userId: user.id,
    });
  }

  if (payload.branch) {
    const existingDefault = await Branch.findOne({
      restaurantId: tenant.restaurantId,
      isDefault: true,
      isDeleted: false,
    });
    if (existingDefault) {
      await Branch.findByIdAndUpdate(existingDefault._id, {
        ...payload.branch,
        code: payload.branch.branchCode || existingDefault.code,
        updatedBy: user.id,
      });
    } else {
      await Branch.create({
        restaurantId: tenant.restaurantId,
        ...payload.branch,
        code: payload.branch.branchCode,
        isDefault: true,
        createdBy: user.id,
      });
    }
    update["onboardingSteps.branch"] = true;
  }

  const updated = await Restaurant.findByIdAndUpdate(
    tenant.restaurantId,
    update,
    {
      new: true,
      runValidators: true,
    },
  );
  const steps = updated.onboardingSteps || {};
  const completed =
    steps.restaurantProfile && steps.branch && steps.subscription;
  if (completed && updated.setupStatus !== "completed") {
    updated.setupStatus = "completed";
    await updated.save();
  }
  return publicRestaurant(updated);
};

const uploadLogo = async ({ tenant, file }) => {
  if (!file)
    throw new AppError("Logo file is required", httpStatus.BAD_REQUEST);
  const restaurant = await Restaurant.findByIdAndUpdate(
    tenant.restaurantId,
    { logo: file.location, "onboardingSteps.logo": true },
    { new: true, runValidators: true },
  );
  if (!restaurant)
    throw new AppError("Restaurant not found", httpStatus.NOT_FOUND);
  return publicRestaurant(restaurant);
};

const checkDomainAvailability = async ({ slug, subdomain, customDomain }) => {
  const checks = {};
  if (slug) checks.slugAvailable = !(await Restaurant.exists({ slug }));
  if (subdomain)
    checks.subdomainAvailable = !(await Restaurant.exists({ subdomain }));
  if (customDomain)
    checks.customDomainAvailable = !(await Restaurant.exists({ customDomain }));
  return checks;
};

const getRestaurant = async ({ id }) => {
  const restaurant = await Restaurant.findOne({ _id: id, isDeleted: false });
  if (!restaurant)
    throw new AppError("Restaurant not found", httpStatus.NOT_FOUND);
  return publicRestaurant(restaurant);
};

const updateRestaurant = async ({ id, payload, file }) => {
  const restaurant = await Restaurant.findOne({ _id: id, isDeleted: false });
  if (!restaurant)
    throw new AppError("Restaurant not found", httpStatus.NOT_FOUND);

  if (payload.subdomain && payload.subdomain !== restaurant.subdomain) {
    const exists = await Restaurant.exists({
      _id: { $ne: id },
      subdomain: payload.subdomain,
    });
    if (exists)
      throw new AppError("Subdomain is already in use", httpStatus.CONFLICT);
  }
  if (
    payload.customDomain &&
    payload.customDomain !== restaurant.customDomain
  ) {
    const exists = await Restaurant.exists({
      _id: { $ne: id },
      customDomain: payload.customDomain,
    });
    if (exists)
      throw new AppError(
        "Custom domain is already in use",
        httpStatus.CONFLICT,
      );
  }

  const update = {};
  const fields = [
    "restaurantName",
    "ownerName",
    "mobileNumber",
    "email",
    "GSTNumber",
    "address",
    "city",
    "state",
    "country",
    "pincode",
    "currency",
    "timezone",
    "subdomain",
    "customDomain",
  ];
  fields.forEach((f) => {
    if (payload[f] !== undefined) update[f] = payload[f];
  });
  if (payload.restaurantName) update.name = payload.restaurantName;
  if (file) update.logo = file.location;
  if (payload.customDomain) update.domainStatus = "pending";

  const updated = await Restaurant.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  return publicRestaurant(updated);
};

const updateRestaurantStatus = async ({ id, status }) => {
  const restaurant = await Restaurant.findOne({ _id: id, isDeleted: false });
  if (!restaurant)
    throw new AppError("Restaurant not found", httpStatus.NOT_FOUND);
  const updated = await Restaurant.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );
  return publicRestaurant(updated);
};

const listRestaurants = async ({ query }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "restaurantName", "status"]);

  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.setupStatus) filter.setupStatus = query.setupStatus;
  if (query.search) {
    const regex = { $regex: query.search, $options: "i" };
    filter.$or = [
      { restaurantName: regex },
      { name: regex },
      { email: regex },
      { mobileNumber: regex },
      { slug: regex },
    ];
  }

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Restaurant.countDocuments(filter),
  ]);

  const items = restaurants.map(publicRestaurant);
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  OWNER_PERMISSIONS,
  registerRestaurant,
  updateSetupWizard,
  uploadLogo,
  checkDomainAvailability,
  publicRestaurant,
  listRestaurants,
  getRestaurant,
  updateRestaurant,
  updateRestaurantStatus,
};
