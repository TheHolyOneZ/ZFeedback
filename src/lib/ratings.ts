import { invoke } from "@tauri-apps/api/core";


export type Rating = {
  stars: number;
  comment: string | null;
  updated_at: string;
};


export type RatingSummary = {
  count: number;
  avg: number | null;
  min: number;
};


export function submitRating(
  project: string | null,
  stars: number,
  comment: string | null,
): Promise<{ rating: Rating | null; created: boolean; summary: RatingSummary }> {
  return invoke("rating_submit", { project, stars, comment });
}

export function myRating(
  project: string | null,
): Promise<{ rating: Rating | null; summary: RatingSummary }> {
  return invoke("rating_mine", { project });
}


export const STAR_LABEL: Record<number, string> = {
  1: "Unusable",
  2: "Frustrating",
  3: "Does the job",
  4: "Good",
  5: "Excellent",
};
