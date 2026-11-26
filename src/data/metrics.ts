import type { MetricId } from "@/data/metric-ids";

/**
 * Every measured figure on the site, with how it was measured. Case studies
 * show the context as a "how these were measured" note. Empty for now: add an
 * entry (and its id in `metric-ids.ts`) when a result has a real number.
 */
export interface MetricEntry {
  id: MetricId;
  value: string;
  context: string;
  source: string;
}

export const METRICS: MetricEntry[] = [];
