// client/src/pages/AdminPosts.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function AdminPosts() {
  const [sp, setSp] = useSearchParams();
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));

  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [adminKey, setAdminKey] = useState("");

  useEffect(() => {
    setAdminKey(localStorage.getItem("adminKey") || "");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // using public list for now (shows published); good enough to edit/delete
        const res = await fetch(`/api/blog/public/list?page=${page}&limit=20`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        setRows(Array.isArray(data.items) ? data.items : []);
        setTotalPages(Number(data.totalPages) || 1);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load posts");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [page]);

  const setPage = (p) => setSp(new URLSearchParams({ page: String(p) }));

  async function handleDelete(id) {
    if (!adminKey) {
      alert("Set your admin key first.");
      return;
    }
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error(await res.text());
      // refresh list
      const next = rows.filter((r) => r._id !== id && r.id !== id);
      setRows(next);
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <p><Link to="/blog">← Back to Blog</Link></p>
      <h1>Admin – Posts</h1>

      <div style={{ margin: "12px 0", display: "flex", gap: 8 }}>
        <input
          type="password"
          placeholder="x-admin-key"
          value={adminKey}
          onChange={(e) => {
            setAdminKey(e.target.value);
            localStorage.setItem("adminKey", e.target.value);
          }}
          style={{ padding: 8, flex: 1, maxWidth: 320 }}
        />
        <Link to="/admin/blog/new">+ New Post</Link>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : err ? (
        <p style={{ color: "crimson" }}>Error: {err}</p>
      ) : rows.length === 0 ? (
        <p>No posts.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Title</th>
              <th style={th}>Slug</th>
              <th style={th}>Status</th>
              <th style={th}>Published</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const id = r.id || r._id; // handle either field
              return (
                <tr key={id}>
                  <td style={td}>
                    <Link to={`/blog/${r.slug}`}>{r.title}</Link>
                  </td>
                  <td style={td}><code>{r.slug}</code></td>
                  <td style={td}>{r.status}</td>
                  <td style={td}>
                    {r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={td}>
                    <Link to={`/admin/blog/edit/${r.slug}?id=${encodeURIComponent(id)}`} style={{ marginRight: 8 }}>
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
        <button onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</button>
      </div>
    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #eee", padding: 8 };
const td = { borderBottom: "1px solid #f3f3f3", padding: 8 };
