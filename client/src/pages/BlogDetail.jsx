// client/src/pages/BlogDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";

// ---------- marked + highlight config ----------
const renderer = new marked.Renderer();

// Ensure links open safely in a new tab
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
    (async () => {
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
        if (e.name !== "AbortError") setErr(e.message || "Failed to load post");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [API_BASE, slug]);

  // ---------- SEO: title & meta description ----------
  useEffect(() => {
    const title = post?.title ? `${post.title} | NextGen CMC` : "Loading… | NextGen CMC";
    document.title = title;

    const desc =
      post?.excerpt ||
      (post?.content ? String(post.content).replace(/<[^>]+>/g, "").slice(0, 150) : "") ||
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
      <div className="grid place-items-center h-[50vh]">
        <div
          aria-label="Loading post"
          role="status"
          className="w-9 h-9 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin"
        />
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Error: {err}
        </div>
        <Link to="/blog" className="mt-4 inline-block underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p>Not found.</p>
        <Link to="/blog" className="mt-4 inline-block underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  const published = post.publishedAt
    ? new Date(post.publishedAt).toLocaleString()
    : "Draft";

  // ---------- Page ----------
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/blog" className="text-sm text-neutral-600 hover:underline">
        ← Back to Blog
      </Link>

      <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">
        {post.title}
      </h1>

      <div className="mt-2 text-sm text-neutral-500">
        {published}
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <> • <span className="uppercase tracking-wide">{post.tags.join(", ")}</span></>
        )}
      </div>

      {post.coverImage ? (
        <img
          src={post.coverImage}
          alt={post.title}
          className="mt-6 w-full max-h-[420px] object-cover rounded-lg"
        />
      ) : null}

      <hr className="my-6 border-neutral-200" />

      {/* Typography plugin makes the content look great */}
      <article
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
