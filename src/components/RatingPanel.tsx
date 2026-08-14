import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { myRating, submitRating, STAR_LABEL } from "../lib/ratings";
import type { RatingSummary } from "../lib/ratings";
import { parseError } from "../lib/tickets";
import "./RatingPanel.css";


export function RatingPanel({
  project,
  projectTitle,
}: {

  project: string | null;
  projectTitle?: string;
}) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState<null | "stars" | "comment">(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);


  const [summary, setSummary] = useState<RatingSummary | null>(null);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    myRating(project)
      .then((r) => {
        if (!alive) return;
        setStars(r.rating?.stars ?? 0);
        setComment(r.rating?.comment ?? "");
        setSummary(r.summary ?? null);
        setLoaded(true);
      })
      .catch(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [project]);

  const save = async (nextStars: number, nextComment: string, what: "stars" | "comment") => {
    setBusy(true);
    setErr(null);
    try {
      const res = await submitRating(project, nextStars, nextComment.trim() || null);


      setSummary(res.summary ?? null);
      setSaved(what);
      setTimeout(() => setSaved(null), 2200);
    } catch (e) {
      setErr(parseError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const pick = (n: number) => {
    setStars(n);
    save(n, comment, "stars");
  };

  const shown = hover || stars;

  return (
    <section className="rp">
      <div className="rp-head">
        <h4 className="rp-title">
          {project ? `How is ${projectTitle ?? "it"}?` : "How is ZSync.eu overall?"}
        </h4>
        {saved && <motion.span className="rp-saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Saved</motion.span>}
      </div>

      <div className="rp-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`rp-star${n <= shown ? " on" : ""}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => pick(n)}
            disabled={busy || !loaded}
            aria-label={`${n} — ${STAR_LABEL[n]}`}
            aria-pressed={n === stars}
          >
            <Star filled={n <= shown} />
          </button>
        ))}


        <span className={`rp-label show${shown ? "" : " rp-label--idle"}`}>
          {shown ? STAR_LABEL[shown] : loaded ? "Pick a star" : ""}
        </span>
      </div>


      {stars > 0 && loaded && (
        <motion.div
          className="rp-note"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.22 }}
        >
          <textarea
            className="rp-input"
            rows={2}
            maxLength={500}
            value={comment}
            placeholder="Anything you'd add? Optional."
            onChange={(e) => setComment(e.target.value)}
            onBlur={() => comment.trim() !== "" && save(stars, comment, "comment")}
          />
          <p className="rp-hint">
            This is a rating, not a ticket — nobody replies to it. If you want an
            answer, file a bug or a feature request instead.
          </p>
        </motion.div>
      )}

      <Consensus summary={summary} rated={stars > 0} />

      {err && <p className="rp-err">{err}</p>}
    </section>
  );
}


function Consensus({ summary, rated }: { summary: RatingSummary | null; rated: boolean }) {
  if (!summary) return null;

  if (summary.avg !== null) {
    return (
      <p className="rp-avg">
        <strong className="num">{summary.avg.toFixed(1)}</strong>
        <span className="rp-avg-of">/ 5</span>
        <span className="rp-avg-n">
          from {summary.count} {summary.count === 1 ? "person" : "people"}
        </span>
      </p>
    );
  }

  if (summary.count > 0) {
    return (
      <p className="rp-avg rp-avg--few">
        {summary.count} {summary.count === 1 ? "rating" : "ratings"} so far — an
        average appears at {summary.min}.
      </p>
    );
  }

  return (
    <p className="rp-avg rp-avg--few">
      {rated ? "You're the first to rate this." : "Nobody has rated this yet."}
    </p>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2.6l2.2 4.9 5.3.5-4 3.5 1.2 5.2L10 14l-4.7 2.7 1.2-5.2-4-3.5 5.3-.5z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
