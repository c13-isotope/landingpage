// client/src/App.jsx
import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import AdminNewBlog from "./pages/AdminNewBlog";
import AdminPosts from "./pages/AdminPosts";
import AdminEditBlog from "./pages/AdminEditBlog";

function Home() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/message")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error("Error:", err));
  }, []);
  return (
    <div style={{ padding: "2rem" }}>
      <h1>🚀 Welcome to NextGen CMC Landing Page</h1>
      <p>📖 {message}</p>
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
          {/* Admin links are not public; open directly when needed */}
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
