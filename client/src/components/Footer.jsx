// src/components/Footer.jsx
export default function Footer() {
    return (
      <footer className="border-t border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-neutral-500">
          © {new Date().getFullYear()} NextGen CMC. All rights reserved.
        </div>
      </footer>
    );
  }
  