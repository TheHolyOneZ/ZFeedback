import { useEffect, useMemo, useRef, useState } from "react";
import { IdentityMark } from "./IdentityMark";
import type { ServerProject } from "../lib/tickets";
import { Scroll } from "./Scroll";
import "./ProjectPicker.css";


export function ProjectPicker({
  projects,
  value,
  onChange,
  disabled,
}: {
  projects: ServerProject[];
  value: string | null;
  onChange: (slug: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = projects.find((p) => p.slug === value) ?? null;

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pool = needle
      ? projects.filter(
          (p) =>
            p.title.toLowerCase().includes(needle) ||
            p.category.toLowerCase().includes(needle),
        )
      : projects;


    return [...pool].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 60);
  }, [projects, q]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);


  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = (slug: string) => {
    onChange(slug);
    setOpen(false);
    setQ("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[active];
      if (pick) choose(pick.slug);
    } else if (e.key === "Escape") {
      e.preventDefault();

      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="pp" ref={boxRef}>
      <button
        type="button"
        className={`pp-trigger${open ? " open" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <IdentityMark slug={selected.slug} title={selected.title} size={24} />
            <span className="pp-trigger-name">{selected.title}</span>
            <span className="pp-trigger-cat">{selected.category}</span>
          </>
        ) : (
          <span className="pp-trigger-empty">Choose a project…</span>
        )}
        <svg className="pp-caret" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.75 6 7.75l3-3" fill="none" stroke="currentColor"
                strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="pp-pop glass glass-strong" role="listbox">
          <input
            ref={inputRef}
            className="pp-search"
            value={q}
            placeholder="Filter projects…"
            spellCheck={false}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            aria-label="Filter projects"
          />

          <Scroll className="pp-list">
            {results.length === 0 ? (
              <p className="pp-none">No project matches “{q}”.</p>
            ) : (
              results.map((p, i) => (
                <button
                  key={p.slug}
                  type="button"
                  role="option"
                  aria-selected={p.slug === value}
                  className={`pp-item${i === active ? " active" : ""}${
                    p.slug === value ? " chosen" : ""
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(p.slug)}
                >
                  <IdentityMark slug={p.slug} title={p.title} size={26} />
                  <span className="pp-item-main">
                    <span className="pp-item-name">{p.title}</span>
                    <span className="pp-item-meta">
                      {p.category}
                      {p.open > 0 && (
                        <>
                          {" · "}
                          <span className="num">{p.open}</span> open
                        </>
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </Scroll>
        </div>
      )}
    </div>
  );
}
