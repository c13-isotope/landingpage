// server/controllers/blogController.js
const Blog = require("../models/blogModel");

/**
 * GET /api/blog/public/list
 * Optional query: page, limit, tag
 */
exports.listPublicBlogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
    const skip = (page - 1) * limit;

    const query = { status: "published" };
    if (req.query.tag) query.tags = req.query.tag.toLowerCase();

    const [items, total] = await Promise.all([
      Blog.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * GET /api/blog/public/:slug
 */
exports.getPublicBlogBySlug = async (req, res) => {
  try {
    const doc = await Blog.findOne({
      slug: req.params.slug,
      status: "published",
    }).lean();

    if (!doc) return res.status(404).json({ error: "blog not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * GET /api/blog/public/search?q=...&page=&limit=
 * Full-text search on title, excerpt, content
 */
exports.searchPublicBlogs = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.json({ items: [], total: 0, page: 1, totalPages: 1, q: "" });
    }

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
    const skip = (page - 1) * limit;

    const query = { $text: { $search: q }, status: "published" };

    const [items, total] = await Promise.all([
      Blog.find(query, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" }, publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      q,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ------------------ Admin (x-admin-key) ------------------

/**
 * POST /api/blog
 */
exports.createBlog = async (req, res) => {
  try {
    const doc = await Blog.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/**
 * PUT /api/blog/:id
 */
exports.updateBlog = async (req, res) => {
  try {
    const doc = await Blog.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!doc) return res.status(404).json({ error: "blog not found" });
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/**
 * DELETE /api/blog/:id
 */
exports.deleteBlog = async (req, res) => {
  try {
    const out = await Blog.findByIdAndDelete(req.params.id).lean();
    if (!out) return res.status(404).json({ error: "blog not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
