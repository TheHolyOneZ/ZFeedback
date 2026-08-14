import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { reportLinkFailure } from "./linkfallback";
import type { Catalogue } from "./types";


export function cachedCatalogue(): Promise<Catalogue | null> {
  return invoke<Catalogue | null>("catalogue_cached");
}


export function refreshCatalogue(): Promise<Catalogue> {
  return invoke<Catalogue>("catalogue_refresh");
}


export function onCatalogueUpdated(fn: (c: Catalogue) => void) {
  return listen<Catalogue>("catalogue:updated", (e) => fn(e.payload));
}


export function onCatalogueOffline(fn: (reason: string) => void) {
  return listen<string>("catalogue:offline", (e) => fn(e.payload));
}


export async function openExternal(url: string): Promise<boolean> {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    await openUrl(url);
    return true;
  } catch (err) {
    console.error("ZFeedback: openUrl failed", err);
    reportLinkFailure(url);
    return false;
  }
}


export function categories(c: Catalogue): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of c.projects) {
    const key = (p.category ?? "Other").trim() || "Other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
