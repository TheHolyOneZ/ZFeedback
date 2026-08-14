import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import "./Tour.css";


export type TourStep = {
  id: string;

  target: string;
  title: string;
  body: string;

  before?: () => void;

  pad?: number;
};

const SEEN_KEY = "zf.tour.v1";

export function tourDone(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return true;
  }
}

export function markTourDone() {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {

  }
}

type Rect = { top: number; left: number; width: number; height: number };

export function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const raf = useRef(0);

  const step = steps[i];
  const last = i === steps.length - 1;


  const stepId = step?.id;
  const target = step?.target;
  const pad = step?.pad ?? 8;


  const before = useRef(step?.before);
  before.current = step?.before;

  const finish = useCallback(() => {
    markTourDone();
    onClose();
  }, [onClose]);


  const measure = useCallback(() => {
    if (!target) return;

    const read = () => {
      const el = document.querySelector<HTMLElement>(target);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
    };


    read();
    cancelAnimationFrame(raf.current);

    let last = "";
    let frames = 0;
    const settle = () => {
      const el = document.querySelector<HTMLElement>(target);
      if (el) {
        const r = el.getBoundingClientRect();
        const key = `${Math.round(r.top)},${Math.round(r.left)},${Math.round(r.width)},${Math.round(r.height)}`;
        if (key !== last) {
          last = key;
          read();
        } else if (frames > 2) {
          return;
        }
      }


      if (++frames < 40) {
        raf.current = requestAnimationFrame(settle);
      }
    };
    raf.current = requestAnimationFrame(settle);
  }, [target, pad]);

  useLayoutEffect(() => {
    before.current?.();
    measure();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  useEffect(() => {
    window.addEventListener("resize", measure);

    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        last ? finish() : setI((n) => n + 1);
      }
      if (e.key === "ArrowLeft" && i > 0) setI((n) => n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, last, i]);

  if (!step) return null;


  const CARD_W = 340;
  const GAP = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let cardTop = vh / 2 - 90;
  let cardLeft = vw / 2 - CARD_W / 2;

  if (rect) {
    const below = rect.top + rect.height + GAP;
    const roomBelow = vh - below;
    cardTop = roomBelow > 190 ? below : Math.max(GAP, rect.top - 190 - GAP);
    cardLeft = Math.min(
      Math.max(GAP, rect.left + rect.width / 2 - CARD_W / 2),
      vw - CARD_W - GAP,
    );
  }

  return (
    <div className="tr" role="dialog" aria-modal="true" aria-label="Product tour">


      <svg className="tr-scrim" width="100%" height="100%">
        <defs>
          <mask id="tr-hole">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <motion.rect
                initial={false}
                animate={{ x: rect.left, y: rect.top, width: rect.width, height: rect.height }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(6,6,10,.72)" mask="url(#tr-hole)" />
      </svg>


      {rect && (
        <motion.div
          className="tr-ring"
          initial={false}
          animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          className="tr-card glass glass-strong"
          style={{ top: cardTop, left: cardLeft, width: CARD_W }}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.99 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="tr-count">
            {i + 1} of {steps.length}
          </p>
          <h3 className="tr-title">{step.title}</h3>
          <p className="tr-body">{step.body}</p>

          <div className="tr-foot">
            <button className="tr-skip" onClick={finish}>
              {last ? "" : "Skip the tour"}
            </button>
            <div className="tr-nav">
              {i > 0 && (
                <button className="tr-btn" onClick={() => setI((n) => n - 1)}>
                  Back
                </button>
              )}
              <button className="tr-btn tr-btn--primary" onClick={() => (last ? finish() : setI((n) => n + 1))}>
                {last ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
