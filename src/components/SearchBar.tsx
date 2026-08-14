import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import "./SearchBar.css";


export function SearchBar({
  query,
  onQuery,
  categories,
  active,
  onCategory,
  resultCount,
  filtering,
  account,
  tab = "apps",
  onTab,
}: {
  query: string;
  onQuery: (q: string) => void;
  categories: { name: string; count: number }[];
  active: string | null;
  onCategory: (c: string | null) => void;
  resultCount: number;
  filtering: boolean;

  account?: React.ReactNode;
  tab?: "apps" | "wanted";

  onTab?: (t: "apps" | "wanted") => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const wanted = tab === "wanted";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {


      const el = document.activeElement as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);

      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") ||
          (e.key === "/" && !typing)) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
        return;
      }

      if (e.key === "Escape") {
        if (query) onQuery("");
        else if (active) onCategory(null);
        input.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query, active, onQuery, onCategory]);

  return (
    <div className="searchbar">
      <div className="sb-row">
        {onTab && (
          <div className="sb-tabs" role="tablist" aria-label="What to browse">
            {(["apps", "wanted"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`sb-tab${tab === t ? " on" : ""}`}
                onClick={() => onTab(t)}
              >


                {tab === t && (
                  <motion.span
                    className="sb-tab-bg"
                    layoutId="tab-bg"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="sb-tab-label">
                  {t === "apps" ? "Apps" : "Wanted"}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="sb-field glass">
          <SearchGlyph />
          <input
            ref={input}
            type="text"
            className="sb-input"
            placeholder={wanted ? "Search requests…" : "Search tools…"}
            value={query}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => onQuery(e.target.value)}
            aria-label={wanted ? "Search the requests" : "Search the catalogue"}
          />
          {query ? (
            <button className="sb-clear" onClick={() => onQuery("")} aria-label="Clear search">
              <ClearGlyph />
            </button>
          ) : (
            <kbd className="sb-kbd mono">Ctrl K</kbd>
          )}
        </div>

        {account && <div className="sb-account">{account}</div>}
      </div>


      {!wanted && (
        <div className="sb-chips">
          <Chip label="All" active={!active} onClick={() => onCategory(null)} />
          {categories.map((c) => (
            <Chip
              key={c.name}
              label={c.name}
              count={c.count}
              active={active === c.name}
              onClick={() => onCategory(active === c.name ? null : c.name)}
            />
          ))}
        </div>
      )}

      {filtering && (
        <motion.div
          className="sb-count"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <span className="num">{resultCount}</span>{" "}
          {wanted
            ? resultCount === 1 ? "request" : "requests"
            : resultCount === 1 ? "result" : "results"}
          {query && <> for “{query}”</>}
        </motion.div>
      )}
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`sb-chip${active ? " on" : ""}`} onClick={onClick}>
      {label}
      {count !== undefined && <span className="sb-chip-n num">{count}</span>}


      {active && (
        <motion.span
          className="sb-chip-bg"
          layoutId="chip-bg"
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
        />
      )}
    </button>
  );
}

function SearchGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" className="sb-glyph">
      <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ClearGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M3 3l6 6M9 3l-6 6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
