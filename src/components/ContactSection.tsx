import { useRef, useState } from "react";
import { Send, Download, ArrowUpRight, Briefcase, Users, GitPullRequest, MessageSquare } from "lucide-react";
import { personalInfo } from "@/data/portfolio";
import { toast } from "@/components/ui/sonner";
import {
  CONTACT_HONEYPOT_FIELD,
  CONTACT_REASONS,
  FORMSPREE_ENDPOINT,
  contactSchema,
  contactSubject,
  type ContactFormData,
} from "@/lib/contact";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import LogoMark from "@/components/LogoMark";
import { SOCIAL_LINKS } from "@/data/site-links";
import { SectionGuideDock } from "@/components/guide/SectionGuideDock";

/**
 * One icon per contact reason.
 *
 * Keyed off CONTACT_REASONS so adding a reason surfaces here as a type error
 * rather than silently rendering without an icon.
 */
const REASON_ICONS: Record<(typeof CONTACT_REASONS)[number], React.ElementType> = {
  Hiring: Briefcase,
  Collaboration: Users,
  "Open Source": GitPullRequest,
  Other: MessageSquare,
};

const INITIAL_FORM: ContactFormData = {
  name: "",
  email: "",
  reason: CONTACT_REASONS[0],
  message: "",
};

type ContactField = keyof ContactFormData;
type ContactErrors = Partial<Record<ContactField, string>>;

const ContactSection = () => {
  const [form, setForm] = useState<ContactFormData>(INITIAL_FORM);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State updates are async, so a fast second submit could slip past isSubmitting.
  const inFlightRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlightRef.current) return;

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors = parsed.error.issues.reduce<ContactErrors>((acc, issue) => {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in acc)) {
          acc[field as ContactField] = issue.message;
        }
        return acc;
      }, {});

      setErrors(nextErrors);
      toast.error("Please review the form", {
        description: parsed.error.issues[0]?.message || "Check the highlighted fields and try again.",
      });
      return;
    }

    setErrors({});

    inFlightRef.current = true;
    try {
      setIsSubmitting(true);

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...parsed.data,
          _subject: contactSubject(parsed.data),
          _replyto: parsed.data.email,
          [CONTACT_HONEYPOT_FIELD]: honeypot,
        }),
      });

      if (!response.ok) {
        // Formspree answers with { errors: [{ message }] } (or { error }) when it refuses a message.
        const data = (await response.json().catch(() => null)) as { error?: string; errors?: { message?: string }[] } | null;
        const reason = data?.errors?.map((issue) => issue.message).filter(Boolean).join(" ") || data?.error;
        throw new Error(reason || "Unable to send your message right now.");
      }

      setForm(INITIAL_FORM);
      setHoneypot("");
      setErrors({});
      toast.success("Message sent", {
        description: "Thanks for reaching out. I will get back to you soon.",
      });
    } catch (error) {
      toast.error("Unable to send your message", {
        description: error instanceof Error ? error.message : "Unable to send your message right now.",
      });
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section-padding relative z-10">
      <div className="container-narrow">

        {/* Heading */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full glass-subtle border border-primary/20 text-xs font-mono text-primary-text mb-6">
            Connect
          </div>
          <h2 className="heading-xl mb-4">
            Get in <span className="text-gradient">Touch</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            {personalInfo.focus}
          </p>
          <SectionGuideDock section="contact" layout="stack" className="mt-6" />
        </div>

        {/* Mobile-only business card, drawn in CSS: the logo, name, role and email. */}
        <div className="mx-auto mb-10 block w-full max-w-xs sm:max-w-sm lg:hidden" aria-hidden="true">
          <div className="relative overflow-hidden rounded-3xl border border-foreground/10 glass-subtle p-6 shadow-accent-strong">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.22)_0%,transparent_70%)]" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.14)_0%,transparent_70%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <LogoMark size={40} />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary-text">Portfolio</span>
            </div>
            <p className="relative mt-10 font-display text-2xl font-semibold tracking-tight text-foreground">{personalInfo.fullName}</p>
            <p className="relative mt-1 text-sm text-muted-foreground">{personalInfo.role} · {personalInfo.location}</p>
            <p className="relative mt-5 border-t border-foreground/10 pt-4 font-mono text-xs text-primary-text">{personalInfo.email}</p>
          </div>
        </div>

        {/* Two equal panels with Spotlight */}
        <div data-guide-spot="contact" className="grid items-stretch gap-6 lg:grid-cols-2">

          {/* Left panel */}
          <SpotlightCard className="h-full">
            <div className="p-6 sm:p-8 md:p-10 flex flex-col gap-6 h-full">
              {/* Grows to fill */}
              <div className="flex flex-col gap-6 flex-1">
                <div>
                  <h3 className="heading-lg mb-3">Let&apos;s Build Something</h3>
                  <p className="text-base text-muted-foreground leading-relaxed" style={{ textWrap: "pretty" }}>
                    Have a project in mind, or just want to talk shop about .NET and system design? My inbox is open. If you&apos;re hiring for a .NET Core role, I&apos;d welcome a conversation about the team and the problem you&apos;re solving.
                  </p>
                </div>

                {/* Social links */}
                <div className="flex flex-col gap-3">
                  {SOCIAL_LINKS.map(({ icon: Icon, label, value, href }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith("mailto") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-4 h-4 text-primary-text" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                        <p className="text-sm font-semibold truncate text-foreground/90">{value}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary-text transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Pinned to bottom */}
              <div className="mt-auto flex min-h-[122px] flex-col justify-between gap-4">
                <a
                  href={personalInfo.resumeUrl}
                  download
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide glow-accent-sm hover:glow-accent-md transition-all duration-300 active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  Download Resume
                </a>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground border-t border-black/10 dark:border-white/5 pt-4">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse motion-reduce:animate-none shrink-0" />
                  Available for new opportunities
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Right panel — Form */}
          <SpotlightCard className="h-full">
            <form data-guide-target="contact-form" onSubmit={handleSubmit} className="relative p-6 sm:p-8 md:p-10 flex flex-col gap-6 h-full" aria-busy={isSubmitting} noValidate>
              <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name={CONTACT_HONEYPOT_FIELD}
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>

              {/* Grows to fill */}
              <div className="flex flex-col gap-6 flex-1">
                <div>
                  <h3 className="heading-lg mb-3">Send a Message</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Share the role, team, problem space, or product idea and I&apos;ll reply with context that&apos;s actually useful.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="text-xs font-mono font-medium text-foreground/70 mb-2 block uppercase tracking-wider">Name</label>
                    <input
                      id="contact-name"
                      required
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                      disabled={isSubmitting}
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (errors.name) {
                          setErrors((current) => ({ ...current, name: undefined }));
                        }
                      }}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "contact-name-error" : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                      placeholder="Your name"
                    />
                    {errors.name && (
                      <p id="contact-name-error" className="mt-2 text-sm text-destructive">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="text-xs font-mono font-medium text-foreground/70 mb-2 block uppercase tracking-wider">Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      maxLength={120}
                      autoComplete="email"
                      disabled={isSubmitting}
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (errors.email) {
                          setErrors((current) => ({ ...current, email: undefined }));
                        }
                      }}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "contact-email-error" : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                      placeholder="you@company.com"
                    />
                    {errors.email && (
                      <p id="contact-email-error" className="mt-2 text-sm text-destructive">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-reason" className="text-xs font-mono font-medium text-foreground/70 mb-2 block uppercase tracking-wider">Reason</label>
                  {/*
                    Radix Select rather than a native <select>: the OS renders a
                    native dropdown's option list itself, so it cannot be themed
                    and appeared as a plain grey system menu against the rest of
                    the portfolio. This one is real markup, so it follows the
                    site's glass and accent language.
                  */}
                  <Select
                    value={form.reason}
                    disabled={isSubmitting}
                    onValueChange={(value) => {
                      setForm({ ...form, reason: value as ContactFormData["reason"] });
                      if (errors.reason) {
                        setErrors((current) => ({ ...current, reason: undefined }));
                      }
                    }}
                  >
                    <SelectTrigger
                      id="contact-reason"
                      aria-invalid={Boolean(errors.reason)}
                      aria-describedby={errors.reason ? "contact-reason-error" : undefined}
                    >
                      {/*
                        Explicit content rather than <SelectValue/>: Radix mirrors
                        the selected item's children into the trigger, which would
                        drag the icon tile and hint line in with it. The collapsed
                        trigger shows the icon at label scale and the label only.
                      */}
                      <span className="flex min-w-0 items-center gap-2.5">
                        {(() => {
                          const ReasonIcon = REASON_ICONS[form.reason];
                          return <ReasonIcon className="h-4 w-4 shrink-0 text-primary-text" />;
                        })()}
                        <span className="truncate">{form.reason}</span>
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_REASONS.map((r) => (
                        <SelectItem key={r} value={r} icon={REASON_ICONS[r]}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.reason && (
                    <p id="contact-reason-error" className="mt-2 text-sm text-destructive">
                      {errors.reason}
                    </p>
                  )}
                </div>

                <div className="flex-1 flex flex-col min-h-[140px]">
                  <label htmlFor="contact-message" className="text-xs font-mono font-medium text-foreground/70 mb-2 block uppercase tracking-wider">Message</label>
                  <textarea
                    id="contact-message"
                    required
                    minLength={10}
                    maxLength={2000}
                    disabled={isSubmitting}
                    value={form.message}
                    onChange={(e) => {
                      setForm({ ...form, message: e.target.value });
                      if (errors.message) {
                        setErrors((current) => ({ ...current, message: undefined }));
                      }
                    }}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    className="flex-1 w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/40"
                    placeholder="Tell me about the opportunity or idea..."
                  />
                  {errors.message && (
                    <p id="contact-message-error" className="mt-2 text-sm text-destructive">
                      {errors.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Pinned to bottom */}
              <div className="mt-auto flex min-h-[122px] flex-col justify-between gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl glass-subtle border border-black/10 dark:border-white/10 text-foreground font-bold text-sm tracking-wide hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 text-primary-text" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
                <p className="text-[11px] font-medium text-muted-foreground/60 text-center border-t border-black/10 dark:border-white/5 pt-4">
                  Messages are sent securely to {personalInfo.email} with your email set as the reply-to.
                </p>
              </div>
            </form>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
