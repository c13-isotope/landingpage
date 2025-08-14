import { Link, NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  (isActive ? "underline" : "hover:underline") + " text-sm";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-neutral-200">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">NextGen CMC</Link>
        <div className="flex items-center gap-5">
          <NavLink to="/" className={linkClass}>Home</NavLink>
          <NavLink to="/blog" className={linkClass}>Blog</NavLink>
          <NavLink to="/resources" className={linkClass}>Resources</NavLink>
          <NavLink to="/services" className={linkClass}>Services</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>
        </div>
      </nav>
    </header>
  );
}
