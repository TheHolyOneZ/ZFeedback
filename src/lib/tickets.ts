import { invoke } from "@tauri-apps/api/core";


export type TicketType = "bug" | "feature" | "app_request";

export type TicketStatus =
  | "new" | "open" | "planned" | "in_progress"
  | "shipped" | "declined" | "duplicate" | "closed"

  | "withdrawn";

export type WaitingOn = "none" | "user" | "staff";

export type TicketSummary = {
  ref: string;
  type: TicketType;
  title: string;
  status: TicketStatus;
  waiting_on: WaitingOn;
  project: string | null;
  project_title: string | null;
  votes: number;
  shipped_in: string | null;
  created_at: string;
  updated_at: string;
  unread: number;

  needs_reply: boolean;

  is_public: boolean;

  edited_at: string | null;
  withdrawn_reason: string | null;
};

export type TicketMessage = {
  id: number;
  author: "user" | "staff" | "system";
  author_name: string | null;
  body: string;

  is_info_request: boolean;
  created_at: string;
};

export type TicketDetail = TicketSummary & {
  body: string;
  priority: string;
  context: {
    app_version: string | null;
    os: string | null;
    arch: string | null;
    locale: string | null;
  };
  messages: TicketMessage[];
  voted?: boolean;


  can_edit: boolean;

  attachments: import("./attachments").Attachment[];

  edit_blocked: string | null;
  can_withdraw: boolean;
};

export type TicketContext = {
  app_version: string;
  os: string;
  arch: string;
  locale: string;
};


export type ServerProject = {
  id: number;
  slug: string;
  title: string;
  category: string;
  url: string | null;
  open: number;
  shipped: number;
};


export type ApiError = { code: string; message: string };

export function parseError(e: unknown): ApiError {
  const s = String(e);
  const at = s.indexOf(": ");
  if (at > 0 && !s.slice(0, at).includes(" ")) {
    return { code: s.slice(0, at), message: s.slice(at + 2) };
  }
  return { code: "error", message: s };
}


export function cooldownSeconds(message: string): number | null {
  const sec = message.match(/(\d+)\s*more seconds?/i);
  if (sec) return parseInt(sec[1], 10);
  const min = message.match(/(\d+)\s*more minutes?/i);
  if (min) return parseInt(min[1], 10) * 60;
  return null;
}


export function ticketContext(): Promise<TicketContext> {
  return invoke<TicketContext>("ticket_context", {

    locale: typeof navigator !== "undefined" ? navigator.language : null,
  });
}

export function createTicket(input: {
  kind: TicketType;
  project: string | null;
  title: string;
  body: string;
  context: TicketContext;

  isPublic?: boolean;
}): Promise<{ ticket: TicketSummary }> {
  return invoke("ticket_create", {
    kind: input.kind,
    project: input.project,
    title: input.title,
    body: input.body,
    context: input.context,
    isPublic: input.isPublic ?? false,
  });
}

export function myTickets(
  page = 1,
  opts: { filter?: string; kind?: TicketType | ""; q?: string } = {},
): Promise<{
  tickets: TicketSummary[];
  page: number;
  total: number;
  has_more: boolean;
}> {
  return invoke("tickets_mine", {
    page,
    filter: opts.filter || null,
    kind: opts.kind || null,
    q: opts.q?.trim() || null,
  });
}


export function withdrawTicket(
  reference: string,
  reason?: string,
): Promise<{ ticket: TicketSummary }> {
  return invoke("ticket_withdraw", { reference, reason: reason?.trim() || null });
}


export function editTicket(
  reference: string,
  title: string,
  body: string,
): Promise<{ ticket: TicketDetail }> {
  return invoke("ticket_edit", { reference, title, body });
}


export function publishTicket(
  reference: string,
  isPublic: boolean,
): Promise<{ ticket: TicketSummary }> {
  return invoke("ticket_publish", { reference, public: isPublic });
}

export function getTicket(reference: string): Promise<{ ticket: TicketDetail }> {
  return invoke("ticket_get", { reference });
}

export function replyToTicket(reference: string, body: string): Promise<{ ticket: TicketDetail }> {
  return invoke("ticket_reply", { reference, body });
}

export function voteTicket(reference: string): Promise<{ ref: string; voted: boolean; votes: number }> {
  return invoke("ticket_vote", { reference });
}

export type SimilarTicket = {
  ref: string;
  type: TicketType;
  title: string;
  status: TicketStatus;
  votes: number;
  voted: boolean;
  shipped_in: string | null;
  project: string | null;
};


export function similarTickets(q: string, kind: TicketType, project: string | null): Promise<{
  tickets: SimilarTicket[];
}> {
  return invoke("tickets_similar", { q, kind, project });
}

export function serverProjects(): Promise<{ projects: ServerProject[]; count: number }> {
  return invoke("ticket_projects");
}

export function feedUpdates(since?: string): Promise<{
  now: string;
  changed: { ref: string; status: TicketStatus; waiting_on: WaitingOn; needs_reply: boolean; unread: number }[];
  counts: { needs_reply: number; unread: number };
}> {
  return invoke("feed_updates", { since: since ?? null });
}


export const TYPE_LABEL: Record<TicketType, string> = {
  bug: "Bug",
  feature: "Feature request",
  app_request: "App request",
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  new: "New",
  open: "Open",
  planned: "Planned",
  in_progress: "In progress",
  shipped: "Shipped",
  declined: "Not planned",
  duplicate: "Duplicate",
  closed: "Closed",

  withdrawn: "Withdrawn",
};

export function relativeTime(iso: string): string {
  const t = Date.parse(iso.replace(" ", "T"));
  if (Number.isNaN(t)) return "";
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(t).toLocaleDateString();
}
