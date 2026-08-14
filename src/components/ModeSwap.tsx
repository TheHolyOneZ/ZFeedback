import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import "./ModeSwap.css";


export function ModeSwap({

  swapKey,

  toWanted,
  children,
}: {
  swapKey: string;
  toWanted: boolean;
  children: ReactNode;
}) {
  const still = useReducedMotion();

  if (still) {


    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={swapKey}
        className="ms"
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}


        exit={{
          opacity: 0,
          y: -14,
          scale: 0.99,
          transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
        }}
        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      >
        {toWanted && <Sweep />}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}


function Sweep() {
  return (
    <motion.div
      className="ms-sweep"
      aria-hidden="true"
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: 0 }}
      transition={{
        scaleX: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },


        opacity: { duration: 0.22, delay: 0.42 },
      }}
    >
      <span className="ms-sweep-head" />
    </motion.div>
  );
}
