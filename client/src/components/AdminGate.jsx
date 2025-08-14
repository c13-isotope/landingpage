// client/src/components/AdminGate.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function AdminGate({ children }) {
  const key = localStorage.getItem("adminKey") || "";
  const loc = useLocation();
  if (!key) {
    // No key saved in this browser → send them to /blog
    return <Navigate to="/blog" replace state={{ from: loc.pathname }} />;
  }
  return children;
}
