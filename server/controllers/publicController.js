const TeamMember = require("../models/TeamMember");
const asyncHandler = require("../utils/asyncHandler");

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
        }),
      )
    : { order: 1, createdAt: -1 };

  const numericLimit = Math.min(Math.max(parseInt(String(limit), 10) || 48, 1), 200);

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
    const existingOrder = typeof existing.order === "number" ? existing.order : Number.POSITIVE_INFINITY;
    const incomingOrder = typeof m.order === "number" ? m.order : Number.POSITIVE_INFINITY;

    if (incomingOrder < existingOrder) {
      dedupeMap.set(key, m);
    } else if (incomingOrder === existingOrder) {
      const existingCreated = existing.createdAt ? new Date(existing.createdAt) : new Date(0);
      const incomingCreated = m.createdAt ? new Date(m.createdAt) : new Date(0);
      if (incomingCreated < existingCreated) {
        dedupeMap.set(key, m);
      }
    }
  }

  const members = Array.from(dedupeMap.values());

  res.status(200).json({ success: true, count: members.length, data: members });
});
