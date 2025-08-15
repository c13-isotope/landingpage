// client/src/components/SubscribeBlock.jsx
import { useState } from "react";

const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export default function SubscribeBlock() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setOk("");
    setErr("");
    if (!email) return;

    try {
      setLoading(true);
      // optional endpoint; if you don't have it yet, we just fake success
      const res = await fetch(`${API_BASE}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Not configured; skipping network.");
      setOk("Thanks! Check your inbox.");
      setEmail("");
    } catch {
      // fallback “local success” without .env changes
      setOk("Thanks! (Simulated subscribe — backend endpoint not yet configured.)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 p-6 md:p-8 bg-white">
      <div className="flex items-center gap-3 text-3xl">📧</div>
      <h3 className="mt-2 text-xl font-semibold">Subscribe to the OLS newsletter</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Get new posts and tools in your inbox.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@company.com"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black text-white px-4 py-2 hover:bg-neutral-800 disabled:opacity-60"
        >
          {loading ? "Subscribing…" : "Subscribe Now"}
        </button>
      </form>

      {ok && <p className="mt-3 text-sm text-emerald-600">{ok}</p>}
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
    </div>
  );
}
