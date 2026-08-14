import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { KindGlyph } from "../lib/kinds";
import "./FirstRun.css";


const SEEN_KEY = "zf.intro.v1";

export function FirstRun() {
  const [show, setShow] = useState(false);

  useEffect(() => {


    let seen = true;
    try {
      seen = localStorage.getItem(SEEN_KEY) !== null;
    } catch {


    }
    if (seen) return;

    const t = setTimeout(() => setShow(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {

    }
  };

  if (!show) return null;

  return (
    <motion.aside
      className="fr glass glass-strong"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      role="note"
      aria-label="What ZFeedback is for"
    >
      <h2 className="fr-title">This is not just a download page</h2>

      <p className="fr-lede">
        Every tool here is made by one person. If something breaks, you can say
        so from inside this app — and get an answer back.
      </p>

      <ul className="fr-list">
        <li>
          <span className="fr-ico" style={{ ["--kind-hsl" as string]: "356 74% 62%" }}>
            <KindGlyph kind="bug" size={14} />
          </span>
          <span>
            <strong>Report a bug</strong> on any project, with your version and
            OS attached — shown to you before it is sent, never collected in the
            background.
          </span>
        </li>
        <li>
          <span className="fr-ico" style={{ ["--kind-hsl" as string]: "262 83% 62%" }}>
            <KindGlyph kind="feature" size={14} />
          </span>
          <span>
            <strong>Ask for a feature</strong> and follow it from planned to
            shipped.
          </span>
        </li>
        <li>
          <span className="fr-ico" style={{ ["--kind-hsl" as string]: "199 89% 58%" }}>
            <KindGlyph kind="app_request" size={14} />
          </span>
          <span>
            <strong>Request a tool that doesn't exist</strong> yet. The Wanted
            tab ranks them by votes, and the top ones get built.
          </span>
        </li>
      </ul>

      <p className="fr-foot">
        Replies arrive as a Discord DM and in <strong>My tickets</strong>.
      </p>

      <button className="fr-btn" onClick={dismiss}>
        Got it
      </button>
    </motion.aside>
  );
}
