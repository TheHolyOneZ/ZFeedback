import { useMemo } from "react";
import { motion } from "motion/react";
import { Wordmark } from "../components/Wordmark";
import { Hero } from "../components/Hero";
import { CategoryRow } from "../components/CategoryRow";
import { categories } from "../lib/catalogue";
import type { Catalogue, Project } from "../lib/types";
import "./Storefront.css";


export function Storefront({
  play = true,
  catalogue,
  onOpen,
  onSeeAll,
}: {
  catalogue: Catalogue;
  onOpen: (p: Project) => void;
  onSeeAll: (category: string) => void;

  play?: boolean;
}) {
  const { featured, rows } = useMemo(() => {
    const cats = categories(catalogue);


    const day = Math.floor(Date.now() / 86_400_000);
    const pool = catalogue.projects;
    const featured = pool.length ? pool[day % pool.length] : null;

    const rows = cats.map((c) => ({
      name: c.name,
      projects: catalogue.projects.filter(
        (p) => (p.category ?? "Other") === c.name && p.slug !== featured?.slug,
      ),
    }));

    return { featured, rows };
  }, [catalogue]);

  return (
    <div className="storefront">
      <motion.header
        className="sf-head"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <Wordmark className="sf-title" text="Everything" accent="Z" accentAs="badge" delay={0.12} play={play} />
        <p className="sf-sub">
          <span className="num">{catalogue.count}</span> tools, all local-first, no
          accounts.
          {catalogue.stale && <span className="sf-stale"> · showing cached data</span>}
        </p>
      </motion.header>

      {featured && <Hero project={featured} onOpen={onOpen} />}

      {rows.map((r, i) =>
        r.projects.length ? (
          <CategoryRow
            key={r.name}
            name={r.name}
            projects={r.projects}
            index={i}
            onOpen={onOpen}
            onSeeAll={onSeeAll}
          />
        ) : null,
      )}
    </div>
  );
}
