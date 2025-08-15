// client/src/pages/BlogDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SubscribeBlock from "../components/SubscribeBlock";
import CommentsBlock from "../components/CommentsBlock";

const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// helpers that ONLY use list & search (no by-slug)
const URL_LIST   = (p) => `${API_BASE}/api/blog/public/list?${p.toString()}`;
const URL_SEARCH = (p) => `${API_BASE}/api/blog/public/search?${p.toString()}`;

async function loadPost(slug, signal) {
  // 1) Try search first (usually fastest)
  try {
    const p = new URLSearchParams({ page: "1", limit: "10", q: slug });
    const r = await fetch(URL_SEARCH(p), { signal });
    if (r.ok) {
      const d = await r.json();
      const items = d?.items || [];
      const found = items.find((x) => x.slug === slug);
      if (found) return found;
    }
  } catch {}

  // 2) Fall back to list (wider grab)
  try {
    const p = new URLSearchParams({ page: "1", limit: "50" });
    const r = await fetch(URL_LIST(p), { signal });
    if (r.ok) {
      const d = await r.json();
      const items = d?.items || [];
      const found = items.find((x) => x.slug === slug);
      if (found) return found;
    }
  } catch {}

  throw new Error("Post not found");
}

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const p = await loadPost(slug, c.signal);
        setPost(p);
        document.title = p?.title ? `${p.title} | Blog | NextGen CMC` : "Blog | NextGen CMC";
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Failed to load");
      } finally {
        if (!c.signal.aborted) setLoading(false);
      }
    })();
    return () => c.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="grid place-items-center h-[50vh]">
        <div className="w-9 h-9 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  if (err || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err || "Not found"}
        </div>
        <div className="mt-4">
          <Link to="/blog" className="underline">Back to blog</Link>
        </div>
      </div>
    );
  }

  const icon   = post.iconEmoji || "🧭";
  const cover  = post.image || post.coverImage || "";
  const tags   = Array.isArray(post.tags) ? post.tags : [];
  const rating = typeof post.rating === "number" ? post.rating : null;

  const contentHtml =
    post.contentHtml ||
    (post.content ? `<div style="white-space:pre-wrap">${post.content}</div>` : "");

  const faq = Array.isArray(post.faq) ? post.faq : [];

  return (
    <article className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white">
        {cover && (
          <img
            src={cover}
            alt={post.title}
            className="w-full max-h-[380px] object-cover"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 text-4xl">{icon}</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">{post.title}</h1>
          {post.subtitle && <p className="mt-2 text-neutral-600">{post.subtitle}</p>}
          <div className="mt-3 flex items-center flex-wrap gap-3 text-sm text-neutral-500">
            {post.publishedAt && <time>{new Date(post.publishedAt).toLocaleDateString()}</time>}
            {!!tags.length && <span>• {tags.join(", ")}</span>}
            {rating != null && (
              <span aria-label={`Rated ${rating} out of 5`}>
                • {"★★★★★".slice(0, Math.round(rating))}{" "}
                <span className="ml-1">{rating.toFixed?.(1)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        className="prose prose-neutral max-w-none mt-8"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Questions & Answers</h2>
          <div className="mt-4 divide-y rounded-xl border border-neutral-200">
            {faq.map((item, idx) => (
              <details key={idx} className="p-4 group">
                <summary className="cursor-pointer font-medium list-none">
                  {item.q || item.question || `Question ${idx + 1}`}
                </summary>
                <div className="mt-2 text-neutral-700">
                  {(item.a || item.answer || "").split(/\n{2,}/).map((p, i) => (
                    <p key={i} className="mt-2 first:mt-0">{p}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Footer blocks */}
      <section className="mt-12">
        <SubscribeBlock />
      </section>
      <section className="mt-8">
        <CommentsBlock slug={post.slug} postId={post._id || post.id} />
      </section>

      <div className="mt-10">
        <Link to="/blog" className="underline">← Back to blog</Link>
      </div>
    </article>
  );
}
