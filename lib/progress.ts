import type { Milestone, MilestoneStatus } from "./types";

const STATUSES: MilestoneStatus[] = ["done", "doing", "next"];
const MAX_MILESTONES = 20;

/**
 * Keeps the well-formed entries of a manifest's `progress` list, so one typo
 * in a repo's `.puddings.json` hides a milestone instead of breaking the build.
 */
export function normalizeProgress(raw: unknown): Milestone[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Milestone[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const { title, status, note } = m as Record<string, unknown>;
    if (typeof title !== "string" || !title.trim()) continue;
    if (!STATUSES.includes(status as MilestoneStatus)) continue;
    out.push({
      title: title.trim(),
      status: status as MilestoneStatus,
      ...(typeof note === "string" && note.trim() ? { note: note.trim() } : {}),
    });
    if (out.length === MAX_MILESTONES) break;
  }
  return out.length ? out : undefined;
}

export function progressSummary(milestones: Milestone[]): { done: number; total: number } {
  return { done: milestones.filter((m) => m.status === "done").length, total: milestones.length };
}
