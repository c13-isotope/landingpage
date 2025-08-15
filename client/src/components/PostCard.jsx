// client/src/components/PostCard.jsx

/* Minimalist, responsive blog card with admin action slot */
export default function PostCard({ post, onRead, isAdmin = false, onEdit, onDelete }) {
    const {
      slug,
      title,
      excerpt,
      image,
      rating,     // optional 1..5
      category,
      publishedAt,
      iconEmoji,
    } = post || {};
  
    const img = image || (import.meta.env.VITE_FALLBACK_CARD_IMG || "https://picsum.photos/800/480?grayscale&blur=1");
  
    const share = () => {
      const url = `${window.location.origin}/blog/${slug}`;
      const text = `${title} – via OLS Guide`;
      if (navigator.share) {
        navigator.share({ title, text, url }).catch(() => {});
      } else {
        const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(linkedIn, "_blank", "noopener,noreferrer");
      }
    };
  
    return (
      <article className="group relative rounded-2xl border border-zinc-200 hover:border-zinc-300 bg-white shadow-sm hover:shadow transition">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          <img
            src={img}
            alt={title || "cover image"}
            className="h-full w-full object-cover group-hover:scale-[1.02] transition"
            loading="lazy"
            crossOrigin="anonymous"
          />
        </div>
  
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {publishedAt && <span>{new Date(publishedAt).toLocaleDateString()}</span>}
            {category && <span>• {category}</span>}
          </div>
  
          <h3 className="mt-2 text-lg font-semibold leading-snug line-clamp-2">
            {iconEmoji ? <span className="mr-1">{iconEmoji}</span> : null}
            {title}
          </h3>
  
          {excerpt && (
            <p className="mt-2 text-sm text-zinc-600 line-clamp-3">
              {excerpt}
            </p>
          )}
  
          {/* Rating (optional) */}
          {typeof rating === "number" && (
            <div className="mt-3 flex items-center gap-1 text-amber-500" aria-label={`Rated ${rating} out of 5`}>
              {"★★★★★".slice(0, Math.round(Math.max(0, Math.min(5, rating))))}
              <span className="ml-1 text-xs text-zinc-500">{rating.toFixed(1)}</span>
            </div>
          )}
  
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => onRead?.(slug)}
              className="inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition"
            >
              Read <span aria-hidden>→</span>
            </button>
  
            <div className="flex items-center gap-3 text-zinc-500">
              <button onClick={share} title="Share" className="hover:text-black transition">
                <span>🔗</span>
              </button>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/blog/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition"
                title="Share on LinkedIn"
              >
                in
              </a>
            </div>
          </div>
  
          {/* Admin actions */}
          {isAdmin && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                className="text-xs rounded-md border border-neutral-300 px-2 py-1 hover:bg-neutral-50"
                onClick={() => onEdit?.(slug)}
                title="Edit"
              >
                Edit
              </button>
              <button
                className="text-xs rounded-md border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50"
                onClick={() => onDelete?.()}
                title="Delete"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }
  