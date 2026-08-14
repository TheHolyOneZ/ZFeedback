import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { onLinkFailure } from "../lib/linkfallback";
import "./LinkFallback.css";


export function LinkFallback() {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onLinkFailure((u) => {
      setCopied(false);
      setUrl(u);
    });
    return () => onLinkFailure(null);
  }, []);

  useEffect(() => {
    if (!url) return;
    field.current?.focus();
    field.current?.select();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUrl(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url]);

  const copy = async () => {
    const el = field.current;
    if (!el) return;
    el.focus();
    el.select();

    try {
      await navigator.clipboard.writeText(el.value);
      setCopied(true);
      return;
    } catch {

    }

    try {
      if (document.execCommand("copy")) setCopied(true);
    } catch {


    }
  };

  return (
    <AnimatePresence>
      {url && (
        <motion.div
          className="lf-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={() => setUrl(null)}
        >
          <motion.div
            className="lf-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lf-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="lf-title" id="lf-title">
              Couldn’t open your browser
            </h2>
            <p className="lf-body">
              Your system didn’t hand the link to a browser. On Linux that
              usually means <code className="lf-code">xdg-utils</code> isn’t
              installed. Open this address yourself to carry on:
            </p>

            <div className="lf-row">
              <input
                ref={field}
                className="lf-url mono selectable"
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                spellCheck={false}
              />
              <button className="lf-copy" onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>


            <p className="lf-hint">The address is selected — Ctrl+C copies it too.</p>

            <div className="lf-actions">
              <button className="lf-done" onClick={() => setUrl(null)}>
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
