// server/routes/blogRoute.js
const express = require("express");
const {
  listPublicBlogs,
  getPublicBlogBySlug,
  searchPublicBlogs,   // <-- add
  createBlog,
  updateBlog,
  deleteBlog,
} = require("../controllers/blogController");
const isAdminKey = require("../middleware/isAdminKey");

const router = express.Router();

// PUBLIC
router.get("/public/list", listPublicBlogs);
router.get("/public/search", searchPublicBlogs);  // <-- add
router.get("/public/:slug", getPublicBlogBySlug);

// ADMIN (protected by x-admin-key header)
router.post("/", isAdminKey, createBlog);
router.put("/:id", isAdminKey, updateBlog);
router.delete("/:id", isAdminKey, deleteBlog);

module.exports = router;
