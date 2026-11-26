import { useParams } from "react-router-dom";
import Link from "@/lib/compat/link";
import { RouteGuideSocket } from "@/components/guide/RouteGuideSocket";
import { ArrowLeft, ArrowRight, ArrowUpRight, Download } from "lucide-react";
import { caseStudyBySlug, getCaseStudyPath, getThemeAdjacent } from "@/data/case-studies";
import { METRICS } from "@/data/metrics";
import { pillarById } from "@/data/thesis";
import { Annotated, MarginNote } from "@/components/case-study/MarginNote";
import { RelatedStudies } from "@/components/case-study/RelatedStudies";
import { personalInfo } from "@/data/portfolio";
import CaseStudyToc, { type TocItem } from "@/components/CaseStudyToc";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotFound from "@/pages/NotFound";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const sectionId = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * One case study. Every part of the page is drawn only when the study has
 * content for it: the studies are drafted from the résumé, and a heading
 * with nothing under it would read as a gap rather than as honesty.
 */
const CaseStudyPage = () => {
  const { slug = "" } = useParams();
  const study = caseStudyBySlug.get(slug);
  useDocumentTitle(study ? study.title : "Page not found");

  if (!study) return <NotFound />;

  // Prev/next follow the /work groups, so reading on stays inside a theme.
  const { previous, next } = getThemeAdjacent(study.slug);
  const metricById = new Map(METRICS.map((metric) => [metric.id, metric]));
  const measured = study.results.flatMap((result) => {
    const metric = result.metricId ? metricById.get(result.metricId) : undefined;
    return metric ? [{ result, metric }] : [];
  });

  const has = {
    problem: study.problem.trim().length > 0,
    constraints: study.constraints.length > 0,
    decisions: study.decisions.length > 0,
    results: study.results.length > 0,
    ownership: study.ownership.trim().length > 0,
    stack: study.stack.length > 0,
  };

  const tocItems: TocItem[] = [
    ...(has.problem ? [{ id: "problem", label: "The problem" }] : []),
    ...(has.constraints ? [{ id: "constraints", label: "Constraints" }] : []),
    ...(has.decisions ? [{ id: "decisions", label: "Decisions" }] : []),
    ...study.sections.map((section) => ({ id: sectionId(section.heading), label: section.heading })),
    ...(has.stack ? [{ id: "stack", label: "Stack" }] : []),
    ...(has.ownership ? [{ id: "ownership", label: "What was mine" }] : []),
  ];

  // The first section drawn gets no top margin; the rest are spaced from it.
  let drawn = 0;
  const gap = () => (drawn++ === 0 ? "" : "mt-14 ");

  return (
    <>
      <Navbar />

      <main id="main-content" tabIndex={-1} className="relative z-10 scroll-mt-0 focus:outline-none">
        <article id="case-study-article" className="section-padding">
          <div className="container-narrow">
            <div className="mb-8">
              <Link
                href="/work"
                className="-my-3 inline-flex min-h-11 items-center gap-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary-text"
              >
                <ArrowLeft className="h-4 w-4" />
                All work
              </Link>
            </div>

            {/* Header: identity and headline figures sit above the narrative,
                because that is the order these pages actually get read in. */}
            <div className="flex items-start justify-between gap-10">
              <div className="min-w-0">
                <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs">
                  {study.employer && (
                    <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-primary-text">
                      {study.employer}
                    </span>
                  )}
                  <span className="text-muted-foreground">{study.period}</span>
                  {study.live && (
                    <a
                      href={study.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1.5 text-primary-text transition-colors hover:border-primary/60"
                    >
                      {study.live.replace(/^https?:\/\//, "")}
                      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                  {(study.pillars ?? []).map((id) => (
                    <span key={id} className="rounded-full border border-primary/30 px-3 py-1.5 text-primary-text">
                      {pillarById(id).label}
                    </span>
                  ))}
                  {study.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="heading-xl mt-6 max-w-3xl">
                  <span className="text-gradient">{study.title}</span>
                </h1>
                <p data-guide-route-spot="intro" className="mt-5 max-w-3xl text-lg leading-relaxed text-foreground/85" style={{ textWrap: "pretty" }}>
                  {study.oneLiner}
                </p>
              </div>
              <div className="mt-8">
                <RouteGuideSocket prompt="A short write-up: what it is, the stack, and what was his." />
              </div>
            </div>

            {has.results && (
              <dl data-guide-target="cs-results" className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-foreground/10 glass-subtle glow-accent-panel sm:grid-cols-4">
                {study.results.map((result) => (
                  <div key={result.label} className="bg-background/20 p-5">
                    <dt className="sr-only">{result.label}</dt>
                    <dd>
                      <span className="block text-2xl font-bold tracking-tighter text-foreground sm:text-3xl">{result.metric}</span>
                      <span className="mt-1.5 block text-xs leading-snug text-muted-foreground">{result.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Who owned what, up front: the first thing an interviewer checks. */}
            {study.ownershipSummary && (
              <p data-guide-target="cs-ownership" className="mt-6 flex max-w-3xl gap-2 text-sm leading-relaxed text-foreground/80">
                <span className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-primary-text">Ownership</span>
                <span>
                  {study.ownershipSummary}{" "}
                  {has.ownership && (
                    <a href="#ownership" className="text-primary-text underline-offset-4 hover:underline">
                      Details
                    </a>
                  )}
                </span>
              </p>
            )}

            {/* How each headline figure was measured. */}
            {measured.length > 0 && (
              <details className="group mt-4 max-w-3xl">
                <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary-text hover:text-primary-text">
                  How these were measured
                  <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span>
                </summary>
                <dl className="mt-3 flex flex-col gap-3 border-l-2 border-primary/25 pl-4">
                  {measured.map(({ result, metric }) => (
                    <div key={result.label}>
                      <dt className="text-sm font-semibold text-foreground">
                        {result.metric} <span className="font-normal text-muted-foreground">{result.label}</span>
                      </dt>
                      <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{metric.context}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}

            <p className="mt-10 max-w-3xl text-lg leading-relaxed text-muted-foreground" style={{ textWrap: "pretty" }}>
              {study.summary}
            </p>

            {/* Two columns from here: sticky TOC beside the prose. */}
            {tocItems.length > 0 && (
              <div className="mt-16 flex flex-col gap-10 lg:flex-row lg:gap-14">
                <div className="w-full shrink-0 lg:w-56">
                  <CaseStudyToc items={tocItems} />
                </div>

                <div className="min-w-0 flex-1">
                  {has.problem && (
                    <div>
                      <h2 id="problem" className={gap() + "heading-md scroll-mt-28"}>The problem</h2>
                      <div className="mt-4 rounded-2xl border border-foreground/10 glass-subtle p-6">
                        <p className="text-base leading-relaxed text-muted-foreground" style={{ textWrap: "pretty" }}>
                          {study.problem}
                        </p>
                      </div>
                    </div>
                  )}

                  {has.constraints && (
                    <div>
                      <h2 id="constraints" className={gap() + "heading-md scroll-mt-28"}>Constraints</h2>
                      <ul className="mt-4 flex flex-col divide-y divide-foreground/10 overflow-hidden rounded-2xl glass-subtle">
                        {study.constraints.map((constraint) => (
                          <li key={constraint} className="flex gap-3 p-5 text-base leading-relaxed text-muted-foreground">
                            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                            <span style={{ textWrap: "pretty" }}>{constraint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {has.decisions && (
                    <div>
                      <h2 id="decisions" data-guide-target="cs-decisions" className={gap() + "heading-md scroll-mt-28"}>Decisions</h2>
                      <p className="mt-3 text-sm text-muted-foreground">What was chosen, why, and what was turned down to get there.</p>
                      <div className="mt-6 flex flex-col gap-4">
                        {study.decisions.map((decision) => (
                          <Annotated
                            key={decision.choice}
                            note={
                              decision.rejected && decision.rejected.length > 0 ? (
                                <MarginNote label="Why not the others?">
                                  <ul className="flex flex-col gap-2">
                                    {decision.rejected.map((item) => {
                                      const [option, ...why] = item.split(" — ");
                                      return (
                                        <li key={item}>
                                          <span className="font-semibold text-foreground/85">{option}</span>
                                          {why.length > 0 && <>: {why.join(" — ")}</>}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </MarginNote>
                              ) : null
                            }
                          >
                            <SpotlightCard>
                              <div className="p-6 sm:p-7">
                                <h3 className="text-lg font-bold tracking-tight text-foreground">{decision.choice}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground" style={{ textWrap: "pretty" }}>
                                  {decision.why}
                                </p>
                                {decision.rejected && decision.rejected.length > 0 && (
                                  <div className="mt-5 border-t border-foreground/10 pt-4">
                                    <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">Considered and rejected</p>
                                    <ul className="mt-3 flex flex-col gap-2">
                                      {decision.rejected.map((item) => (
                                        <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground/85">
                                          <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-muted-foreground/40" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </SpotlightCard>
                          </Annotated>
                        ))}
                      </div>
                    </div>
                  )}

                  {study.sections.map((section) => (
                    <div key={section.heading}>
                      <h2 id={sectionId(section.heading)} className={gap() + "heading-md scroll-mt-28"}>
                        {section.heading}
                      </h2>
                      <p className="mt-4 text-base leading-relaxed text-muted-foreground" style={{ textWrap: "pretty" }}>
                        {section.body}
                      </p>
                      {section.points && (
                        <ul className="mt-5 flex flex-col gap-3">
                          {section.points.map((point) => (
                            <li key={point} className="flex gap-3 text-base leading-relaxed text-muted-foreground">
                              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                              <span style={{ textWrap: "pretty" }}>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  {has.stack && (
                    <div>
                      <h2 id="stack" className={gap() + "heading-md scroll-mt-28"}>Stack</h2>
                      <ul className="mt-5 flex flex-wrap gap-2.5">
                        {study.stack.map((item) => (
                          <li key={item} className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary-text">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Stated plainly and on purpose: shared work described as sole
                      ownership is the fastest way to lose a technical interview. */}
                  {has.ownership && (
                    <div>
                      <h2 id="ownership" className={gap() + "heading-md scroll-mt-28"}>What was mine</h2>
                      <div className="mt-4 rounded-2xl border border-primary/20 glass-subtle p-6 glow-accent-panel">
                        <p className="text-base leading-relaxed text-muted-foreground" style={{ textWrap: "pretty" }}>
                          {study.ownership}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <RelatedStudies slug={study.slug} />

            <nav aria-label="More case studies" className="mt-16 grid gap-4 border-t border-foreground/10 pt-8 sm:grid-cols-2">
              {previous ? (
                <Link
                  href={getCaseStudyPath(previous.slug)}
                  className="group flex flex-col gap-1 rounded-xl glass-subtle px-5 py-4 transition-colors hover:border-primary/30"
                >
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    <ArrowLeft className="h-3 w-3" />
                    Previous
                  </span>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary-text">{previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  href={getCaseStudyPath(next.slug)}
                  className="group flex flex-col gap-1 rounded-xl glass-subtle px-5 py-4 text-right transition-colors hover:border-primary/30 sm:items-end"
                >
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Next
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary-text">{next.title}</span>
                </Link>
              )}
            </nav>

            <div className="mt-12 flex flex-wrap gap-4">
              <Link href="/#contact" className="btn-cta-primary shadow-accent-soft">
                Get in touch
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href={personalInfo.resumeUrl} download className="btn-cta-secondary">
                <Download className="h-4 w-4 text-primary-text" />
                Download resume
              </a>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
};

export default CaseStudyPage;
