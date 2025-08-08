// server/models/blogModel.js
const mongoose = require("mongoose");

// Clean + generate a slug
function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/^:+/, "")           // remove any leading colons
    .replace(/[^\w\s-]/g, "")     // keep letters/numbers/underscore/space/hyphen
    .replace(/\s+/g, "-")         // spaces -> hyphens
    .replace(/-+/g, "-")          // collapse multiple hyphens
    .replace(/^-|-$/g, "");       // trim hyphens at ends
}

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true, minlength: 3 },
    slug:  { type: String, required: [true, "Slug is required"], unique: true, trim: true, index: true },
    excerpt: { type: String, trim: true, default: "", minlength: [10, "Excerpt must be at least 10 chars"] },
    content: { type: String, required: [true, "Content is required"], minlength: 10 },
    tags: [{ type: String, trim: true, lowercase: true }],
    coverImage: { type: String, default: "" },
    author: { type: String, default: "Admin", trim: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// ----- Hooks -----
// Normalize/auto-create slug from title
blogSchema.pre("validate", function (next) {
  if (!this.slug && this.title) this.slug = slugify(this.title);
  if (this.slug) this.slug = slugify(this.slug);
  next();
});

// Set/clear publishedAt when status changes
blogSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "published" && !this.publishedAt) this.publishedAt = new Date();
    if (this.status === "draft") this.publishedAt = undefined;
  }
  next();
});

// Support slug normalization on updates (PUT /blog/:id)
blogSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  if (update.title && !update.slug) update.slug = slugify(update.title);
  if (update.slug) update.slug = slugify(update.slug);
  // ensure publishedAt is handled on update
  if (Object.prototype.hasOwnProperty.call(update, "status")) {
    if (update.status === "published" && !update.publishedAt) update.publishedAt = new Date();
    if (update.status === "draft") update.publishedAt = undefined;
  }
  this.setUpdate(update);
  next();
});

// Text search index (title + excerpt + content)
blogSchema.index({ title: "text", excerpt: "text", content: "text" });

module.exports = mongoose.model("Blog", blogSchema);
