import Link from "@/lib/compat/link";
import { usePathname } from "@/lib/compat/navigation";
import { ArrowUp, Download } from "lucide-react";
import { personalInfo } from "@/data/portfolio";
import { scrollToHash, scrollToTop } from "@/lib/scroll";
import { SECTION_LINKS, SOCIAL_LINKS } from "@/data/site-links";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { FooterGuideLine, FooterRing } from "@/components/guide/FooterGuide";

/**
 * The end of every page (homepage, /work and every case study): one glass
 * panel with a sign-off on the left, the guide's landing slot in the centre
 * and the links on the right.
 *
 * As the landing band (`data-guide-footer-band`) rises into view the scroll
 * companion curves into the slot (`data-guide-footer-socket`) and grows to
 * its size; scrolling back reverses it. The slot is an empty ring until the
 * guide arrives, never a second face; once landed, clicking it gets a
 * reaction and its line shows above the slot.
 */
const Footer = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";
  // Off the homepage a bare "#about" resolves to nothing: navigate to "/#about".
  const sectionHref = (href: string) => (isHome ? href : `/${href}`);
  const onSection = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isHome) return;
    event.preventDefault();
    scrollToHash(href);
  };

  // The bottom padding grows by a phone's gesture bar / home indicator, which the page now runs under.
  return (
    <footer className="relative z-10 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-12 sm:pt-16">
      <div className="container-narrow">
        <SpotlightCard className="w-full">
          <div className="px-6 pb-6 pt-8 sm:px-10 sm:pt-10">
            <div data-guide-footer-band className="grid items-center gap-10 text-center md:min-h-[20rem] md:grid-cols-[minmax(0,1fr)_15rem_minmax(0,1fr)] md:gap-10 md:text-left">
              {/* Sign-off */}
              <div className="order-2 md:order-1">
                <p className="font-[family-name:var(--font-display)] text-[1.625rem] font-semibold leading-[1.15] tracking-[-0.025em] text-foreground sm:text-[1.875rem]" style={{ textWrap: "balance" }}>
                  Let&apos;s build software people rely on.
                </p>
                <p className="mx-auto mt-3 max-w-[34ch] text-sm leading-relaxed text-muted-foreground md:mx-0">
                  .NET Core services, APIs and the enterprise systems businesses run on.
                </p>
                <ul className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
                  {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target={href.startsWith("mailto") ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        aria-label={label}
                        title={label}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 glass-subtle text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* The guide's landing slot */}
              <div className="order-1 flex flex-col items-center md:order-2">
                <FooterGuideLine />
                <span data-guide-footer-socket aria-hidden="true" className="relative mt-4 block h-[150px] w-[150px]">
                  <span className="pointer-events-none absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.12)_0%,transparent_68%)]" />
                  {/* Out past the landed disc, so the ring shows round it; dim until the guide arrives. */}
                  <FooterRing />
                </span>
                <a href="#contact" onClick={(event) => onSection(event, "#contact")} className="btn-cta-primary mt-7">
                  Get in touch
                </a>
              </div>

              {/* Links */}
              <div className="relative order-3 flex min-w-0 items-center self-stretch md:justify-end md:justify-self-stretch">
                <nav aria-label="Footer">
                  <p className="mb-3 text-xs font-semibold text-muted-foreground/80">Explore</p>
                  <ul className="mx-auto grid w-fit grid-cols-2 gap-x-10 gap-y-1 text-left text-sm md:mx-0">
                    {SECTION_LINKS.map((link) => (
                      <li key={link.label}>
                        <Link href={sectionHref(link.href)} onClick={(event) => onSection(event, link.href)} className="inline-flex min-h-9 items-center text-foreground/75 transition-colors hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href="/work" className="inline-flex min-h-9 items-center text-foreground/75 transition-colors hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        All case studies
                      </Link>
                    </li>
                    <li>
                      <a href={personalInfo.resumeUrl} download className="inline-flex min-h-9 items-center gap-1.5 text-foreground/75 transition-colors hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        Resume
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-5 text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} {personalInfo.fullName}</p>
              <Link
                href="/"
                onClick={(event) => {
                  if (!isHome) return;
                  event.preventDefault();
                  scrollToTop();
                }}
                className="inline-flex min-h-8 items-center gap-1.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                {isHome ? "Back to top" : "Home"}
              </Link>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </footer>
  );
};

export default Footer;
