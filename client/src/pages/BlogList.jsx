import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import BlogHero from "../components/BlogHero";
import PostCard from "../components/PostCard";

/* helpers */
const norm  = (s="") => decodeURIComponent(String(s).trim().toLowerCase());
const kebab = (s="") => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const safeSlug = (p) =>
  (p?.slug && String(p.slug).trim()) ||
  (p?.urlSlug && String(p.urlSlug).trim()) ||
  (p?.seoSlug && String(p.seoSlug).trim()) ||
  kebab(p?.title || "");

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [adminKey, setAdminKey] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

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

  const navigate = useNavigate();

  useEffect(() => {
    const key = localStorage.getItem("adminKey") || "";
    setAdminKey(key);
    setIsAdmin(Boolean(key));
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
      alert("Admin key missing. Open /admin/blog to set it first.");
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

  const makeExcerpt = (b) => {
    if (b.excerpt) return b.excerpt;
    const raw = (b.contentHtml || b.content || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/[#*_>`]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return raw.length > 160 ? raw.slice(0, 160) + "…" : raw || " ";
  };

  if (loading) {
    return (
      <div className="grid place-items-center h-[50vh]">
        <div aria-label="Loading posts" role="status" className="w-9 h-9 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Error: {err}
          <button className="ml-3 inline-flex items-center rounded-md border border-red-300 px-2 py-1 text-red-700 hover:bg-red-100" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <BlogHero
        title="Blog – OLS"
        subtitle="Practical, minimalist guidance for Own Label Supply."
        imageUrl={import.meta.env.VITE_BLOG_BANNER || undefined}
      />

      <h1 className="sr-only">Latest Blog Posts</h1>

      <form onSubmit={onSubmit} className="mt-2 flex flex-col sm:flex-row gap-3 items-stretch">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search posts (title, excerpt, content)…"
          aria-label="Search posts"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300"
        />
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-50">
            Search
          </button>
          {q && (
            <button
              type="button"
              onClick={() => setSp(new URLSearchParams({ page: "1" }))}
              aria-label="Clear search"
              disabled={loading}
              className="rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-50"
            >
              Clear
            </button>
          )}
          {isAdmin && (
            <Link to="/admin/blog/new" className="rounded-lg bg-black text-white px-3 py-2 hover:bg-neutral-800">
              + New Post
            </Link>
          )}
        </div>
      </form>

      {isAdmin && (
        <div className="mt-4">
          <input
            type="password"
            placeholder="x-admin-key (for delete)"
            value={adminKey}
            onChange={(e) => {
              setAdminKey(e.target.value);
              localStorage.setItem("adminKey", e.target.value);
              setIsAdmin(Boolean(e.target.value));
            }}
            className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-300"
          />
          <p className="mt-1 text-xs text-neutral-500">Admin mode is active on this browser. Keep your key private.</p>
        </div>
      )}

      {blogs.length === 0 ? (
        <div className="mt-10 text-center text-neutral-500">No posts{q ? ` for “${q}”` : ""}.</div>
      ) : (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((b) => {
            const id = b._id || b.id;
            const slug = safeSlug(b); // ✅ do NOT encode; keep it readable and matchable
            const postForCard = {
              slug,
              title: b.title,
              excerpt: makeExcerpt(b),
              image: b.image || b.coverImage,
              rating: typeof b.rating === "number" ? b.rating : undefined,
              category: (Array.isArray(b.tags) && b.tags[0]) || undefined,
              publishedAt: b.publishedAt,
              iconEmoji: b.iconEmoji,
            };
            return (
              <PostCard
                key={id || slug}
                post={postForCard}
                isAdmin={isAdmin}
                onRead={(s) => navigate(`/blog/${s}`)}
                onEdit={(s) => navigate(`/admin/blog/${s}/edit`)}
                onDelete={() => handleDelete(id)}
              />
            );
          })}
        </section>
      )}

      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <button onClick={() => setPage(page - 1)} disabled={page <= 1 || loading} className="rounded-md border border-neutral-300 px-3 py-1.5 disabled:opacity-40 hover:bg-neutral-50">
          Previous
        </button>
        <span className="text-neutral-600">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages || loading} className="rounded-md border border-neutral-300 px-3 py-1.5 disabled:opacity-40 hover:bg-neutral-50">
          Next
        </button>
      </div>
    </main>
  );
}
