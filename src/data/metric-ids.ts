/**
 * Ids of every entry in `METRICS` (`data/metrics.ts`). Empty until a measured
 * result is added: a case-study result can then point at the entry that
 * records how it was measured.
 */
export const METRIC_IDS = [] as const;

export type MetricId = (typeof METRIC_IDS)[number];
