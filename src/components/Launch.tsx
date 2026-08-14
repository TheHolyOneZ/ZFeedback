import { useEffect, useState } from "react";
import { motion } from "motion/react";
import "./Launch.css";


const HOLD_MS = 1500;

export function Launch({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;


    if (reduced || (window as any).__zfNoLaunch) {
      onDone();
      return;
    }

    const timer = setTimeout(() => setLeaving(true), HOLD_MS);


    const failsafe = setTimeout(onDone, HOLD_MS + 3000);


    const skip = () => setLeaving(true);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });

    return () => {
      clearTimeout(timer);
      clearTimeout(failsafe);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
    };
  }, [onDone]);

  return (
    <motion.div
      className="lx"
      initial={{ opacity: 1 }}
      animate={leaving ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}

      onAnimationComplete={() => leaving && onDone()}
      aria-hidden="true"
    >


      <motion.div
        className="lx-bloom"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={leaving ? { opacity: 0, scale: 1.5 } : { opacity: 1, scale: 1 }}
        transition={{ duration: leaving ? 0.55 : 1.1, delay: leaving ? 0 : 0.35, ease: "easeOut" }}
      />

      <motion.div
        className="lx-stage"
        animate={leaving ? { scale: 1.12, y: -8 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg className="lx-mark" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="lx-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="55%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>


          <motion.path
            d="M4.6 3.2h14.8a1.4 1.4 0 0 1 1.4 1.4v11.2a1.4 1.4 0 0 1-1.4 1.4h-6.3l-3.4 3.3a.7.7 0 0 1-1.2-.5v-2.8H4.6a1.4 1.4 0 0 1-1.4-1.4V4.6a1.4 1.4 0 0 1 1.4-1.4Z"
            fill="none"
            stroke="url(#lx-grad)"
            strokeWidth="1.4"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.85, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.15 },
            }}
          />


          <motion.path
            d="M9 8h6l-6 5h6"
            fill="none"
            stroke="url(#lx-grad)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.62, ease: [0.4, 0, 0.2, 1] }}
          />
        </svg>


        <motion.p
          className="lx-word"
          initial={{ opacity: 0, letterSpacing: "0.42em" }}
          animate={{ opacity: 1, letterSpacing: "0.14em" }}
          transition={{ duration: 0.7, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          ZFEEDBACK
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
