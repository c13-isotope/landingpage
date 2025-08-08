// client/src/pages/BlogDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";

// ---------- marked + highlight config ----------
const renderer = new marked.Renderer();

// Ensure all links open safely in a new tab
renderer.link = (href, title, text) => {
  const t = title ? ` title="${title}"` : "";
  const safeHref = href ?? "#";
  return `<a href="${safeHref}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
};

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

export default function BlogDetail() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Build a safe API base (strip trailing slash)
  const API_BASE = (
    import.meta.env.VITE_API_BASE || window.location.origin
  ).replace(/\/+$/, "");

  // ---------- Fetch post ----------
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        setErr("");
        window.scrollTo(0, 0);

        const res = await fetch(`${API_BASE}/api/blog/public/${slug}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Request failed with ${res.status}`);
        }
        const data = await res.json();
        setPost(data || null);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(e.message || "Failed to load post");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [API_BASE, slug]);

  // ---------- SEO: title & meta description ----------
  useEffect(() => {
    const title = post?.title ? `${post.title} | NextGen CMC` : "Loading… | NextGen CMC";
    document.title = title;

    const desc =
      post?.excerpt ||
      (post?.content ? String(post.content).slice(0, 150) : "") ||
      "Blog post on NextGen CMC.";

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, [post]);

  // ---------- Render markdown safely ----------
  const html = useMemo(() => {
    const raw = marked.parse(post?.content || "");
    return DOMPurify.sanitize(raw);
  }, [post]);

  // ---------- UI states ----------
  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "50vh" }}>
        <div
          aria-label="Loading post"
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

  if (err) return <div style={{ padding: 16, color: "crimson" }}>Error: {err}</div>;
  if (!post) return <div style={{ padding: 16 }}>Not found.</div>;

  // ---------- Page ----------
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <p className="mb-4">
        <Link to="/blog">← Back to Blog</Link>
      </p>

      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>

      <p className="text-gray-600 mb-2">
        {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : "Draft"}
      </p>

      {post.tags?.length ? (
        <p className="mb-4">
          <strong>Tags:</strong> {post.tags.join(", ")}
        </p>
      ) : null}

      {post.coverImage ? (
        <img
          src={post.coverImage}
          alt={post.title}
          className="mb-4"
          style={{ maxHeight: 420, width: "100%", objectFit: "cover", borderRadius: 8 }}
        />
      ) : null}

      <hr className="my-4" />

      <article
        style={{ lineHeight: 1.75 }}
        className="prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
