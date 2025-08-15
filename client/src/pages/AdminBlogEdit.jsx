// client/src/pages/AdminEditBlog.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

/* ===== No .env changes required ===== */

const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// Only use endpoints you already have
const URL_LIST   = (params) => `${API_BASE}/api/blog/public/list?${params.toString()}`;
const URL_SEARCH = (params) => `${API_BASE}/api/blog/public/search?${params.toString()}`;
const URL_PUT    = (id)     => `${API_BASE}/api/blog/${id}`;

// Minimal “upload”: convert local file → Data URL (works offline / no config)
async function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);       // data:image/...;base64,....
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// --- Load a post for editing WITHOUT /by-slug ---
// 1) Try search (?q=slug) and select exact slug
// 2) Fallback to list (grab up to 50) and select exact slug
async function loadForEdit(slug, signal) {
  const wanted = decodeURIComponent(slug);

  // search first
  try {
    const p = new URLSearchParams({ page: "1", limit: "10", q: wanted });
    const r = await fetch(URL_SEARCH(p), { signal });
    if (r.ok) {
      const d = await r.json();
      const items = Array.isArray(d?.items) ? d.items : [];
      const exact = items.find((x) => x.slug === wanted);
      if (exact) return exact;
    }
  } catch {}

  // list fallback
  try {
    const p = new URLSearchParams({ page: "1", limit: "50" });
    const r = await fetch(URL_LIST(p), { signal });
    if (r.ok) {
      const d = await r.json();
      const items = Array.isArray(d?.items) ? d.items : [];
      const exact = items.find((x) => x.slug === wanted);
      if (exact) return exact;
    }
  } catch {}

  throw new Error("GET by slug failed: post not found");
}

export default function AdminEditBlog() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const adminKey = localStorage.getItem("adminKey") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");

  const [id, setId]                 = useState("");
  const [title, setTitle]           = useState("");
  const [subtitle, setSubtitle]     = useState("");
  const [iconEmoji, setIconEmoji]   = useState("🧭");
  const [coverImage, setCoverImage] = useState("");
  const [excerpt, setExcerpt]       = useState("");
  const [tags, setTags]             = useState("");
  const [rating, setRating]         = useState("");
  const [content, setContent]       = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const p = await loadForEdit(slug, controller.signal);

        setId(p._id || p.id || "");
        setTitle(p.title || "");
        setSubtitle(p.subtitle || "");
        setIconEmoji(p.iconEmoji || "🧭");
        setCoverImage(p.image || p.coverImage || "");
        setExcerpt(p.excerpt || "");
        setTags(Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || ""));
        setRating(typeof p.rating === "number" ? String(p.rating) : "");
        setContent(p.content || p.contentHtml || "");
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Failed loading post");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [slug]);

  const tagList = useMemo(
    () => tags.split(",").map((t) => t.trim()).filter(Boolean),
    [tags]
  );

  async function onUploadCover(e) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const url = await uploadFile(file); // Data URL; store directly in DB for now
      setCoverImage(url);
    } catch (e) {
      alert(e.message || "Upload failed");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  }

  async function onSave(e) {
    e.preventDefault();
    if (!adminKey) {
      alert("Admin key missing. Set it via /admin/blog (or localStorage) first.");
      return;
    }
    if (!id) {
      alert("Internal error: missing post id");
      return;
    }

    try {
      setSaving(true);
      setErr("");

      const body = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        iconEmoji: iconEmoji || "🧭",
        image: coverImage || undefined,
        coverImage: coverImage || undefined,
        excerpt: excerpt.trim(),
        tags: tagList,
        rating: rating ? Number(rating) : undefined,
        content, // plain text/HTML; your backend already accepts this
      };

      const res = await fetch(URL_PUT(id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Save failed: HTTP ${res.status}`);
      }

      // go back to the public post
      navigate(`/blog/${encodeURIComponent(slug)}`);
    } catch (e) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="w-9 h-9 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Post</h1>
        <Link to={`/blog/${encodeURIComponent(slug)}`} className="text-sm underline">
          View post
        </Link>
      </div>

      {err && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Cover editor */}
      <section className="mt-6 rounded-xl border border-neutral-200 overflow-hidden">
        {coverImage ? (
          <div className="relative">
            <img
              src={coverImage}
              alt="Cover"
              className="w-full max-h-[340px] object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <label className="text-xs bg-white/90 backdrop-blur px-3 py-1 rounded border cursor-pointer">
                Change cover
                <input type="file" accept="image/*" className="hidden" onChange={onUploadCover} />
              </label>
              <button
                type="button"
                className="text-xs bg-white/90 backdrop-blur px-3 py-1 rounded border"
                onClick={() => setCoverImage("")}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="h-40 grid place-items-center bg-neutral-50">
            <label className="text-sm bg-white px-3 py-2 rounded border cursor-pointer">
              Upload cover image
              <input type="file" accept="image/*" className="hidden" onChange={onUploadCover} />
            </label>
          </div>
        )}

        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <input
              value={iconEmoji}
              onChange={(e) => setIconEmoji(e.target.value)}
              className="w-16 text-3xl bg-transparent border rounded-md px-2 py-1 text-center"
              aria-label="Icon emoji"
              placeholder="🧭"
              maxLength={4}
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 text-xl md:text-2xl font-semibold border rounded-md px-3 py-2"
              placeholder="Post title"
            />
          </div>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="mt-3 w-full border rounded-md px-3 py-2"
            placeholder="Subtitle"
          />
        </div>
      </section>

      <form onSubmit={onSave} className="mt-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full h-20 border rounded-md px-3 py-2"
              placeholder="Short summary"
            />
          </div>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm mb-1">Tags (comma separated)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                placeholder="pharma, cmc, ols"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Rating (optional 1..5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                placeholder="4.5"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Content (Markdown/HTML)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-72 border rounded-md px-3 py-2 font-mono"
            placeholder="Write your post content here…"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-black text-white px-4 py-2 hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <Link to="/blog" className="text-sm underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
