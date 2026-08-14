import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "../lib/types";
import "./CategoryRow.css";


export function CategoryRow({
  name,
  projects,
  index,
  onOpen,
  onSeeAll,
}: {
  name: string;
  projects: Project[];
  index: number;
  onOpen: (p: Project) => void;
  onSeeAll: (category: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [overflows, setOverflows] = useState(false);


  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const update = () => {
      setAtStart(el.scrollLeft < 8);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);


      setOverflows(el.scrollWidth - el.clientWidth > 8);
    };
    update();

    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [projects.length]);

  const nudge = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <motion.section
      className="crow"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 26,


        delay: 0.14 + index * 0.06,
      }}
    >
      <header className="crow-head">
        <h3 className="crow-title">{name}</h3>
        <span className="crow-count num">{projects.length}</span>

        <div className="crow-controls">


          {overflows && (
            <>
              <button
                className="crow-nav"
                onClick={() => nudge(-1)}
                disabled={atStart}
                aria-label={`Scroll ${name} left`}
              >
                <Chevron dir="left" />
              </button>
              <button
                className="crow-nav"
                onClick={() => nudge(1)}
                disabled={atEnd}
                aria-label={`Scroll ${name} right`}
              >
                <Chevron dir="right" />
              </button>
            </>
          )}
          <button className="crow-all" onClick={() => onSeeAll(name)}>
            See all
          </button>
        </div>
      </header>

      <div className="crow-scroller" ref={scroller}>
        {projects.map((p) => (
          <div className="crow-item" key={p.slug}>
            <ProjectCard project={p} onOpen={onOpen} />
          </div>
        ))}
      </div>


      <div className={`crow-fade crow-fade--l${atStart ? "" : " on"}`} aria-hidden="true" />
      <div className={`crow-fade crow-fade--r${atEnd ? "" : " on"}`} aria-hidden="true" />
    </motion.section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d={dir === "left" ? "M7.5 2L4 6l3.5 4" : "M4.5 2L8 6l-3.5 4"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
