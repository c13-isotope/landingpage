import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
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

export default function AdminEditBlog() {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const idFromQS = sp.get("id") || "";
  const navigate = useNavigate();

  const [adminKey, setAdminKey] = useState("");
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", tags: "", status: "published",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [docId, setDocId] = useState("");

  useEffect(() => { setAdminKey(localStorage.getItem("adminKey") || ""); }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      if (slug && slug !== "<slug>") {
        try {
          const r = await fetch(`/api/blog/public/${slug}`);
          if (r.ok) {
            const d = await r.json();
            if (!alive) return;
            setDocId(idFromQS || d.id || d._id || "");
            setForm({
              title: d.title || "", slug: d.slug || "", excerpt: d.excerpt || "",
              content: d.content || "", tags: (d.tags || []).join(", "), status: d.status || "published",
            });
            return;
          }
        } catch {}
      }
      if (idFromQS) {
        try {
          const r = await fetch(`/api/blog/admin/${encodeURIComponent(idFromQS)}`, {
            headers: { "x-admin-key": localStorage.getItem("adminKey") || "" },
          });
          if (!r.ok) throw new Error(await r.text());
          const d = await r.json();
          if (!alive) return;
          setDocId(d.id || d._id || idFromQS);
          setForm({
            title: d.title || "", slug: d.slug || "", excerpt: d.excerpt || "",
            content: d.content || "", tags: (d.tags || []).join(", "), status: d.status || "draft",
          });
        } catch (e) {
          if (alive) setErr(e.message || "Failed to load post");
        }
      } else {
        setErr('Invalid URL. Use the "Edit" link from Admin list.');
      }
    })();
    return () => { alive = false; };
  }, [slug, idFromQS]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const previewHtml = useMemo(
    () => DOMPurify.sanitize(marked.parse(form.content || "")),
    [form.content]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const key = adminKey.trim();
    if (!key) return setErr("Admin key required");
    if (!docId) return setErr("Missing post id");

    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        status: form.status,
      };
      const res = await fetch(`/api/blog/${encodeURIComponent(docId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      localStorage.setItem("adminKey", key);
      navigate(`/blog/${data.slug}`);
    } catch (e) {
      setErr(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <p><Link to="/admin/blog">← Back to Admin</Link></p>
      <h1>Edit Blog Post</h1>
      {err ? <p style={{ color: "crimson" }}>Error: {err}</p> : null}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>Admin Key
          <input type="password" value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            style={{ width: "100%", padding: 8 }} placeholder="x-admin-key header" />
        </label>

        <label>Title
          <input name="title" value={form.title} onChange={onChange} required style={{ width: "100%", padding: 8 }} />
        </label>

        <label>Slug
          <input name="slug" value={form.slug} onChange={onChange} style={{ width: "100%", padding: 8 }} />
        </label>

        <label>Excerpt
          <input name="excerpt" value={form.excerpt} onChange={onChange} required style={{ width: "100%", padding: 8 }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>Content (Markdown)
            <textarea name="content" value={form.content} onChange={onChange}
              rows={16} style={{ width: "100%", padding: 8 }} required />
          </label>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Preview</div>
            <div style={{ border: "1px solid #eee", borderRadius: 6, padding: 12, height: "100%", overflow: "auto" }}
              dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>

        <label>Tags (comma separated)
          <input name="tags" value={form.tags} onChange={onChange} style={{ width: "100%", padding: 8 }} />
        </label>

        <label>Status
          <select name="status" value={form.status} onChange={onChange} style={{ padding: 8 }}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>

        <button type="submit" disabled={saving || !docId}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
