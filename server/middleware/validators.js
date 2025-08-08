// server/middleware/validators.js

// Common helpers
const toInt = (v, def) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  };
  
  // Validates ?page & ?limit for paginated endpoints
  const validatePagination = (req, res, next) => {
    const page = Math.max(toInt(req.query.page, 1), 1);
    const limit = Math.min(Math.max(toInt(req.query.limit, 10), 1), 100);
  
    // reflect the cleaned values back on req.query so controllers use them
    req.query.page = page;
    req.query.limit = limit;
    next();
  };
  
  // Validates search query: ?query (string) & ?sort (relevance|recent)
  const validateSearch = (req, res, next) => {
    const q = (req.query.query || "").toString();
    const sort = (req.query.sort || "relevance").toString().toLowerCase();
  
    if (!["relevance", "recent"].includes(sort)) {
      return res.status(400).json({
        error: "invalid sort; allowed values: relevance, recent",
      });
    }
  
    req.query.query = q;
    req.query.sort = sort;
  
    // re-use pagination validation
    return validatePagination(req, res, next);
  };
  
  module.exports = { validatePagination, validateSearch };
  