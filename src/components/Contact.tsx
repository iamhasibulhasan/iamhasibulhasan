import { useState } from "react"
import { Mail, MapPin, Send } from "lucide-react"
import { profile } from "../data/resume"
import Reveal from "./Reveal"
import {
  FacebookIcon,
  GithubIcon,
  HackerRankIcon,
  InstagramIcon,
  LeetCodeIcon,
  LinkedinIcon,
  NuGetIcon,
  WhatsappIcon,
} from "./BrandIcons"

const SOCIAL_ICONS: Record<string, (props: { size?: number }) => React.ReactElement> = {
  GitHub: GithubIcon,
  LinkedIn: LinkedinIcon,
  NuGet: NuGetIcon,
  LeetCode: LeetCodeIcon,
  HackerRank: HackerRankIcon,
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
}

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjybdbyl"

type SubmitStatus = "idle" | "sending" | "sent" | "error"

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const whatsappHref = `https://wa.me/${profile.phone.replace(/\D/g, "")}`

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(e.currentTarget),
      })
      if (res.ok) {
        setStatus("sent")
        setForm({ name: "", email: "", message: "" })
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 lg:mx-0 lg:max-w-350 py-20">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Contact
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Let's build something together</h2>
        <p className="mt-3 max-w-xl" style={{ color: "var(--text-muted)" }}>
          Have a project in mind, or just want to talk shop about .NET and system design? My inbox is open.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Reveal delay={0.05} className="lg:col-span-2">
          <div className="flex flex-col gap-4">
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:opacity-80"
              style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--bg-inset)" }}>
                <Mail size={16} style={{ color: "var(--accent)" }} />
              </span>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Email</p>
                <p className="text-sm font-medium">{profile.email}</p>
              </div>
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:opacity-80"
              style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "#25D366", color: "#ffffff" }}>
                <WhatsappIcon size={18} />
              </span>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>WhatsApp</p>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Message me on WhatsApp</p>
              </div>
            </a>
            <div
              className="flex items-center gap-3 rounded-2xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--bg-inset)" }}>
                <MapPin size={16} style={{ color: "var(--accent)" }} />
              </span>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Location</p>
                <p className="text-sm font-medium">{profile.location}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.socials
                .filter((s) => SOCIAL_ICONS[s.label])
                .map((s) => {
                  const Icon = SOCIAL_ICONS[s.label]
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="flex h-11 w-11 items-center justify-center rounded-full border transition-all hover:-translate-y-0.5 hover:border-(--accent) hover:text-(--accent)"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <Icon size={16} />
                    </a>
                  )
                })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border p-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
          >
            {/* Honeypot — invisible to real visitors, bots fill it, Formspree silently drops the submission */}
            <input
              type="text"
              name="_gotcha"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute h-0 w-0 opacity-0"
              style={{ left: "-9999px" }}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                required
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-(--accent)"
                style={{ borderColor: "var(--border)", background: "var(--bg-inset)" }}
              />
              <input
                required
                name="email"
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-(--accent)"
                style={{ borderColor: "var(--border)", background: "var(--bg-inset)" }}
              />
            </div>
            <textarea
              required
              name="message"
              rows={5}
              placeholder="Tell me about your project..."
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="resize-none rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-(--accent)"
              style={{ borderColor: "var(--border)", background: "var(--bg-inset)" }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
            >
              <Send size={16} />
              {status === "sending" ? "Sending..." : "Send message"}
            </button>
            {status === "sent" && (
              <p className="text-xs" style={{ color: "var(--accent)" }}>
                Message sent — thanks for reaching out! I'll get back to you soon.
              </p>
            )}
            {status === "error" && (
              <p className="text-xs" style={{ color: "#ef4444" }}>
                Something went wrong. Please email me directly at {profile.email}.
              </p>
            )}
          </form>
        </Reveal>
      </div>
    </section>
  )
}
