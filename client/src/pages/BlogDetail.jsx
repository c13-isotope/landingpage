// client/src/pages/BlogDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import SubscribeBlock from "../components/SubscribeBlock";
import CommentsBlock from "../components/CommentsBlock";

/* ---------------- robust normalization ---------------- */
function toNFC(s = "") {
  try { return s.normalize("NFC"); } catch { return s; }
}
function safeDecode(s = "") {
  try { return decodeURIComponent(s); } catch { return s; }
}
function normalizeSlug(s = "") {
  // 1) NFC + decode
  let t = toNFC(String(s ?? ""));
  t = safeDecode(t);

  // 2) lowercase + trim
  t = t.trim().toLowerCase();

  // 3) convert ALL unicode dash variants to hyphen-minus
  //    (‐ \u2010, - \u2011, ‒ \u2012, – \u2013, — \u2014, ― \u2015, ⁻ \u207B, ˗ \u02D7, minus sign \u2212, figure dash \u2012)
  t = t.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u207B\u02D7\u2212]+/g, "-");

  // 4) collapse any non a-z0-9 to hyphen
  t = t.replace(/[^a-z0-9]+/g, "-");

  // 5) strip leading/trailing hyphens
  t = t.replace(/^-+|-+$/g, "");

  return t;
}
const kebab = (s="") => normalizeSlug(String(s || ""));

/* --------- HTML detection (unchanged) --------- */
const REAL_TAG=/<\/?([a-zA-Z][a-z0-9-]*)\b[^>]*>/g;
const ALLOW=new Set(["p","h1","h2","h3","h4","h5","h6","ul","ol","li","blockquote","pre","code","em","strong","a","img","br","hr","table","thead","tbody","tr","th","td","figure","figcaption","span","div"]);
function looksLikeRealHtml(s=""){const t=String(s||"").trim(); if(!t) return false; let m; while((m=REAL_TAG.exec(t))){if(ALLOW.has((m[1]||"").toLowerCase())) return true;} try{const d=new DOMParser().parseFromString(t,"text/html");return d?.body?.children?.length>0;}catch{return false;}}

/* --------- endpoints (relative → Vite proxy) --------- */
const listUrl   = ()  => `/api/blog/public/list?${new URLSearchParams({page:"1",limit:"50"})}`;
const searchUrl = (q) => `/api/blog/public/search?${new URLSearchParams({page:"1",limit:"20",q})}`;

/* --------- matching helpers --------- */
const allKeysFor = (p) => {
  const keys = [
    normalizeSlug(p.slug),
    normalizeSlug(p.urlSlug),
    normalizeSlug(p.seoSlug),
    kebab(p.title),
  ].filter(Boolean);
  return Array.from(new Set(keys));
};

function strongMatch(items, rawSlug){
  const target = normalizeSlug(rawSlug);

  // 1) exact on any normalized key
  let hit = items.find(p => allKeysFor(p).some(k => k === target));
  if (hit) return hit;

  // 2) startsWith / target startsWith key
  hit = items.find(p => allKeysFor(p).some(k => k.startsWith(target) || target.startsWith(k)));
  if (hit) return hit;

  // 3) includes / target includes key
  hit = items.find(p => allKeysFor(p).some(k => k.includes(target) || target.includes(k)));
  if (hit) return hit;

  return null;
}

/* ---------- data fetch ---------- */
async function fetchItems(url, signal){
  try {
    const r = await fetch(url, { signal });
    if (!r.ok) return { items: [] };
    const d = await r.json();
    return { items: Array.isArray(d?.items) ? d.items : [] };
  } catch {
    return { items: [] };
  }
}

async function loadPostAggressive(slug, signal, setDebug){
  const raw = String(slug || "");
  const queryFromSlug = safeDecode(raw).replace(/[-_]+/g, " ").trim();
  const corePrefix    = raw.slice(0, 30);

  // A) list first
  {
    const { items } = await fetchItems(listUrl(), signal);
    setDebug?.(items);
    const hit = strongMatch(items, raw);
    if (hit) return hit;
  }
  // B) search raw
  {
    const { items } = await fetchItems(searchUrl(raw), signal);
    setDebug?.(items);
    const hit = strongMatch(items, raw);
    if (hit) return hit;
  }
  // C) search with spaces
  if (queryFromSlug && queryFromSlug !== raw) {
    const { items } = await fetchItems(searchUrl(queryFromSlug), signal);
    setDebug?.(items);
    const hit = strongMatch(items, queryFromSlug);
    if (hit) return hit;
  }
  // D) search core prefix
  {
    const { items } = await fetchItems(searchUrl(corePrefix), signal);
    setDebug?.(items);
    const hit = strongMatch(items, corePrefix);
    if (hit) return hit;
  }

  throw new Error("Post not found");
}

/* ---------- component ---------- */
export default function BlogDetail(){
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [debugItems, setDebugItems] = useState(null);

  useEffect(()=>{
    const c = new AbortController();
    (async ()=>{
      try{
        setLoading(true); setErr("");
        const p = await loadPostAggressive(slug, c.signal, setDebugItems);
        setPost(p);
        document.title = p?.title ? `${p.title} | Blog | NextGen CMC` : "Blog | NextGen CMC";
      }catch(e){
        if (e.name !== "AbortError") setErr(e.message || "Failed to load");
      }finally{
        if (!c.signal.aborted) setLoading(false);
      }
    })();
    return ()=>c.abort();
  },[slug]);

  if (loading) {
    return (
      <div className="grid place-items-center h-[40vh]">
        <div className="w-9 h-9 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  if (err || !post) {
    const suggestions = Array.isArray(debugItems) ? debugItems.slice(0,8) : [];
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err || "Not found"}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-6 rounded-md border border-neutral-200 bg-white p-4">
            <p className="text-sm text-neutral-700">Try one of these slugs the API returned:</p>
            <ul className="mt-2 list-disc pl-6">
              {suggestions.map((p,i)=>{
                const s = allKeysFor(p)[0] || kebab(p.title) || String(p._id || p.id || i);
                return (
                  <li key={i}>
                    <Link className="underline" to={`/blog/${s}`}>{s}</Link>{" "}
                    <span className="text-neutral-500">– {p.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <Link to="/blog" className="underline">Back to blog</Link>
        </div>
      </div>
    );
  }

  const icon   = post.iconEmoji || "🧭";
  const cover  = post.image || post.coverImage || "";
  const tags   = Array.isArray(post.tags) ? post.tags : [];
  const rating = typeof post.rating === "number" ? post.rating : null;

  const candidate = String(post.contentHtml ?? "");
  const hasHtml   = looksLikeRealHtml(candidate);
  const md        = !hasHtml ? (post.content || post.contentMd || candidate || "") : "";
  const faq       = Array.isArray(post.faq) ? post.faq : [];

  return (
    <article className="max-w-3xl mx-auto">
      <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white">
        {cover && <img src={cover} alt={post.title} className="w-full max-h-[380px] object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 text-4xl">{icon}</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">{post.title}</h1>
          {post.subtitle && <p className="mt-2 text-neutral-600">{post.subtitle}</p>}
          <div className="mt-3 flex items-center flex-wrap gap-3 text-sm text-neutral-500">
            {post.publishedAt && <time>{new Date(post.publishedAt).toLocaleDateString()}</time>}
            {!!tags.length && <span>• {tags.join(", ")}</span>}
            {rating != null && (
              <span aria-label={`Rated ${rating} out of 5`}>
                • {"★★★★★".slice(0, Math.round(rating))} <span className="ml-1">{rating.toFixed?.(1)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {hasHtml ? (
        <div className="prose prose-neutral max-w-none mt-8" dangerouslySetInnerHTML={{ __html: candidate }} />
      ) : (
        <ReactMarkdown
          className="prose prose-neutral max-w-none mt-8"
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            img: (props) => <img {...props} className="rounded-lg" loading="lazy" decoding="async" />,
            a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          }}
        >
          {md || "_No content available._"}
        </ReactMarkdown>
      )}

      {faq.length>0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Questions & Answers</h2>
          <div className="mt-4 divide-y rounded-xl border border-neutral-200">
            {faq.map((f,i)=>(
              <details key={i} className="p-4 group">
                <summary className="cursor-pointer font-medium list-none">{f.q || f.question || `Question ${i+1}`}</summary>
                <div className="mt-2 text-neutral-700">
                  {(f.a || f.answer || "").split(/\n{2,}/).map((p,idx)=><p key={idx} className="mt-2 first:mt-0">{p}</p>)}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12"><SubscribeBlock/></section>
      <section className="mt-8">
        <CommentsBlock
          slug={normalizeSlug(post.slug || post.urlSlug || post.seoSlug || kebab(post.title))}
          postId={post._id || post.id}
        />
      </section>

      <div className="mt-10"><Link to="/blog" className="underline">← Back to blog</Link></div>
    </article>
  );
}
