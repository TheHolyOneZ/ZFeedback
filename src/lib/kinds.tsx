import type { TicketType } from "./tickets";


export type KindMeta = {
  label: string;

  lead: string;
  titlePlaceholder: string;
  bodyPlaceholder: string;

  tint: string;
};

export const KIND_META: Record<TicketType, KindMeta> = {
  bug: {
    label: "Bug",
    lead: "Something is broken or behaving wrong. The more precisely you can describe it, the faster it gets fixed.",
    titlePlaceholder: "What went wrong, in one line",
    bodyPlaceholder: "What did you do, what happened, and what did you expect instead?",
    tint: "356 74% 62%",
  },
  feature: {
    label: "Feature request",
    lead: "An existing tool should do something it doesn't. Say what you're trying to get done, not just the button you want.",
    titlePlaceholder: "What should it do",
    bodyPlaceholder: "What are you trying to accomplish, and where does the tool stop short?",
    tint: "262 83% 62%",
  },
  app_request: {
    label: "App request",
    lead: "A tool that doesn't exist yet. Others can upvote it, and the most-wanted ones get built.",
    titlePlaceholder: "What tool should exist",
    bodyPlaceholder: "What would you use it for, and what do you use today instead?",
    tint: "199 89% 58%",
  },
};


export function KindGlyph({ kind, size = 14 }: { kind: TicketType; size?: number }) {
  const s = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {kind === "bug" && (
        <>
          <rect x="5" y="5.5" width="6" height="7.5" rx="3" {...s} />
          <path d="M6 4.2a2 2 0 0 1 4 0M2.6 7.2h2.5M10.9 7.2h2.5M2.9 11.2h2.2M10.9 11.2h2.2M8 5.5v7.5" {...s} />
        </>
      )}
      {kind === "feature" && (
        <path d="M8 2.2l1.5 3.6 3.9.3-3 2.5.95 3.8L8 10.4l-3.35 2 .95-3.8-3-2.5 3.9-.3z" {...s} />
      )}
      {kind === "app_request" && (
        <>
          <rect x="2.5" y="2.5" width="5" height="5" rx="1.4" {...s} />
          <rect x="2.5" y="8.5" width="5" height="5" rx="1.4" {...s} />
          <rect x="8.5" y="8.5" width="5" height="5" rx="1.4" {...s} />
          <path d="M11 2.5v5M8.5 5h5" {...s} />
        </>
      )}
    </svg>
  );
}

export const KIND_ORDER: TicketType[] = ["bug", "feature", "app_request"];
