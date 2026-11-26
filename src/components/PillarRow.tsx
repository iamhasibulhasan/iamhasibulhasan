import Link from "@/lib/compat/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { PILLARS, type Pillar } from "@/data/thesis";
import { getCaseStudyPath } from "@/data/case-studies";

/**
 * The four things the Work section backs up, as a compact row of links above
 * the featured case studies. A pillar with a study links to it; one without
 * links to its outside evidence (NuGet).
 */
export function PillarRow() {
  return (
    <ul className="mb-14 grid gap-px overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
      {PILLARS.map((pillar) => (
        <PillarCell key={pillar.id} id={pillar.id}>
          {pillar.studySlug ? (
            <Link href={getCaseStudyPath(pillar.studySlug)} className={CELL}>
              <PillarBody label={pillar.label} claim={pillar.claim} action="Read the case study" />
            </Link>
          ) : (
            <a href={pillar.href} target="_blank" rel="noreferrer" className={CELL}>
              <PillarBody label={pillar.label} claim={pillar.claim} action={pillar.hrefLabel ?? "See the proof"} />
            </a>
          )}
        </PillarCell>
      ))}
    </ul>
  );
}

const CELL =
  "group flex h-full w-full flex-col gap-1.5 bg-background/60 px-5 py-4 text-left transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary";

/** Each pillar's cell, with its highlight id as a data attribute the tour can point at. */
function PillarCell({ id, children }: { id: Pillar["id"]; children: ReactNode }) {
  return <li data-guide-target={`pillar-${id}`}>{children}</li>;
}

function PillarBody({ label, claim, action }: { label: string; claim: string; action: string }) {
  return (
    <>
      <span className="font-mono text-[11px] uppercase tracking-wider text-primary-text">{label}</span>
      <span className="text-xs leading-snug text-muted-foreground">{claim}</span>
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-semibold text-foreground/70 group-hover:text-primary-text">
        {action}
        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
      </span>
    </>
  );
}
