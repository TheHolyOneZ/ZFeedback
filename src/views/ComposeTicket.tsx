import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  cooldownSeconds,
  createTicket,
  parseError,
  ticketContext,
} from "../lib/tickets";
import { KIND_META, KIND_ORDER, KindGlyph } from "../lib/kinds";
import type { ServerProject, SimilarTicket, TicketContext, TicketSummary, TicketType } from "../lib/tickets";
import { similarTickets, voteTicket } from "../lib/tickets";
import { ProjectPicker } from "../components/ProjectPicker";
import { Scroll } from "../components/Scroll";
import "./ComposeTicket.css";


export function ComposeTicket({
  projects,
  initialProject,
  kind: initialKind,
  onClose,
  onFiled,
}: {

  projects: ServerProject[];

  initialProject: string | null;
  kind: TicketType;
  onClose: () => void;
  onFiled: (t: TicketSummary) => void;
}) {
  const [kind, setKind] = useState<TicketType>(initialKind);
  const [slug, setSlug] = useState<string | null>(initialProject);
  const [matches, setMatches] = useState<SimilarTicket[]>([]);
  const [voting, setVoting] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctx, setCtx] = useState<TicketContext | null>(null);
  const [showCtx, setShowCtx] = useState(false);


  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ code: string; message: string } | null>(null);
  const [cooldown, setCooldown] = useState<number | null>(null);

  useEffect(() => {
    ticketContext().then(setCtx).catch(() => setCtx(null));
  }, []);


  useEffect(() => {
    if (cooldown === null || cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c && c > 1 ? c - 1 : null)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const needsProject = kind !== "app_request";
  const chosen = useMemo(() => projects.find((p) => p.slug === slug) ?? null, [projects, slug]);


  useEffect(() => {
    const q = title.trim();
    if (q.length < 3) {
      setMatches([]);
      return;
    }
    let alive = true;
    const t = setTimeout(() => {
      similarTickets(q, kind, needsProject ? slug : null)
        .then((r) => alive && setMatches(r.tickets))
        .catch(() => alive && setMatches([]));
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [title, kind, slug, needsProject]);

  const upvote = async (ref: string) => {
    setVoting(ref);
    try {
      const r = await voteTicket(ref);
      setMatches((m) => m.map((x) => (x.ref === ref ? { ...x, voted: r.voted, votes: r.votes } : x)));
    } catch {

    } finally {
      setVoting(null);
    }
  };

  const titleOk = title.trim().length >= 4;
  const bodyOk = body.trim().length >= 10;
  const projectOk = !needsProject ? true : !!slug;
  const canSubmit = titleOk && bodyOk && projectOk && !busy && cooldown === null;

  const submit = async () => {
    if (!canSubmit || !ctx) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await createTicket({
        kind,
        project: needsProject ? slug : null,
        title: title.trim(),
        body: body.trim(),
        context: ctx,
        isPublic: kind === "app_request" && publish,
      });
      onFiled(res.ticket);
    } catch (e) {
      const parsed = parseError(e);
      setErr(parsed);
      if (parsed.code === "cooldown" || parsed.code === "rate_limited") {
        setCooldown(cooldownSeconds(parsed.message));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="cmp-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="cmp glass glass-strong"


        data-kind={kind}
        style={{ ["--kind-hsl" as string]: KIND_META[kind].tint }}
        initial={{ opacity: 0, y: 26, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.985 }}
        transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.04 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="File a ticket"
      >
        <header className="cmp-head">
          <h2 className="cmp-title">
            {chosen && needsProject ? `About ${chosen.title}` : "New request"}
          </h2>
          <button className="cmp-close" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <Scroll className="cmp-body">


          <div className="cmp-types" role="tablist" aria-label="Request type">
            {KIND_ORDER.map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={kind === k}
                className={`cmp-type${kind === k ? " on" : ""}`}
                style={{ ["--seg-hsl" as string]: KIND_META[k].tint }}
                onClick={() => setKind(k)}
              >
                {kind === k && (
                  <motion.span
                    className="cmp-type-bg"
                    layoutId="cmp-type-bg"
                    transition={{ type: "spring", stiffness: 520, damping: 42 }}
                  />
                )}
                <span className="cmp-type-label">
                  <KindGlyph kind={k} />
                  {KIND_META[k].label}
                </span>
              </button>
            ))}
          </div>


          <motion.p
            key={kind}
            className="cmp-lead"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            {KIND_META[kind].lead}
          </motion.p>


          {needsProject && (
            <>
              <label className="cmp-label">Project</label>
              <ProjectPicker projects={projects} value={slug} onChange={setSlug} />
            </>
          )}

          <label className="cmp-label" htmlFor="cmp-title">Title</label>
          <input
            id="cmp-title"
            className="cmp-input"
            value={title}
            maxLength={160}
            placeholder={KIND_META[kind].titlePlaceholder}
            onChange={(e) => setTitle(e.target.value)}
          />


          {matches.length > 0 && (
            <div className="cmp-similar">
              <p className="cmp-similar-head">
                Already reported? Upvoting beats filing a second one.
              </p>
              {matches.map((m) => (
                <div key={m.ref} className="cmp-similar-row">
                  <span className="cmp-similar-title">
                    {m.title}
                    {m.status === "shipped" && (
                      <span className="cmp-similar-shipped">
                        shipped{m.shipped_in ? ` ${m.shipped_in}` : ""}
                      </span>
                    )}
                  </span>
                  <button
                    className={`cmp-upvote${m.voted ? " on" : ""}`}
                    onClick={() => upvote(m.ref)}
                    disabled={voting === m.ref || m.status === "shipped"}
                    title={m.voted ? "Remove your vote" : "Upvote this"}
                  >
                    ▲ <span className="num">{m.votes}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="cmp-label" htmlFor="cmp-body">Details</label>
          <textarea
            id="cmp-body"
            className="cmp-textarea"
            value={body}
            maxLength={20000}
            rows={7}
            placeholder={KIND_META[kind].bodyPlaceholder}
            onChange={(e) => setBody(e.target.value)}
          />
          {kind === "app_request" && (
            <label className="cmp-publish">
              <input
                type="checkbox"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
              />
              <span className="cmp-publish-box" />
              <span>
                <strong>Show this on the Wanted board</strong>
                <span className="cmp-publish-note">
                  Other people can read it and vote for it. Your title and
                  description become public — your Discord name is shown, nothing
                  else. Bug reports and feature requests are never published.
                </span>
              </span>
            </label>
          )}

          <p className="cmp-counter num">
            {body.trim().length < 10
              ? `${10 - body.trim().length} more characters`
              : `${body.length} / 20000`}
          </p>


          {kind !== "app_request" && (
            <div className="cmp-ctx">
              <button className="cmp-ctx-toggle" onClick={() => setShowCtx((s) => !s)}>
                <svg className={`cmp-caret${showCtx ? " open" : ""}`} width="12" height="12"
                     viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M4.75 3 7.75 6l-3 3" fill="none" stroke="currentColor"
                        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Attached automatically — {showCtx ? "hide" : "see exactly what"}
              </button>
              {showCtx && (
                <motion.pre
                  className="cmp-ctx-body mono selectable"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                >
{ctx
  ? `app_version : ${ctx.app_version}
os          : ${ctx.os}
arch        : ${ctx.arch}
locale      : ${ctx.locale}`
  : "loading…"}
                </motion.pre>
              )}
              <p className="cmp-ctx-note">
                That's everything. No identifiers, no usage data, nothing else.
              </p>
            </div>
          )}

          {err && (
            <div className={`cmp-err${err.code === "duplicate" ? " cmp-err--soft" : ""}`}>
              {cooldown !== null
                ? `Too soon — try again in ${cooldown}s.`
                : err.message}
            </div>
          )}
        </Scroll>

        <footer className="cmp-foot">
          <button className="cmp-btn" onClick={onClose}>Cancel</button>
          <button className="cmp-btn cmp-btn--primary" onClick={submit} disabled={!canSubmit}>
            {busy ? "Sending…" : cooldown !== null ? `Wait ${cooldown}s` : "Send"}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
