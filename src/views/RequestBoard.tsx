import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { publicRequests, SORT_LABEL } from "../lib/requests";
import type { PublicRequest, RequestSort } from "../lib/requests";
import { parseError, publishTicket, relativeTime, STATUS_LABEL, voteTicket } from "../lib/tickets";
import { KIND_META, KindGlyph } from "../lib/kinds";
import { Scroll } from "../components/Scroll";
import "./RequestBoard.css";


const SETTLED = new Set<PublicRequest["status"]>(["shipped", "declined", "duplicate", "closed"]);


function settledReason(status: PublicRequest["status"]): string {
  switch (status) {
    case "shipped":   return "Already built";
    case "declined":  return "Not planned — voting is closed";
    case "duplicate": return "Merged into another request";
    default:          return "Closed — voting has ended";
  }
}


export function RequestBoard({
  onRequest,
  query = "",
  onCount,
}: {
  onRequest: () => void;

  query?: string;

  onCount?: (n: number) => void;
}) {
  const [sort, setSort] = useState<RequestSort>("top");
  const [list, setList] = useState<PublicRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);


  const [openRef, setOpenRef] = useState<string | null>(null);
  const open = openRef ? (list?.find((x) => x.ref === openRef) ?? null) : null;


  const term = query.trim();
  const [debounced, setDebounced] = useState(term);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 180);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    let alive = true;
    setList(null);
    publicRequests(sort, debounced || undefined)
      .then((r) => {
        if (!alive) return;
        setList(r.requests);
        onCount?.(r.requests.length);
      })
      .catch((e) => alive && setError(parseError(e).message));
    return () => {
      alive = false;
    };


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, debounced]);


  const vote = async (r: PublicRequest) => {
    if (busy || SETTLED.has(r.status)) return;
    setBusy(r.ref);
    const before = { voted: r.voted, votes: r.votes };
    const optimistic = { voted: !r.voted, votes: r.votes + (r.voted ? -1 : 1) };
    setList((cur) => cur && cur.map((x) => (x.ref === r.ref ? { ...x, ...optimistic } : x)));

    try {
      const res = await voteTicket(r.ref);
      setList((cur) =>
        cur && cur.map((x) => (x.ref === r.ref ? { ...x, voted: res.voted, votes: res.votes } : x)),
      );
    } catch (e) {
      setList((cur) => cur && cur.map((x) => (x.ref === r.ref ? { ...x, ...before } : x)));
      setError(parseError(e).message);
    } finally {
      setBusy(null);
    }
  };


  const unpublish = async (r: PublicRequest) => {
    if (busy) return;
    setBusy(r.ref);
    try {
      await publishTicket(r.ref, false);
      setOpenRef(null);
      setList((cur) => {
        const next = cur ? cur.filter((x) => x.ref !== r.ref) : cur;
        onCount?.(next?.length ?? 0);
        return next;
      });
    } catch (e) {
      setError(parseError(e).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rb" style={{ ["--kind-hsl" as string]: KIND_META.app_request.tint }}>
      <header className="rb-head">
        <div className="rb-intro">
          <h2 className="rb-title">Wanted</h2>
          <p className="rb-sub">
            Tools that don't exist yet. Vote for what you'd use — the most-wanted
            ones get built.
          </p>
        </div>
        <button className="rb-new" onClick={onRequest}>
          <KindGlyph kind="app_request" />
          Request a tool
        </button>
      </header>

      <div className="rb-sorts" role="tablist">
        {(["top", "new", "shipped", "mine"] as RequestSort[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={sort === s}
            className={`rb-sort${sort === s ? " on" : ""}`}
            onClick={() => setSort(s)}
          >
            {sort === s && (
              <motion.span className="rb-sort-bg" layoutId="rb-sort-bg"
                           transition={{ type: "spring", stiffness: 520, damping: 42 }} />
            )}
            <span className="rb-sort-label">{SORT_LABEL[s]}</span>
          </button>
        ))}
      </div>

      {error && <p className="rb-err">{error}</p>}

      {!list ? (
        <div className="rb-grid">
          {[0, 1, 2, 3].map((i) => <div key={i} className="rb-sk" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyBoard sort={sort} query={debounced} onRequest={onRequest} />
      ) : (


        <div className={`rb-grid${list.length < 3 ? " few" : ""}`}>
          {list.map((r, i) => (
            <motion.article
              key={r.ref}
              className={
                `rb-card` +
                (r.status === "shipped" ? " shipped" : "") +
                (SETTLED.has(r.status) && r.status !== "shipped" ? " settled" : "")
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.28 }}
            >
              <button
                className={`rb-vote${r.voted ? " on" : ""}`}
                onClick={() => vote(r)}
                disabled={busy === r.ref || SETTLED.has(r.status)}
                aria-pressed={r.voted}
                title={
                  SETTLED.has(r.status)
                    ? settledReason(r.status)
                    : r.voted
                      ? "Remove your vote"
                      : "I'd use this"
                }
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M6 2.5 10 8H2z" fill={r.voted ? "currentColor" : "none"}
                        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                <span className="num">{r.votes}</span>
              </button>

              <button
                className="rb-body"
                onClick={() => setOpenRef(r.ref)}
                aria-label={`Open ${r.title}`}
              >
                <h3 className="rb-card-title">{r.title}</h3>
                <p className="rb-card-text">{r.body}</p>
                <p className="rb-meta">
                  {r.status !== "new" && r.status !== "open" && (
                    <span className={`rb-status s-${r.status}`}>
                      {STATUS_LABEL[r.status]}
                      {r.shipped_in ? ` ${r.shipped_in}` : ""}
                    </span>
                  )}


                  {r.mine && <span className="rb-mine">Yours</span>}
                  <span>{r.author}</span>
                  <span>{relativeTime(r.created_at)}</span>
                </p>
              </button>
            </motion.article>
          ))}


          {list.length < 4 && sort !== "shipped" && (
            <button className="rb-prompt" onClick={onRequest}>
              <KindGlyph kind="app_request" />
              <span className="rb-prompt-title">Something missing?</span>
              <span className="rb-prompt-sub">
                Describe a tool you wish existed. If enough people want it, it
                gets built.
              </span>
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <RequestSheet
            request={open}
            busy={busy === open.ref}
            onVote={() => vote(open)}
            onUnpublish={() => unpublish(open)}
            onClose={() => setOpenRef(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


function EmptyBoard({
  sort,
  query,
  onRequest,
}: {
  sort: RequestSort;
  query: string;
  onRequest: () => void;
}) {
  if (query) {
    return (
      <div className="rb-empty">
        <h3>No requests match “{query}”</h3>
        <p>
          Nobody has asked for this yet — which is a good reason to be the one
          who does.
        </p>
        <button className="rb-new" onClick={onRequest}>
          <KindGlyph kind="app_request" />
          Request it
        </button>
      </div>
    );
  }

  if (sort === "shipped") {
    return (
      <div className="rb-empty">
        <h3>Nothing built from here yet</h3>
        <p>
          When a request gets made, it moves to this tab with the version it
          shipped in. Most wanted is where things are queuing up.
        </p>
      </div>
    );
  }

  if (sort === "mine") {
    return (
      <div className="rb-empty">
        <h3>You haven't published a request</h3>
        <p>
          App requests only appear here if you chose to publish them when filing.
          Private ones stay in My tickets.
        </p>
        <button className="rb-new" onClick={onRequest}>
          <KindGlyph kind="app_request" />
          Request a tool
        </button>
      </div>
    );
  }

  return (
    <div className="rb-empty">
      <h3>Nothing here yet</h3>
      <p>Be the first — describe a tool you wish existed and others can vote for it.</p>
      <button className="rb-new" onClick={onRequest}>
        <KindGlyph kind="app_request" />
        Request a tool
      </button>
    </div>
  );
}

/**
 * One request in full.
 *
 * The board clamps every description to three lines so the grid stays scannable,
 * which means a longer pitch is unreadable without this. The body arrives with
 * the list, so opening it costs no round trip.
 */
function RequestSheet({
  request: r,
  busy,
  onVote,
  onUnpublish,
  onClose,
}: {
  request: PublicRequest;
  busy: boolean;
  onVote: () => void;
  onUnpublish: () => void;
  onClose: () => void;
}) {
  /* Un-publishing is confirmed in place rather than with a window.confirm.
     It is reversible in principle but not from this screen — the request leaves
     the board and the only way back is through My tickets — so it is worth one
     deliberate second. */
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="rs-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        className="rs glass glass-strong"
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.985 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={r.title}
      >
        <header className="rs-head">
          <span className="rs-ref mono">{r.ref}</span>
          {r.mine && <span className="rb-mine rs-mine">Yours</span>}
          <button className="rs-close" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <Scroll className="rs-body">
          <h3 className="rs-title">{r.title}</h3>
          <p className="rs-meta">
            <span>{r.author}</span>
            <span>{relativeTime(r.created_at)}</span>
            {r.status !== "new" && r.status !== "open" && (
              <span className={`rb-status s-${r.status}`}>
                {STATUS_LABEL[r.status]}
                {r.shipped_in ? ` ${r.shipped_in}` : ""}
              </span>
            )}
          </p>

          <p className="rs-text selectable">{r.body}</p>

          {/* Yours: what you can do about it.
              Editing lives in My tickets rather than here — the edit window is
              short and tied to the full ticket, and duplicating that form on a
              public board would be a second place for the same rule to drift. */}
          {r.mine && (
            <div className="rs-own">
              {confirming ? (
                <>
                  <p className="rs-own-ask">
                    Take this off the board? It stays in My tickets with its
                    votes — it just stops being listed publicly.
                  </p>
                  <div className="rs-own-acts">
                    <button className="rs-own-btn danger" onClick={onUnpublish} disabled={busy}>
                      {busy ? "Removing…" : "Yes, unlist it"}
                    </button>
                    <button className="rs-own-btn" onClick={() => setConfirming(false)}>
                      Keep it listed
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="rs-own-note">
                    You published this{r.edited_at ? " · edited" : ""}
                  </span>
                  <button className="rs-own-btn" onClick={() => setConfirming(true)}>
                    Take it off the board
                  </button>
                </>
              )}
            </div>
          )}
        </Scroll>

        <footer className="rs-foot">
          <button
            className={`rb-vote rs-vote${r.voted ? " on" : ""}`}
            onClick={onVote}
            disabled={busy || SETTLED.has(r.status)}
            aria-pressed={r.voted}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M6 2.5 10 8H2z" fill={r.voted ? "currentColor" : "none"}
                    stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <span className="num">{r.votes}</span>
          </button>
          <span className="rs-vote-label">
            {SETTLED.has(r.status)
              ? settledReason(r.status)
              : r.voted
                ? "You want this"
                : "I'd use this too"}
          </span>
        </footer>
      </motion.div>
    </motion.div>
  );
}
