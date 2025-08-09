import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";

marked.setOptions({
  breaks: true,
  gfm: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

export default function AdminNewBlog() {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    tags: "",
    status: "published",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setAdminKey(localStorage.getItem("adminKey") || "");
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    validateField(name, value);
  };

  const previewHtml = useMemo(
    () => DOMPurify.sanitize(marked.parse(form.content || "")),
    [form.content]
  );

  const validateField = (name, value) => {
    let message = "";
    if (name === "adminKey" && !value.trim()) {
      message = "Admin key is required.";
    }
    if (name === "title" && value.trim().length < 3) {
      message = "Title must be at least 3 characters.";
    }
    if (name === "slug" && value && value.trim().length < 3) {
      message = "Slug must be at least 3 characters (or leave it blank).";
    }
    if (name === "excerpt" && value.trim().length < 10) {
      message = "Excerpt must be at least 10 characters.";
    }
    if (name === "content" && value.trim().length < 10) {
      message = "Content must be at least 10 characters.";
    }
    if (name === "tags" && value.trim() && value.split(",").length > 5) {
      message = "Maximum 5 tags allowed.";
    }
    setFieldErrors((prev) => ({ ...prev, [name]: message }));
  };

  const validateAll = () => {
    let errors = {};
    validateField("adminKey", adminKey);
    validateField("title", form.title);
    validateField("slug", form.slug);
    validateField("excerpt", form.excerpt);
    validateField("content", form.content);
    validateField("tags", form.tags);
    setFieldErrors(errors);
    return Object.values(errors).every((m) => !m);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!validateAll()) return;

    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: form.status,
      };
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      localStorage.setItem("adminKey", adminKey);
      navigate(`/blog/${data.slug}`);
    } catch (e) {
      setErr(e.message || "Failed to create blog");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <p><Link to="/blog">← Back to Blog</Link></p>
      <h1 style={{ marginBottom: 12 }}>New Blog Post (Admin)</h1>
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        {/* Admin Key */}
        <label>
          Admin Key
          <input
            type="password"
            value={adminKey}
            onChange={(e) => {
              setAdminKey(e.target.value);
              validateField("adminKey", e.target.value);
            }}
            style={{ width: "100%", padding: 8 }}
            placeholder="x-admin-key header"
          />
          {fieldErrors.adminKey && <div style={{ color: "red" }}>{fieldErrors.adminKey}</div>}
        </label>

        {/* Title */}
        <label>
          Title
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            style={{ width: "100%", padding: 8 }}
          />
          {fieldErrors.title && <div style={{ color: "red" }}>{fieldErrors.title}</div>}
        </label>

        {/* Slug */}
        <label>
          Slug (optional — auto from title if left blank)
          <input
            name="slug"
            value={form.slug}
            onChange={onChange}
            style={{ width: "100%", padding: 8 }}
          />
          {fieldErrors.slug && <div style={{ color: "red" }}>{fieldErrors.slug}</div>}
        </label>

        {/* Excerpt */}
        <label>
          Excerpt
          <input
            name="excerpt"
            value={form.excerpt}
            onChange={onChange}
            style={{ width: "100%", padding: 8 }}
          />
          {fieldErrors.excerpt && <div style={{ color: "red" }}>{fieldErrors.excerpt}</div>}
        </label>

        {/* Content + Preview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            Content (Markdown)
            <textarea
              name="content"
              value={form.content}
              onChange={onChange}
              rows={16}
              style={{ width: "100%", padding: 8 }}
            />
            {fieldErrors.content && <div style={{ color: "red" }}>{fieldErrors.content}</div>}
          </label>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Preview</div>
            <div
              style={{ border: "1px solid #eee", borderRadius: 6, padding: 12, height: "100%", overflow: "auto" }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>

        {/* Tags */}
        <label>
          Tags (comma separated)
          <input
            name="tags"
            value={form.tags}
            onChange={onChange}
            style={{ width: "100%", padding: 8 }}
          />
          {fieldErrors.tags && <div style={{ color: "red" }}>{fieldErrors.tags}</div>}
        </label>

        {/* Status */}
        <label>
          Status
          <select
            name="status"
            value={form.status}
            onChange={onChange}
            style={{ padding: 8 }}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create Post"}
        </button>
      </form>
    </div>
  );
}
