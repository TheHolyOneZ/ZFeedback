import { motion } from "motion/react";
import { ProjectCard } from "../components/ProjectCard";
import type { Hit } from "../lib/search";
import type { Project } from "../lib/types";
import "./Grid.css";


export function Grid({
  hits,
  onOpen,
  query,
  category,
  onClear,
}: {
  hits: Hit[];
  onOpen: (p: Project) => void;
  query: string;
  category: string | null;
  onClear: () => void;
}) {
  if (!hits.length) {
    return <Empty query={query} category={category} onClear={onClear} />;
  }

  return (


    <div className="rgrid">
      {hits.map((h, i) => (
        <motion.div
          key={h.project.slug}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,


            delay: Math.min(i, 8) * 0.025,
          }}
        >
          <ProjectCard project={h.project} onOpen={onOpen} />
        </motion.div>
      ))}
    </div>
  );
}


function Empty({
  query,
  category,
  onClear,
}: {
  query: string;
  category: string | null;
  onClear: () => void;
}) {
  return (
    <motion.div
      className="rempty"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="rempty-mark" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24">
          <circle cx="10.5" cy="10.5" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M15.8 15.8L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <h2>Nothing matches that</h2>
      <p>
        {query && category ? (
          <>
            No {category} tool matches “{query}”. Try clearing the category filter.
          </>
        ) : query ? (
          <>Nothing in the catalogue matches “{query}”.</>
        ) : (
          <>Nothing in {category}.</>
        )}
      </p>
      <button className="hero-btn hero-btn--primary" onClick={onClear}>
        Show everything
      </button>
    </motion.div>
  );
}
