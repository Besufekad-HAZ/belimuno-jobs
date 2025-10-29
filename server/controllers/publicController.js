const TeamMember = require("../models/TeamMember");
const asyncHandler = require("../utils/asyncHandler");
const News = require("../models/News");
const Client = require("../models/Client");
const Service = require("../models/Service");
const TrustedCompany = require("../models/TrustedCompany");
const DEFAULT_TEAM_MEMBERS = require("../data/defaultTeamMembers");

// Public controller to return deduped team members for About page
exports.getPublicTeamMembers = asyncHandler(async (req, res) => {
  const { limit = 48, sort = "order" } = req.query;

  const sortTokens = String(sort)
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const sortCriteria = sortTokens.length
    ? Object.fromEntries(
        sortTokens.map((token) => {
          const direction = token.startsWith("-") ? -1 : 1;
          const key = token.replace(/^[-+]/, "");
          return [key || "order", direction];
        })
      )
    : { order: 1, createdAt: -1 };

  const numericLimit = Math.min(
    Math.max(parseInt(String(limit), 10) || 48, 1),
    200
  );

  let rawMembers = await TeamMember.find({ status: "active" })
    .sort(sortCriteria)
    .limit(numericLimit)
    .lean();

  // Auto-seed default team members if none exist to keep frontend and backend in sync
  if (!rawMembers || rawMembers.length === 0) {
    try {
      // Only seed if the collection is completely empty to avoid duplicates
      const existingCount = await TeamMember.countDocuments();
      if (existingCount === 0 && Array.isArray(DEFAULT_TEAM_MEMBERS)) {
        const seedDocs = DEFAULT_TEAM_MEMBERS.map((m) => ({
          name: m.name,
          role: m.role,
          department: m.department,
          // Preserve client/public images as-is; client resolves relative paths correctly
          photoUrl: m.image || undefined,
          status: "active",
          order:
            typeof m.order === "number" && Number.isFinite(m.order)
              ? m.order
              : undefined,
        }));
        if (seedDocs.length > 0) {
          await TeamMember.insertMany(seedDocs, { ordered: false });
        }
        rawMembers = await TeamMember.find({ status: "active" })
          .sort(sortCriteria)
          .limit(numericLimit)
          .lean();
      }
    } catch (seedErr) {
      // Non-fatal: log and continue with empty result
      console.warn("Auto-seed of default team members failed:", seedErr);
    }
  }

  // Ensure any missing defaults are present even when collection isn't empty
  try {
    const allExisting = await TeamMember.find({}, "name role").lean();
    const toKey = (m) =>
      `${(m.name || "").toString().trim().toLowerCase()}::${(m.role || "")
        .toString()
        .trim()
        .toLowerCase()}`;
    const existingKeys = new Set(allExisting.map(toKey));
    const missing = (DEFAULT_TEAM_MEMBERS || []).filter(
      (m) => !existingKeys.has(toKey(m))
    );
    if (missing.length > 0) {
      const docs = missing.map((m) => ({
        name: m.name,
        role: m.role,
        department: m.department,
        photoUrl: m.image || undefined,
        status: "active",
        order:
          typeof m.order === "number" && Number.isFinite(m.order)
            ? m.order
            : undefined,
      }));
      await TeamMember.insertMany(docs, { ordered: false });
      // Refresh active list after backfill
      rawMembers = await TeamMember.find({ status: "active" })
        .sort(sortCriteria)
        .limit(numericLimit)
        .lean();
    }
  } catch (backfillErr) {
    console.warn(
      "Backfill of missing default team members failed:",
      backfillErr
    );
  }

  const normalizeKey = (m) => {
    const name = (m.name || "").toString().trim().toLowerCase();
    const role = (m.role || "").toString().trim().toLowerCase();
    return `${name}::${role}`;
  };

  const dedupeMap = new Map();
  for (const m of rawMembers) {
    const key = normalizeKey(m);
    if (!dedupeMap.has(key)) {
      dedupeMap.set(key, m);
      continue;
    }

    const existing = dedupeMap.get(key);
    const existingOrder =
      typeof existing.order === "number"
        ? existing.order
        : Number.POSITIVE_INFINITY;
    const incomingOrder =
      typeof m.order === "number" ? m.order : Number.POSITIVE_INFINITY;

    if (incomingOrder < existingOrder) {
      dedupeMap.set(key, m);
    } else if (incomingOrder === existingOrder) {
      const existingCreated = existing.createdAt
        ? new Date(existing.createdAt)
        : new Date(0);
      const incomingCreated = m.createdAt ? new Date(m.createdAt) : new Date(0);
      if (incomingCreated < existingCreated) {
        dedupeMap.set(key, m);
      }
    }
  }

  const members = Array.from(dedupeMap.values());

  res.status(200).json({ success: true, count: members.length, data: members });
});

// @desc    Get all news articles with filtering
// @route   GET /api/public/news
// @access  Public
exports.getNews = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    page = 1,
    limit = 20,
    search,
    sort = "-date",
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
    ];
  }

  const sortBy = sort ? String(sort).split(",").join(" ") : "-date";
  const newsQuery = News.find(query)
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const news = await newsQuery;
  const total = await News.countDocuments(query);

  res.status(200).json({
    success: true,
    count: news.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: news,
  });
});

// @desc    Get single news article
// @route   GET /api/public/news/:id
// @access  Public
exports.getNewsArticle = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return res.status(404).json({
      success: false,
      message: "News article not found",
    });
  }

  res.status(200).json({
    success: true,
    data: news,
  });
});

// @desc    Get all clients with filtering
// @route   GET /api/public/clients
// @access  Public
exports.getClients = asyncHandler(async (req, res) => {
  const {
    status,
    type,
    service,
    page = 1,
    limit = 20,
    search,
    sort = "-createdAt",
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  if (service) query.service = service;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { type: { $regex: search, $options: "i" } },
      { service: { $regex: search, $options: "i" } },
    ];
  }

  const sortBy = sort ? String(sort).split(",").join(" ") : "-createdAt";
  const clientsQuery = Client.find(query)
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const clients = await clientsQuery;
  const total = await Client.countDocuments(query);

  res.status(200).json({
    success: true,
    count: clients.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: clients,
  });
});

// @desc    Get all services with filtering
// @route   GET /api/public/services
// @access  Public
exports.getServices = asyncHandler(async (req, res) => {
  const {
    status = "active",
    page = 1,
    limit = 20,
    search,
    sort = "createdAt",
  } = req.query;

  const query = {};
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const sortBy = sort ? String(sort).split(",").join(" ") : "createdAt";
  const servicesQuery = Service.find(query)
    .sort(sortBy)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const services = await servicesQuery;
  const total = await Service.countDocuments(query);

  res.status(200).json({
    success: true,
    count: services.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
    data: services,
  });
});

// @desc    Get single service details
// @route   GET /api/public/services/:id
// @access  Public
exports.getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: "Service not found",
    });
  }

  res.status(200).json({
    success: true,
    data: service,
  });
});

// @desc    Get trusted companies for marquee display
// @route   GET /api/public/trusted-companies
// @access  Public
exports.getTrustedCompanies = asyncHandler(async (req, res) => {
  const {
    status,
    search,
    sort = "order name",
    limit = 60,
  } = req.query;

  const query = {};
  if (status) {
    const normalizedStatus = String(status).toLowerCase();
    if (normalizedStatus !== "all") {
      query.status = status;
    }
  } else {
    query.status = "active";
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const numericLimit = Math.min(
    Math.max(parseInt(String(limit), 10) || 60, 1),
    200
  );
  const sortBy = sort ? String(sort).split(",").join(" ") : "order name";

  const companies = await TrustedCompany.find(query)
    .sort(sortBy)
    .limit(numericLimit)
    .lean();

  res.status(200).json({
    success: true,
    count: companies.length,
    data: companies,
  });
});
