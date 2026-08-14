import { invoke } from "@tauri-apps/api/core";
import type { TicketStatus } from "./tickets";


export type PublicRequest = {
  ref: string;
  title: string;
  body: string;
  votes: number;
  voted: boolean;
  status: TicketStatus;
  shipped_in: string | null;

  author: string;
  created_at: string;


  mine: boolean;
  edited_at: string | null;
};


export type RequestSort = "top" | "new" | "shipped" | "mine";

export function publicRequests(
  sort: RequestSort = "top",
  q?: string,
): Promise<{ requests: PublicRequest[]; count: number }> {


  const mine = sort === "mine";
  return invoke("public_requests", {
    sort: mine ? "new" : sort,
    q: q ?? null,
    mine,
  });
}

export const SORT_LABEL: Record<RequestSort, string> = {
  top: "Most wanted",
  new: "Newest",
  shipped: "Built",
  mine: "Yours",
};
