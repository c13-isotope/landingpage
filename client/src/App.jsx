// client/src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import AdminGate from "./components/AdminGate";

import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import AdminNewBlog from "./pages/AdminNewBlog";
import AdminPosts from "./pages/AdminPosts";
import AdminEditBlog from "./pages/AdminEditBlog";

// Static pages
import About from "./pages/About";
import Services from "./pages/Services";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import Newsletter from "./pages/Newsletter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";

// Category listing
import Category from "./pages/Category";

// Build a safe API base (strip trailing slash). If empty, relative paths work with the dev proxy.
const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(!!API_BASE);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!API_BASE) return; // skip fetch if not configured
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
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">🚀 Welcome to NextGen CMC</h1>
      <p className="mt-2 text-neutral-600">Modern regulatory CMC blog & tools.</p>

      <div className="mt-6 rounded-xl border border-neutral-200 p-4">
        {!API_BASE ? (
          <p className="text-sm text-neutral-500">
            Tip: Set <code>VITE_API_BASE</code> in <code>client/.env</code> or use a Vite proxy to show the API message here.
          </p>
        ) : loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : err ? (
          <p className="text-sm text-red-600">Error: {err}</p>
        ) : (
          <p className="text-sm">📖 {message}</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          {/* Core */}
          <Route index element={<Home />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/category/:slug" element={<Category />} />

          {/* Static pages */}
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Admin (UI-gated; backend still checks x-admin-key) */}
          <Route
            path="/admin/blog"
            element={
              <AdminGate>
                <AdminPosts />
              </AdminGate>
            }
          />
          <Route
            path="/admin/blog/new"
            element={
              <AdminGate>
                <AdminNewBlog />
              </AdminGate>
            }
          />
          <Route
            path="/admin/blog/edit/:slug"
            element={
              <AdminGate>
                <AdminEditBlog />
              </AdminGate>
            }
          />

          {/* SPA fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-neutral-500">
          © {new Date().getFullYear()} NextGen CMC. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
