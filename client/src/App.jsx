// client/src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";

import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import AdminNewBlog from "./pages/AdminNewBlog";
import AdminPosts from "./pages/AdminPosts";
import AdminEditBlog from "./pages/AdminEditBlog";

// Build a safe API base (strip trailing slash). If empty, relative paths work with the dev proxy.
const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/message`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMessage(data?.message ?? "");
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Failed to load message");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🚀 Welcome to NextGen CMC Landing Page</h1>
      {loading ? (
        <p>Loading…</p>
      ) : err ? (
        <p style={{ color: "crimson" }}>Error: {err}</p>
      ) : (
        <p>📖 {message}</p>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div>
      <header style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link to="/">Home</Link>
          <Link to="/blog">Blog</Link>
          {/* Admin links exist but aren't linked in the public nav */}
        </nav>
      </header>

      <main style={{ padding: "1rem" }}>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* Admin */}
          <Route path="/admin/blog" element={<AdminPosts />} />
          <Route path="/admin/blog/new" element={<AdminNewBlog />} />
          <Route path="/admin/blog/edit/:slug" element={<AdminEditBlog />} />

          {/* SPA fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
