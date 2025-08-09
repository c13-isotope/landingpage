// client/src/pages/BlogList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const [sp, setSp] = useSearchParams();
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const q = (sp.get("q") || "").trim();

  const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
  const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

  const endpoint = useMemo(() => {
    const basePath = q ? "/api/blog/public/search" : "/api/blog/public/list";
    const params = new URLSearchParams({ page: String(page), limit: "5" });
    if (q) params.set("q", q);
    return `${API_BASE}${basePath}?${params.toString()}`;
  }, [API_BASE, page, q]);

  useEffect(() => {
    setAdminKey(localStorage.getItem("adminKey") || "");
  }, []);

  useEffect(() => {
    document.title = q ? `Search: "${q}" | Blog | NextGen CMC` : `Blog | NextGen CMC`;
  }, [q, page]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(endpoint, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setBlogs(Array.isArray(data.items) ? data.items : []);
        setTotalPages(Number(data.totalPages) || 1);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Failed to load blogs");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
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

  const handleDelete = async (id) => {
    if (!adminKey) {
      alert("Please enter your Admin Key to delete posts.");
      return;
    }
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/blog/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error(await res.text());
      setBlogs((prev) => prev.filter((b) => b._id !== id && b.id !== id));
    } catch (e) {
      alert(e.message || "Failed to delete post");
    }
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

      {/* Search & New Post */}
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search posts (title, excerpt, content)…"
          style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          aria-label="Search posts"
        />
        <button type="submit" disabled={loading}>Search</button>
        {q && (
          <button
            type="button"
            onClick={() => setSp(new URLSearchParams({ page: "1" }))}
            aria-label="Clear search"
            disabled={loading}
          >
            Clear
          </button>
        )}
        <Link
          to="/admin/blog/new"
          style={{
            padding: "6px 12px",
            background: "#4CAF50",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          + New Post
        </Link>
      </form>

      {/* Admin Key */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="password"
          placeholder="x-admin-key (for delete)"
          value={adminKey}
          onChange={(e) => {
            setAdminKey(e.target.value);
            localStorage.setItem("adminKey", e.target.value);
          }}
          style={{ padding: 8, width: "100%", maxWidth: 300 }}
        />
      </div>

      {blogs.length === 0 ? (
        <div>No posts{q ? ` for “${q}”` : ""}.</div>
      ) : (
        blogs.map((b) => {
          const href = `/blog/${encodeURIComponent(b.slug || "")}`;
          const id = b._id || b.id;
          return (
            <article
              key={id}
              style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 12 }}
            >
              <h2 style={{ margin: "0 0 6px 0" }}>
                <Link to={href}>{b.title}</Link>
              </h2>
              <p style={{ margin: "0 0 8px 0", color: "#666" }}>
                {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : "Draft"}
              </p>
              <p style={{ margin: 0 }}>{b.excerpt}</p>
              <button
                onClick={() => handleDelete(id)}
                style={{
                  marginTop: 8,
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
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
        <button onClick={() => setPage(page - 1)} disabled={page <= 1 || loading}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages || loading}>
          Next
        </button>
      </div>
    </div>
  );
}
