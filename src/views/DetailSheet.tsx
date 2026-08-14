import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { IdentityMark } from "../components/IdentityMark";
import { identity } from "../lib/identity";
import { openExternal } from "../lib/catalogue";
import { linkKind } from "../lib/types";
import type { Project } from "../lib/types";
import { RatingPanel } from "../components/RatingPanel";
import { Scroll } from "../components/Scroll";
import "./DetailSheet.css";

export type FeedbackKind = "bug" | "feature";


export function DetailSheet({
  project,
  onClose,
  onFeedback,
  signedIn,
  ticketCounts,
}: {
  project: Project;
  onClose: () => void;
  onFeedback: (project: Project, kind: FeedbackKind) => void;
  signedIn: boolean;
  ticketCounts?: { open: number; shipped: number } | null;
}) {
  const id = identity(project.slug, project.title);
  const sheet = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    sheet.current?.focus();
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);


  const downloads = project.links.filter((l) => linkKind(l.label) === "download");
  const sources = project.links.filter((l) => linkKind(l.label) === "source");
  const docs = project.links.filter((l) => linkKind(l.label) === "docs");
  const others = project.links.filter((l) => linkKind(l.label) === "open");

  return (
    <motion.div
      className="dsheet-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        ref={sheet}
        tabIndex={-1}
        className="dsheet glass glass-strong"
        style={{
          ["--d-from" as string]: id.from,
          ["--d-to" as string]: id.to,
          ["--d-glow" as string]: id.glow,
        }}


        initial={{ opacity: 0, y: 28, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.985 }}
        transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.04 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
      >
        <div className="dsheet-wash" aria-hidden="true" />

        <button className="dsheet-close" onClick={onClose} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <Scroll className="dsheet-body">
          <header className="dsheet-head">
            <IdentityMark slug={project.slug} title={project.title} size={72} />
            <div className="dsheet-heading">
              {project.category && <span className="dsheet-cat">{project.category}</span>}
              <h2 className="dsheet-title selectable">{project.title}</h2>
              {ticketCounts && (
                <p className="dsheet-counts">
                  <span className="num">{ticketCounts.open}</span> open ·{" "}
                  <span className="num">{ticketCounts.shipped}</span> shipped
                </p>
              )}
            </div>
          </header>

          <p className="dsheet-desc selectable">{project.description}</p>

          <section className="dsheet-section">
            <h3 className="dsheet-label">Get it</h3>
            <div className="dsheet-links">
              {downloads.map((l) => (
                <button
                  key={l.url}
                  className="dbtn dbtn--primary"
                  onClick={() => openExternal(l.url)}
                >
                  <DownloadGlyph />
                  {l.label}
                </button>
              ))}
              {[...others, ...docs, ...sources].map((l) => (
                <button key={l.url} className="dbtn" onClick={() => openExternal(l.url)}>
                  {l.label}
                  <ExternalGlyph />
                </button>
              ))}
              {!project.links.length && project.url && (
                <button className="dbtn dbtn--primary" onClick={() => openExternal(project.url!)}>
                  Open website
                </button>
              )}
            </div>
            <p className="dsheet-note">Opens in your browser — never inside this app.</p>
          </section>


          <section className="dsheet-section dsheet-feedback">
            <h3 className="dsheet-label">Something wrong, or missing?</h3>
            <div className="dsheet-links">
              <button className="dbtn" onClick={() => onFeedback(project, "bug")}>
                Report a bug
              </button>
              <button className="dbtn" onClick={() => onFeedback(project, "feature")}>
                Request a feature
              </button>
            </div>
            <p className="dsheet-note">
              {signedIn
                ? "Goes straight to the developer. You get a reply, not a black hole."
                : "Sign in with Discord to file one — it takes about a minute."}
            </p>
          </section>


          {signedIn && <RatingPanel project={project.slug} projectTitle={project.title} />}
        </Scroll>
      </motion.div>
    </motion.div>
  );
}

function DownloadGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M6 1.5v6M3.2 5.8L6 8.6l2.8-2.8M2 10.5h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M3.5 1.5h5v5M8.5 1.5L4 6M6.5 8.5h-5v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
