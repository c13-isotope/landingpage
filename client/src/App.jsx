// client/src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import AdminGate from "./components/AdminGate";
import Navbar from "./components/Navbar"; // used inside Layout, but harmless to keep

// Core pages
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";

// Admin pages
import AdminNewBlog from "./pages/AdminNewBlog";
import AdminPosts from "./pages/AdminPosts";
import AdminBlogEdit from "./pages/AdminBlogEdit";

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

// In dev we use the Vite proxy, so use RELATIVE API paths (no base URL)
const API_BASE = ""; // keep empty to ensure /api/... goes through the vite proxy

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
        // ✅ relative URL — will proxy to http://localhost:8080
        const res = await fetch(`/api/message`, { signal: controller.signal });
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
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : err ? (
          <p className="text-sm text-red-600">Error: {err}</p>
        ) : (
          <p className="text-sm">📖 {message}</p>
        )}

        {/* TEMP: remove whenever you like */}
        {/* <div className="bg-black text-white p-4 rounded mt-4">Tailwind test</div> */}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
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

        {/* Admin */}
        <Route path="/admin/blog" element={<AdminGate><AdminPosts /></AdminGate>} />
        <Route path="/admin/blog/new" element={<AdminGate><AdminNewBlog /></AdminGate>} />
        <Route path="/admin/blog/:slug/edit" element={<AdminGate><AdminBlogEdit /></AdminGate>} />

        {/* SPA fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
