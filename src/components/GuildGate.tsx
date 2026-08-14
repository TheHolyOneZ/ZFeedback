import { motion } from "motion/react";
import { openExternal } from "../lib/catalogue";
import "./GuildGate.css";


export function GuildGate({
  invite,
  onRetry,
  onDismiss,
}: {
  invite: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      className="gg-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="gg glass glass-strong"
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.985 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="gg-title">Rejoin the Discord server</h2>

        <p className="gg-text">
          You're not in the ZSync.eu server any more, so the bot can't message
          you — and that's how replies to your tickets arrive. Filing and
          replying are paused until you're back in.
        </p>

        <p className="gg-note">
          Everything you've already filed is safe and still here. Nothing was
          deleted.
        </p>

        <div className="gg-actions">
          <button className="gg-btn gg-btn--primary" onClick={() => openExternal(invite)}>
            Open the invite
          </button>
          <button className="gg-btn" onClick={onRetry}>
            I've joined — check again
          </button>
        </div>


        <button className="gg-dismiss" onClick={onDismiss}>
          Keep browsing without an account
        </button>
      </motion.div>
    </motion.div>
  );
}
