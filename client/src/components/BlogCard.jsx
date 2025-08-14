import { Link } from "react-router-dom";

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "";
  }
}

function makeExcerpt(post, max = 160) {
  if (post.excerpt) return post.excerpt;
  const txt =
    (post.contentHtml || post.content || "")
      .replace(/<[^>]+>/g, " ")   // strip HTML
      .replace(/[#*_>`]/g, " ")   // strip md-ish
      .replace(/\s+/g, " ")
      .trim();
  return txt.length > max ? txt.slice(0, max) + "…" : txt;
}

export default function BlogCard({ post }) {
  return (
    <article className="group rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-all bg-white">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <time>{formatDate(post.publishedAt || post.createdAt)}</time>
        {post.tags?.length ? <span>• {post.tags[0]}</span> : null}
      </div>

      <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:underline">
        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>

      <p className="mt-2 text-sm text-neutral-600 line-clamp-3">
        {makeExcerpt(post)}
      </p>

      <div className="mt-4">
        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-neutral-900 hover:underline"
        >
          Read →
        </Link>
      </div>
    </article>
  );
}
