import { motion } from "motion/react";
import "./Wordmark.css";


export function Wordmark({
  text,
  accent,
  className = "",

  delay = 0,

  play = true,

  stagger = 0.028,

  accentAs = "text",
  as: Tag = "h1",
}: {
  text: string;
  accent: string;
  className?: string;
  delay?: number;
  play?: boolean;
  stagger?: number;
  accentAs?: "text" | "badge";
  as?: "h1" | "span" | "p";
}) {
  const chars = [...text];
  const accentChars = [...accent];

  const rise = (i: number) => ({
    initial: { opacity: 0, y: "0.4em", filter: "blur(8px)", scale: 0.94 },
    animate: play
      ? { opacity: 1, y: "0em", filter: "blur(0px)", scale: 1 }
      : { opacity: 0, y: "0.4em", filter: "blur(8px)", scale: 0.94 },
    transition: {
      duration: 0.55,
      delay: play ? delay + i * stagger : 0,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  });

  return (
    <Tag className={`wm ${className}`.trim()}>

      <span className="wm-sr">
        {text}
        {accent}
      </span>

      <span className={`wm-line${accentAs === "badge" ? " wm-line--badge" : ""}`} aria-hidden="true">


        <span className="wm-word">
          {chars.map((c, i) => (
            <motion.span className="wm-c" key={`t${i}`} {...rise(i)}>
              {c === " " ? " " : c}
            </motion.span>
          ))}
        </span>

        {accentAs === "badge" ? (
          <motion.span
            className="wm-badge"
            initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
            animate={
              play
                ? { opacity: 1, scale: 1, rotate: 0 }
                : { opacity: 0, scale: 0.7, rotate: -8 }
            }
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 16,
              delay: play ? delay + chars.length * stagger : 0,
            }}
          >
            <span className="wm-badge-fill" />
            <span className="wm-badge-text">{accent}</span>
          </motion.span>
        ) : (
          <span className="wm-word">
            {accentChars.map((c, i) => (
              <motion.span
                className="wm-c wm-accent"
                key={`a${i}`}
                {...rise(chars.length + i)}
              >
                {c === " " ? " " : c}
              </motion.span>
            ))}
          </span>
        )}
      </span>
    </Tag>
  );
}
