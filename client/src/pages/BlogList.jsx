// client/src/pages/BlogList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [sp, setSp] = useSearchParams();
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const q = (sp.get("q") || "").trim();

  // Use absolute API base in production (Vercel) if provided; else use relative path (works with dev proxy)
  const API_BASE = import.meta.env.VITE_API_BASE || "";

  // Build endpoint based on search or list
  const endpoint = useMemo(() => {
    const basePath = q ? "/api/blog/public/search" : "/api/blog/public/list";
    const params = new URLSearchParams({ page: String(page), limit: "5" });
    if (q) params.set("q", q);
    // Prepend API_BASE if set, otherwise keep relative
    return `${API_BASE}${basePath}?${params.toString()}`;
  }, [API_BASE, page, q]);

  // Set document title for SEO/UX
  useEffect(() => {
    const title = q ? `Search: "${q}" | Blog | NextGen CMC` : `Blog | NextGen CMC`;
    document.title = title;
  }, [q, page]);

  // Fetch list
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        setBlogs(Array.isArray(data.items) ? data.items : []);
        setTotalPages(Number(data.totalPages) || 1);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load blogs");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [endpoint]);

  const setPage = (p) =>
    setSp((prev) => {
      const s = new URLSearchParams(prev);
      s.set("page", String(p));
      if (q) s.set("q", q);
      return s;
    });

  const onSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const term = (form.get("q") || "").toString().trim();
    const s = new URLSearchParams();
    if (term) s.set("q", term);
    s.set("page", "1");
    setSp(s);
  };

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "50vh" }}>
        <div
          aria-label="Loading posts"
          role="status"
          style={{
            width: 36,
            height: 36,
            border: "3px solid #ddd",
            borderTopColor: "#333",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>
          {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ padding: 16, color: "crimson" }}>
        Error: {err}{" "}
        <button onClick={() => window.location.reload()} style={{ marginLeft: 8 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16, textAlign: "center" }}>Latest Blog Posts</h1>

      {/* Search */}
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search posts (title, excerpt, content)…"
          style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          aria-label="Search posts"
        />
        <button type="submit">Search</button>
        {q ? (
          <button
            type="button"
            onClick={() => setSp(new URLSearchParams({ page: "1" }))}
            aria-label="Clear search"
          >
            Clear
          </button>
        ) : null}
      </form>

      {blogs.length === 0 ? (
        <div>No posts{q ? ` for “${q}”` : ""}.</div>
      ) : (
        blogs.map((b) => {
          const href = `/blog/${encodeURIComponent(b.slug || "")}`;
          return (
            <article
              key={b._id || b.slug}
              style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 12 }}
            >
              <h2 style={{ margin: "0 0 6px 0" }}>
                <Link to={href}>{b.title}</Link>
              </h2>
              <p style={{ margin: "0 0 8px 0", color: "#666" }}>
                {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : "Draft"}
              </p>
              <p style={{ margin: 0 }}>{b.excerpt}</p>
            </article>
          );
        })
      )}

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginTop: 16,
          justifyContent: "center",
        }}
      >
        <button onClick={() => setPage(page - 1)} disabled={page <= 1}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
