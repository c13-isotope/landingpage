import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// This uses your existing search endpoint to emulate categories.
// e.g. /category/ectd will search for "ectd"
export default function Category() {
  const { slug } = useParams();           // variations, ectd, updates, best-practices, case-studies
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ page: "1", limit: "12", q: slug });
    return `${API_BASE}/api/blog/public/search?${params.toString()}`;
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(endpoint, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
        document.title = `Category: ${slug} | NextGen CMC`;
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Failed to load");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [endpoint]);

  if (loading) {
    return (
      <div className="grid place-items-center h-[50vh]">
        <div className="w-9 h-9 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Error: {err}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight capitalize">
        {slug.replace(/-/g, " ")}
      </h1>
      <p className="mt-2 text-neutral-600">Articles related to this topic.</p>

      {items.length === 0 ? (
        <div className="mt-8 text-neutral-500">No posts found.</div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => {
            const href = `/blog/${encodeURIComponent(b.slug || "")}`;
            const id = b._id || b.id;
            const date = b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : "Draft";
            return (
              <article key={id} className="rounded-xl border border-neutral-200 p-5 bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <time>{date}</time>
                  {Array.isArray(b.tags) && b.tags.length > 0 ? <span>• {b.tags[0]}</span> : null}
                </div>
                <h3 className="mt-2 text-lg font-semibold leading-snug">
                  <Link to={href} className="hover:underline">{b.title}</Link>
                </h3>
                <p className="mt-2 text-sm text-neutral-600">
                  {b.excerpt || (b.content || "").replace(/<[^>]+>/g, " ").slice(0, 140) + "…"}
                </p>
                <div className="mt-4">
                  <Link to={href} className="text-sm font-medium hover:underline">Read →</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
