const TeamMember = require("../models/TeamMember");
const asyncHandler = require("../utils/asyncHandler");
const News = require("../models/News");

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

  const rawMembers = await TeamMember.find({ status: "active" })
    .sort(sortCriteria)
    .limit(numericLimit)
    .lean();

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
