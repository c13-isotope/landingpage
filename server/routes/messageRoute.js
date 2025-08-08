// server/routes/messageRoute.js
const express = require("express");
const {
  getMessage,
  postMessage,
  getAllMessages,
  updateMessage,
  deleteMessage,
  searchMessages,
} = require("../controllers/messageController");
const {
  validatePagination,
  validateSearch,
} = require("../middleware/validators");

const router = express.Router();

// Health/ping for this resource
router.get("/", getMessage);

// Create a message
router.post("/", postMessage);

// List messages (paginated) -> validates ?page & ?limit
router.get("/all", validatePagination, getAllMessages);

// Update/Delete by id
router.put("/:id", updateMessage);
router.delete("/:id", deleteMessage);

// Search with validation for ?query, ?sort, ?page, ?limit
// GET /api/message/search?query=hello&sort=relevance|recent&page=1&limit=5
router.get("/search", validateSearch, searchMessages);

module.exports = router;
