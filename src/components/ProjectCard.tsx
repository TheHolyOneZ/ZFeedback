import { motion } from "motion/react";
import { IdentityMark } from "./IdentityMark";
import { openExternal } from "../lib/catalogue";
import { linkKind, primaryLink, secondaryLinks } from "../lib/types";
import type { Project } from "../lib/types";
import "./ProjectCard.css";


export function ProjectCard({
  project,
  onOpen,
  compact = false,
}: {
  project: Project;
  onOpen: (p: Project) => void;
  compact?: boolean;
}) {
  const primary = primaryLink(project);
  const secondary = secondaryLinks(project);

  return (
    <motion.article
      className={`pcard glass${compact ? " pcard--compact" : ""}`}
      onClick={() => onOpen(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(project);
        }
      }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="pcard-head">
        <IdentityMark slug={project.slug} title={project.title} size={compact ? 40 : 48} />
        <div className="pcard-heading">
          <h3 className="pcard-title">{project.title}</h3>
          {project.category && <span className="pcard-cat">{project.category}</span>}
        </div>
      </div>

      <p className="pcard-desc">{project.description}</p>

      {!compact && (
        <div className="pcard-actions" onClick={(e) => e.stopPropagation()}>
          {primary &&
            (() => {


              const kind = linkKind(primary.label);
              const tone =
                kind === "download" ? " pcard-btn--primary"
                : kind === "open"   ? " pcard-btn--open"
                : "";
              return (
                <button
                  className={`pcard-btn kind-${kind}${tone}`}
                  onClick={() => openExternal(primary.url)}
                >
                  {primary.label}
                </button>
              );
            })()}


          {secondary.slice(0, 3).map((l) => (
            <button
              key={l.url}
              className="pcard-icon"
              title={l.label}
              aria-label={l.label}
              onClick={() => openExternal(l.url)}
            >
              <LinkGlyph kind={linkKind(l.label)} />
            </button>
          ))}
        </div>
      )}
    </motion.article>
  );
}


function LinkGlyph({ kind }: { kind: ReturnType<typeof linkKind> }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      {kind === "source" && <path d="M5 9.5 2.5 7 5 4.5M9 4.5 11.5 7 9 9.5" {...common} />}
      {kind === "docs" && (
        <path d="M3.5 2.5h5l2 2v7h-7zM8.5 2.5v2h2M5 7.5h4M5 9.5h4" {...common} />
      )}
      {kind === "download" && <path d="M7 2.5v6M4.5 6.5 7 9l2.5-2.5M3 11.5h8" {...common} />}
      {kind === "open" && (
        <>
          <circle cx="7" cy="7" r="4.5" {...common} />
          <path d="M2.5 7h9M7 2.5c1.4 1.4 1.4 7.6 0 9M7 2.5c-1.4 1.4-1.4 7.6 0 9" {...common} />
        </>
      )}
    </svg>
  );
}
