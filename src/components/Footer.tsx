import { profile } from "../data/resume"

export default function Footer() {
  return (
    <footer className="border-t px-6 py-8" style={{ borderColor: "var(--border)" }}>
      <div
        className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm sm:flex-row lg:mx-0 lg:max-w-350"
        style={{ color: "var(--text-muted)" }}
      >
        <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
        <p>Built with React, TypeScript & Tailwind CSS.</p>
      </div>
    </footer>
  )
}
