import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ActivitySnapshot } from "./types";

const EMPTY: ActivitySnapshot = { fetchedAt: null, repos: {} };

export async function loadActivity(): Promise<ActivitySnapshot> {
  try {
    const path = join(process.cwd(), "data", "activity.json");
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as ActivitySnapshot;
  } catch {
    return EMPTY;
  }
}

export function repoKey(owner: string, name: string): string {
  return `${owner}/${name}`;
}
