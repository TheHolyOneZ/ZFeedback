import { motion } from "motion/react";
import { IdentityMark } from "./IdentityMark";
import { identity } from "../lib/identity";
import { openExternal } from "../lib/catalogue";
import { linkKind, primaryLink, secondaryLinks } from "../lib/types";
import type { Project } from "../lib/types";
import "./Hero.css";


export function Hero({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (p: Project) => void;
}) {
  const id = identity(project.slug, project.title);
  const primary = primaryLink(project);
  const secondary = secondaryLinks(project);

  return (
    <motion.section
      className="hero glass"
      style={{
        ["--hero-from" as string]: id.from,
        ["--hero-to" as string]: id.to,
        ["--hero-glow" as string]: id.glow,
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 24 }}
    >


      <div className="hero-wash" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-mark">
          <IdentityMark slug={project.slug} title={project.title} size={84} />
        </div>

        <div className="hero-text">
          <span className="hero-eyebrow">
            Featured{project.category ? ` · ${project.category}` : ""}
          </span>
          <h2 className="hero-title">{project.title}</h2>
          <p className="hero-desc">{project.description}</p>

          <div className="hero-actions">


            {primary && (
              <button
                className={
                  "hero-btn" +
                  (linkKind(primary.label) === "download"
                    ? " hero-btn--primary"
                    : linkKind(primary.label) === "open"
                      ? " hero-btn--open"
                      : "")
                }
                onClick={() => openExternal(primary.url)}
              >
                {primary.label}
              </button>
            )}
            {secondary.slice(0, 2).map((l) => (
              <button
                key={l.url}
                className="hero-btn hero-btn--ghost"
                onClick={() => openExternal(l.url)}
              >
                {l.label}
              </button>
            ))}
            <button className="hero-btn hero-btn--ghost" onClick={() => onOpen(project)}>
              Details
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
