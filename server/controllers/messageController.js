// server/controllers/messageController.js
const Message = require("../models/messageModel");

// Hide internal fields in all reads
const PROJECTION = { __v: 0 }; // keep _id, text, createdAt, updatedAt

// Normalize Mongo _id -> id (string)
const normalize = (doc) => {
  if (!doc) return doc;
  const o = { ...doc, id: String(doc._id) };
  delete o._id;
  return o;
};

// Simple ping
const getMessage = (req, res) => {
  res.status(200).json({ message: "📖 ✅ Hello from API Controller!" });
};

// CREATE
const postMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const clean = (text || "").trim();
    if (!clean) return res.status(400).json({ error: "text is required" });
    if (clean.length > 1000) {
      return res.status(400).json({ error: "text too long (max 1000 chars)" });
    }

    const created = await Message.create({ text: clean });
    const doc = await Message.findById(created._id, PROJECTION).lean();
    res.status(201).json(normalize(doc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ ALL with pagination: GET /api/message/all?page=1&limit=5
const getAllMessages = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Message.find({}, PROJECTION).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Message.countDocuments(),
    ]);

    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasPrev: page > 1,
      hasNext: page * limit < total,
      items: items.map(normalize),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const clean = (text || "").trim();
    if (!clean) return res.status(400).json({ error: "text is required" });
    if (clean.length > 1000) {
      return res.status(400).json({ error: "text too long (max 1000 chars)" });
    }

    const exists = await Message.findByIdAndUpdate(id, { text: clean });
    if (!exists) return res.status(404).json({ error: "Message not found" });

    const updated = await Message.findById(id, PROJECTION).lean();
    res.status(200).json(normalize(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Message not found" });
    res.status(200).json({ success: true, deletedId: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// SEARCH: GET /api/message/search?query=hello&page=1&limit=5&sort=relevance|recent
const searchMessages = async (req, res) => {
  try {
    const { query = "", page = 1, limit = 10, sort = "relevance" } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const skip = (pageNum - 1) * perPage;
    const normalizedSort = ("" + sort).toLowerCase(); // "relevance" | "recent"

    // Empty query -> recent list with pagination
    if (!query.trim()) {
      const [items, total] = await Promise.all([
        Message.find({}, PROJECTION).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
        Message.countDocuments(),
      ]);
      return res.json({
        page: pageNum,
        limit: perPage,
        total,
        totalPages: Math.max(Math.ceil(total / perPage), 1),
        hasPrev: pageNum > 1,
        hasNext: pageNum * perPage < total,
        items: items.map(normalize),
      });
    }

    // Full-text search using the text index on `text`
    const filter = { $text: { $search: query } };

    const projection =
      normalizedSort === "relevance"
        ? { ...PROJECTION, score: { $meta: "textScore" } }
        : PROJECTION;

    const sortSpec =
      normalizedSort === "relevance"
        ? { score: { $meta: "textScore" }, createdAt: -1 }
        : { createdAt: -1 };

    const [items, total] = await Promise.all([
      Message.find(filter, projection).sort(sortSpec).skip(skip).limit(perPage).lean(),
      Message.countDocuments(filter),
    ]);

    return res.json({
      page: pageNum,
      limit: perPage,
      total,
      totalPages: Math.max(Math.ceil(total / perPage), 1),
      hasPrev: pageNum > 1,
      hasNext: pageNum * perPage < total,
      items: items.map(normalize),
    });
  } catch (err) {
    // Regex fallback if text index isn't active
    try {
      const { query = "", page = 1, limit = 10 } = req.query;
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const perPage = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
      const skip = (pageNum - 1) * perPage;

      const regex = query ? new RegExp(query, "i") : /.*/;
      const filter = { text: regex };

      const [items, total] = await Promise.all([
        Message.find(filter, PROJECTION).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
        Message.countDocuments(filter),
      ]);

      return res.json({
        page: pageNum,
        limit: perPage,
        total,
        totalPages: Math.max(Math.ceil(total / perPage), 1),
        hasPrev: pageNum > 1,
        hasNext: pageNum * perPage < total,
        items: items.map(normalize),
        note: "Regex fallback used (text index not active).",
      });
    } catch {
      return res.status(500).json({ error: "Search failed." });
    }
  }
};

module.exports = {
  getMessage,
  postMessage,
  getAllMessages,
  updateMessage,
  deleteMessage,
  searchMessages,
};
