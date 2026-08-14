import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  editTicket,
  getTicket,
  myTickets,
  parseError,
  publishTicket,
  relativeTime,
  replyToTicket,
  STATUS_LABEL,
  TYPE_LABEL,
  withdrawTicket,
} from "../lib/tickets";
import type { TicketDetail, TicketStatus, TicketSummary, TicketType } from "../lib/tickets";
import { KIND_META, KindGlyph } from "../lib/kinds";
import { AttachmentPicker, AttachmentRow } from "../components/Attachments";
import type { Attachment } from "../lib/attachments";
import { openExternal } from "../lib/catalogue";
import { Scroll } from "../components/Scroll";
import "./MyTickets.css";


const FILTERS: { key: string; label: string }[] = [
  { key: "",            label: "All" },
  { key: "needs_reply", label: "Needs you" },
  { key: "open",        label: "Live" },
  { key: "closed",      label: "Finished" },
];

export function MyTickets({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<TicketSummary[] | null>(null);
  const [open, setOpen] = useState<TicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);


  const [filter, setFilter] = useState("");
  const [kind, setKind] = useState<TicketType | "">("");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [total, setTotal] = useState(0);
  const lastTick = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);


  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const timer = setInterval(bump, 60_000);
    window.addEventListener("focus", bump);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", bump);
    };
  }, []);

  useEffect(() => {
    let alive = true;


    if (tick === lastTick.current) {
      setList(null);
    }
    lastTick.current = tick;
    setError(null);
    myTickets(1, { filter, kind, q: debounced })
      .then((r) => {
        if (!alive) return;
        const sorted = [...r.tickets].sort((a, b) => {
          if (a.needs_reply !== b.needs_reply) return a.needs_reply ? -1 : 1;
          return b.updated_at.localeCompare(a.updated_at);
        });
        setList(sorted);
        setTotal(r.total);
      })
      .catch((e) => alive && setError(parseError(e).message));
    return () => {
      alive = false;
    };
  }, [filter, kind, debounced, tick]);

  const searching = debounced !== "" || filter !== "" || kind !== "";


  const syncRow = (t: TicketDetail) =>
    setList((cur) =>
      cur
        ? cur.map((row) =>
            row.ref === t.ref
              ? {
                  ...row,
                  status: t.status,
                  waiting_on: t.waiting_on,
                  needs_reply: t.needs_reply,
                  shipped_in: t.shipped_in,
                  votes: t.votes,
                  updated_at: t.updated_at,
                  is_public: t.is_public,
                  edited_at: t.edited_at,
                  withdrawn_reason: t.withdrawn_reason,
                  unread: 0,
                }
              : row,
          )
        : cur,
    );

  return (
    <motion.div
      className="mt-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="mt glass glass-strong"
        initial={{ opacity: 0, y: 26, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.985 }}
        transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.04 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="My tickets"
      >
        <header className="mt-head">
          {open ? (
            <button className="mt-back" onClick={() => setOpen(null)}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M7.25 3 4.25 6l3 3" fill="none" stroke="currentColor"
                      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All tickets
            </button>
          ) : (
            <h2 className="mt-title">My tickets</h2>
          )}
          <button className="mt-close" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <Scroll className="mt-body">
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <Thread ticket={open} onUpdated={(t) => { setOpen(t); syncRow(t); }} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <Filters
                  filter={filter}
                  onFilter={setFilter}
                  kind={kind}
                  onKind={setKind}
                  query={query}
                  onQuery={setQuery}
                  total={total}
                  active={searching}
                />

                {error ? (
                  <p className="mt-empty">{error}</p>
                ) : !list ? (
                  <div className="mt-skeletons">
                    {[0, 1, 2].map((i) => <div key={i} className="mt-sk" />)}
                  </div>
                ) : list.length === 0 ? (


                  searching ? (
                    <div className="mt-empty-state">
                      <h3>Nothing matches</h3>
                      <p>
                        No ticket of yours matches those filters.{" "}
                        <button
                          className="mt-clear-link"
                          onClick={() => { setFilter(""); setKind(""); setQuery(""); }}
                        >
                          Clear them
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div className="mt-empty-state">
                      <h3>Nothing filed yet</h3>
                      <p>
                        Open any project and use <strong>Report a bug</strong> or{" "}
                        <strong>Request a feature</strong>. You'll get a real reply here.
                      </p>
                    </div>
                  )
                ) : (
                  list.map((t) => (
                    <button
                      key={t.ref}
                      className={`mt-row${t.needs_reply ? " needs" : ""}`}
                      onClick={() =>
                        getTicket(t.ref)
                          .then((r) => {
                            setOpen(r.ticket);
                            syncRow(r.ticket);
                          })
                          .catch((e) => setError(parseError(e).message))
                      }
                    >


                      <span
                        className="mt-row-kind"
                        style={{ ["--kind-hsl" as string]: KIND_META[t.type].tint }}
                        title={TYPE_LABEL[t.type]}
                      >
                        <KindGlyph kind={t.type} size={15} />
                      </span>

                      <div className="mt-row-main">
                        <span className="mt-row-title">{t.title}</span>
                        <span className="mt-row-meta">
                          <span className="mono">{t.ref}</span>
                          {t.project_title ? ` · ${t.project_title}` : ""}
                          {" · "}
                          {relativeTime(t.updated_at)}
                        </span>
                      </div>

                      {t.unread > 0 && !t.needs_reply && (
                        <span className="mt-unread num" title={`${t.unread} new`}>{t.unread}</span>
                      )}
                      {t.needs_reply ? (
                        <span className="mt-flag">Needs your reply</span>
                      ) : (
                        <span className={`mt-status s-${t.status}`}>
                          {STATUS_LABEL[t.status]}
                          {t.shipped_in ? ` ${t.shipped_in}` : ""}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Scroll>
      </motion.div>
    </motion.div>
  );
}


function Filters({
  filter, onFilter, kind, onKind, query, onQuery, total, active,
}: {
  filter: string;
  onFilter: (v: string) => void;
  kind: TicketType | "";
  onKind: (v: TicketType | "") => void;
  query: string;
  onQuery: (v: string) => void;
  total: number;
  active: boolean;
}) {


  if (total < 5 && !active) return null;

  return (
    <div className="mtf">
      <div className="mtf-search">
        <svg width="13" height="13" viewBox="0 0 15 15" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          placeholder="Search your tickets…"
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onQuery(e.target.value)}
          aria-label="Search your tickets"
        />
        {query && (
          <button onClick={() => onQuery("")} aria-label="Clear search">
            <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="mtf-chips" role="group" aria-label="Filter by state">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`mtf-chip${filter === f.key ? " on" : ""}`}
            onClick={() => onFilter(f.key)}
            aria-pressed={filter === f.key}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mtf-chips" role="group" aria-label="Filter by type">
        {(["bug", "feature", "app_request"] as TicketType[]).map((k) => (
          <button
            key={k}
            className={`mtf-chip mtf-chip--kind${kind === k ? " on" : ""}`}
            style={{ ["--kind-hsl" as string]: KIND_META[k].tint }}
            onClick={() => onKind(kind === k ? "" : k)}
            aria-pressed={kind === k}
            title={TYPE_LABEL[k]}
          >
            <KindGlyph kind={k} size={13} />
            {TYPE_LABEL[k]}
          </button>
        ))}
      </div>
    </div>
  );
}


function Thread({
  ticket,
  onUpdated,
}: {
  ticket: TicketDetail;
  onUpdated: (t: TicketDetail) => void;
}) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);


  const [added, setAdded] = useState<Attachment[]>([]);
  const shots = [...(ticket.attachments ?? []), ...added];

  const send = async () => {
    if (reply.trim().length < 2 || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await replyToTicket(ticket.ref, reply.trim());
      setReply("");
      onUpdated(r.ticket);
    } catch (e) {
      setErr(parseError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const meta = KIND_META[ticket.type];

  return (
    <div className="th" style={{ ["--kind-hsl" as string]: meta.tint }}>
      <div className="th-head">
        <span className="th-kind">
          <KindGlyph kind={ticket.type} />
          {meta.label}
        </span>
        <span className="th-ref mono">{ticket.ref}</span>
        {ticket.project_title && <span className="th-proj">{ticket.project_title}</span>}
      </div>

      <h3 className="th-title">{ticket.title}</h3>

      <StatusTrack ticket={ticket} />


      <dl className="th-facts">
        <Fact label="Status">
          <span className={`mt-status s-${ticket.status}`}>{STATUS_LABEL[ticket.status]}</span>
        </Fact>
        {ticket.shipped_in && <Fact label="Shipped in"><span className="mono">{ticket.shipped_in}</span></Fact>}
        <Fact label="Priority">{ticket.priority || "normal"}</Fact>
        <Fact label="Filed">{relativeTime(ticket.created_at)}</Fact>
        <Fact label="Last update">{relativeTime(ticket.updated_at)}</Fact>
      </dl>

      {ticket.needs_reply && (
        <div className="th-banner">
          You were asked a question. Answering keeps this moving.
        </div>
      )}

      <div className="th-msg th-msg--own">
        <p className="th-msg-who">You · {relativeTime(ticket.created_at)}</p>
        <p className="th-msg-body selectable">{ticket.body}</p>

        <AttachmentRow items={shots.filter((a) => a.message_id === null)} />
      </div>

      {ticket.messages.map((m) => (
        <div
          key={m.id}
          className={
            m.is_info_request
              ? "th-msg th-msg--ask"
              : m.author === "staff"
                ? "th-msg th-msg--staff"
                : "th-msg th-msg--own"
          }
        >
          <p className="th-msg-who">
            {m.is_info_request && <span className="th-ask-tag">Question</span>}
            {m.author === "staff" ? (


              <button
                className="th-author"
                onClick={() => openExternal("https://github.com/TheHolyOneZ")}
                title="TheHolyOneZ on GitHub"
              >
                TheHolyOneZ
                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M3.5 1.5h5v5M8.5 1.5L4 6M6.5 8.5h-5v-5" fill="none"
                        stroke="currentColor" strokeWidth="1.1"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : m.author === "system" ? (
              "System"
            ) : (
              "You"
            )}
            {" · "}
            {relativeTime(m.created_at)}
          </p>
          <p className="th-msg-body selectable">{m.body}</p>
          <AttachmentRow items={shots.filter((a) => a.message_id === m.id)} />
        </div>
      ))}


      {!TERMINAL.includes(ticket.status) && (
        <div className="th-reply">
          <textarea
            className="th-input"
            rows={3}
            value={reply}
            maxLength={20000}
            placeholder={ticket.needs_reply ? "Answer the question…" : "Add something…"}
            onChange={(e) => setReply(e.target.value)}
          />


          <AttachmentPicker
            reference={ticket.ref}
            existing={shots}
            onAdded={(a) => setAdded((cur) => [...cur, a])}
          />
          {err && <p className="th-err">{err}</p>}
          <button
            className="cmp-btn cmp-btn--primary th-send"
            onClick={send}
            disabled={reply.trim().length < 2 || busy}
          >
            {busy ? "Sending…" : "Reply"}
          </button>
        </div>
      )}

      <OwnerActions ticket={ticket} onUpdated={onUpdated} />

      {ticket.context.app_version && (
        <details className="th-ctx">
          <summary>What you sent with this</summary>
          <pre className="mono selectable">
{`app_version : ${ticket.context.app_version ?? "—"}
os          : ${ticket.context.os ?? "—"}
arch        : ${ticket.context.arch ?? "—"}
locale      : ${ticket.context.locale ?? "—"}`}
          </pre>
        </details>
      )}
    </div>
  );
}


function OwnerActions({
  ticket,
  onUpdated,
}: {
  ticket: TicketDetail;
  onUpdated: (t: TicketDetail) => void;
}) {
  const [mode, setMode] = useState<null | "edit" | "withdraw">(null);
  const [title, setTitle] = useState(ticket.title);
  const [body, setBody] = useState(ticket.body);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canPublish = ticket.type === "app_request" && ticket.is_public;

  if (!ticket.can_edit && !ticket.can_withdraw && !canPublish) return null;

  const saveEdit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await editTicket(ticket.ref, title.trim(), body.trim());
      onUpdated(r.ticket);
      setMode(null);
    } catch (e) {
      setErr(parseError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const doWithdraw = async () => {
    setBusy(true);
    setErr(null);
    try {
      await withdrawTicket(ticket.ref, reason);


      const fresh = await getTicket(ticket.ref);
      onUpdated(fresh.ticket);
      setMode(null);
    } catch (e) {
      setErr(parseError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const unlist = async () => {
    setBusy(true);
    setErr(null);
    try {
      await publishTicket(ticket.ref, false);
      const fresh = await getTicket(ticket.ref);
      onUpdated(fresh.ticket);
    } catch (e) {
      setErr(parseError(e).message);
    } finally {
      setBusy(false);
    }
  };

  if (mode === "edit") {
    return (
      <div className="th-own th-own--form">
        <label className="th-own-lbl">Title</label>
        <input
          className="th-own-input"
          value={title}
          maxLength={160}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="th-own-lbl">Description</label>
        <textarea
          className="th-own-input th-own-area"
          rows={6}
          value={body}
          maxLength={8000}
          onChange={(e) => setBody(e.target.value)}
        />
        <p className="th-own-hint">
          Edits are stamped and shown on the ticket. The window closes as soon as
          anyone replies.
        </p>
        {err && <p className="th-err">{err}</p>}
        <div className="th-own-acts">
          <button
            className="cmp-btn cmp-btn--primary"
            onClick={saveEdit}
            disabled={busy || title.trim().length < 8 || body.trim().length < 20}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button className="th-own-btn" onClick={() => setMode(null)} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (mode === "withdraw") {
    return (
      <div className="th-own th-own--form">
        <p className="th-own-ask">
          Close this yourself? It stops appearing in the queue as something
          waiting on an answer. The thread stays, and you can be replied to if
          anyone reopens it.
        </p>
        <input
          className="th-own-input"
          value={reason}
          maxLength={255}
          placeholder="Why? Optional — e.g. “turned out to be my firewall”"
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="th-own-hint">
          If you worked out the cause, saying so here genuinely helps — it is the
          most useful thing in the whole ticket for the next person.
        </p>
        {err && <p className="th-err">{err}</p>}
        <div className="th-own-acts">
          <button className="th-own-btn danger" onClick={doWithdraw} disabled={busy}>
            {busy ? "Closing…" : "Yes, close it"}
          </button>
          <button className="th-own-btn" onClick={() => setMode(null)} disabled={busy}>
            Keep it open
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="th-own">
      <span className="th-own-note">
        {ticket.edited_at
          ? `Edited ${relativeTime(ticket.edited_at)}`
          : ticket.can_edit
            ? "You can still correct this"
            : ticket.edit_blocked ?? ""}
      </span>
      {ticket.can_edit && (
        <button className="th-own-btn" onClick={() => setMode("edit")}>Edit</button>
      )}
      {canPublish && (
        <button className="th-own-btn" onClick={unlist} disabled={busy}>
          {busy ? "…" : "Unlist from Wanted"}
        </button>
      )}
      {ticket.can_withdraw && (
        <button className="th-own-btn" onClick={() => setMode("withdraw")}>
          Close it myself
        </button>
      )}
      {err && <p className="th-err">{err}</p>}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="th-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}


const FLOW: TicketStatus[] = ["new", "open", "planned", "in_progress", "shipped"];


const TERMINAL: TicketStatus[] = ["shipped", "declined", "duplicate", "closed", "withdrawn"];

function StatusTrack({ ticket }: { ticket: TicketDetail }) {
  const off = !FLOW.includes(ticket.status);

  if (off) {
    return (
      <div className={`th-track th-track--off s-${ticket.status}`}>
        <span className="th-track-dot" />
        <span className="th-track-off-label">
          {STATUS_LABEL[ticket.status]}
          {ticket.status === "declined" && " — this won't be built. Any reply below explains why."}
          {ticket.status === "duplicate" && " — the same thing is tracked on another ticket."}
          {ticket.status === "closed" && " — no longer being worked on."}


          {ticket.status === "withdrawn" &&
            (ticket.withdrawn_reason
              ? ` — you closed this: “${ticket.withdrawn_reason}”`
              : " — you closed this yourself.")}
        </span>
      </div>
    );
  }

  const at = FLOW.indexOf(ticket.status);
  return (
    <ol className="th-track" aria-label={`Status: ${STATUS_LABEL[ticket.status]}`}>
      {FLOW.map((s, i) => (
        <li
          key={s}
          className={`th-step${i < at ? " done" : ""}${i === at ? " now" : ""}`}
          aria-current={i === at ? "step" : undefined}
        >
          <span className="th-step-mark" />
          <span className="th-step-label">{STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}
