import Link from "@/lib/compat/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Quiet at rest, raised on hover and focus. `before:` is an invisible hit
 * area: the pill keeps its small look, the finger gets a 44px-tall target
 * (WCAG 2.5.8).
 */
const AFFORDANCE_BASE =
  "relative before:absolute before:-inset-x-1 before:-inset-y-3 before:content-[''] inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 align-middle font-mono text-[10px] font-medium uppercase tracking-wider transition-colors duration-200 " +
  "border-primary/15 text-primary-text " +
  "hover:border-primary/40 hover:bg-primary/10 hover:text-primary-text " +
  "focus-visible:border-primary/40 focus-visible:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 " +
  "motion-reduce:transition-none";

/** A "Read case study" pill: a real link, so it stays crawlable and middle-clickable. */
export function ReadCaseStudyLink({ href, label = "Read case study", className }: { href: string; label?: string; className?: string }) {
  return (
    <Link href={href} className={cn(AFFORDANCE_BASE, "ml-2", className)}>
      {label}
      <ArrowRight className="h-2.5 w-2.5" />
    </Link>
  );
}
