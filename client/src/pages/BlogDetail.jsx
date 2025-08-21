// client/src/pages/BlogDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import SubscribeBlock from "../components/SubscribeBlock";
import CommentsBlock from "../components/CommentsBlock";

const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// Endpoints (we only rely on list/search so it works with your API today)
const URL_LIST   = (p) => `${API_BASE}/api/blog/public/list?${p.toString()}`;
const URL_SEARCH = (p) => `${API_BASE}/api/blog/public/search?${p.toString()}`;

// --- Robust "real HTML?" check ---
// 1) Quick allowlist of real HTML tags
const REAL_TAG = /<\/?([a-zA-Z][a-z0-9-]*)\b[^>]*>/g;
const HTML_TAG_ALLOWLIST = new Set([
  "p","h1","h2","h3","h4","h5","h6","ul","ol","li","blockquote","pre","code",
  "em","strong","a","img","br","hr","table","thead","tbody","tr","th","td",
  "figure","figcaption","span","div"
]);

function looksLikeRealHtml(s = "") {
  const t = String(s || "").trim();
  if (!t) return false;

  // Quick scan: does it include at least one allowed tag name?
  let m;
  while ((m = REAL_TAG.exec(t))) {
    const tag = (m[1] || "").toLowerCase();
    if (HTML_TAG_ALLOWLIST.has(tag)) return true;
  }

  // Fallback: try parsing once and see if any element nodes appear
  try {
    const doc = new DOMParser().parseFromString(t, "text/html");
    // If parsing created any element inside <body>, treat as HTML.
    return doc && doc.body && doc.body.children && doc.body.children.length > 0;
  } catch {
    return false;
  }
}

// --- Load a post by slug using search → list fallback ---
async function loadPost(slug, signal) {
  // 1) Try search first
  try {
    const p = new URLSearchParams({ page: "1", limit: "10", q: slug });
    const r = await fetch(URL_SEARCH(p), { signal });
    if (r.ok) {
      const d = await r.json();
      const items = d?.items || [];
      const found = items.find((x) => x.slug === slug);
      if (found) return found;
    }
  } catch {
    /* ignore network errors */
  }

  // 2) Fall back to list
  try {
    const p = new URLSearchParams({ page: "1", limit: "50" });
    const r = await fetch(URL_LIST(p), { signal });
    if (r.ok) {
      const d = await r.json();
      const items = d?.items || [];
      const found = items.find((x) => x.slug === slug);
      if (found) return found;
    }
  } catch {
    /* ignore network errors */
  }

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

  // Prefer markdown unless we’re sure it’s real HTML
  const candidate = (post.contentHtml ?? "").toString();
  const hasRealHtml = looksLikeRealHtml(candidate);

  // If not real HTML, take first non-empty markdown source
  const md = !hasRealHtml
    ? (post.content || post.contentMd || candidate || "")
    : "";

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
      {hasRealHtml ? (
        <div
          className="prose prose-neutral max-w-none mt-8"
          dangerouslySetInnerHTML={{ __html: candidate }}
        />
      ) : (
        <ReactMarkdown
          className="prose prose-neutral max-w-none mt-8"
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]} // allow inline HTML inside MD (e.g., <br>)
          components={{
            img: (props) => (
              <img {...props} className="rounded-lg" loading="lazy" decoding="async" />
            ),
            a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          }}
        >
          {md || "_No content available._"}
        </ReactMarkdown>
      )}

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
