// client/src/components/CommentsBlock.jsx
import { useEffect, useState } from "react";

const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export default function CommentsBlock({ slug, postId }) {
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [posting, setPosting] = useState(false);
  const [ok, setOk] = useState("");

  // try to fetch comments; if your backend doesn't have it yet, we just show none
  useEffect(() => {
    const c = new AbortController();
    (async () => {
      try {
        setErr("");
        const res = await fetch(`${API_BASE}/api/blog/public/comments?slug=${encodeURIComponent(slug)}`, { signal: c.signal });
        if (!res.ok) { setList([]); return; } // silently ignore if not implemented
        const data = await res.json();
        setList(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        if (e.name !== "AbortError") setErr("");
      }
    })();
    return () => c.abort();
  }, [slug]);

  async function onSubmit(e) {
    e.preventDefault();
    setOk(""); setErr("");
    try {
      setPosting(true);
      const res = await fetch(`${API_BASE}/api/blog/comments/${encodeURIComponent(postId || slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: msg }),
      });
      if (!res.ok) throw new Error("Endpoint not configured; simulating local save.");
      const saved = await res.json();
      setList((prev) => [saved.item || saved, ...prev]);
      setName(""); setEmail(""); setMsg("");
      setOk("Comment posted!");
    } catch {
      // local fallback so you can see it working now
      const localItem = {
        _id: `local-${Date.now()}`,
        name, email, message: msg,
        createdAt: new Date().toISOString(),
      };
      setList((prev) => [localItem, ...prev]);
      setName(""); setEmail(""); setMsg("");
      setOk("Comment posted locally (backend not yet wired).");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 p-6 md:p-8 bg-white">
      <h3 className="text-xl font-semibold">Comments</h3>

      {/* List */}
      <div className="mt-4 space-y-4">
        {list.length === 0 ? (
          <p className="text-sm text-neutral-500">No comments yet.</p>
        ) : (
          list.map((c) => (
            <div key={c._id} className="rounded-lg border border-neutral-200 p-3">
              <div className="text-sm font-medium">{c.name || "Anonymous"}</div>
              <div className="text-xs text-neutral-500">
                {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
              </div>
              <p className="mt-2 text-sm">{c.message}</p>
            </div>
          ))
        )}
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-6 grid gap-3">
        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="rounded-lg border border-neutral-300 px-3 py-2"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="rounded-lg border border-neutral-300 px-3 py-2"
            required
          />
        </div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Your comment…"
          className="rounded-lg border border-neutral-300 px-3 py-2 h-28"
          required
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={posting}
            className="rounded-lg bg-black text-white px-4 py-2 hover:bg-neutral-800 disabled:opacity-60"
          >
            {posting ? "Posting…" : "Post comment"}
          </button>
          {ok && <span className="text-sm text-emerald-600">{ok}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </form>
    </div>
  );
}
