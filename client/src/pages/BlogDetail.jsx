// client/src/pages/BlogDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";

// configure marked + highlight.js
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

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE || "";


  // Fetch post
  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);
    setLoading(true);
    setErr("");
    fetch(`${API_BASE}/api/blog/public/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => alive && setPost(data || null))
      .catch((e) => alive && setErr(e.message || "Failed to load post"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  // Set document title based on post
  useEffect(() => {
    document.title = post?.title ? `${post.title} | NextGen CMC` : "Loading… | NextGen CMC";
  }, [post]);

  const html = useMemo(() => {
    const raw = marked.parse(post?.content || "");
    return DOMPurify.sanitize(raw);
  }, [post]);

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
      <hr className="my-4" />
      <article
        style={{ lineHeight: 1.75 }}
        className="prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
