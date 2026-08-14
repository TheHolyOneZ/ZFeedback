import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { PublicUser } from "../lib/auth";
import "./AccountButton.css";


export function AccountButton({
  user,
  onSignIn,
  onSignOut,
  onMyTickets,
  onNewTicket,
  onTour,
  onAbout,
  needsReply = 0,
}: {
  user: PublicUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onMyTickets: () => void;
  onNewTicket: () => void;

  onTour: () => void;

  onAbout: () => void;
  needsReply?: number;
}) {
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button className="acct acct--out" onClick={onSignIn}>
        Sign in
      </button>
    );
  }

  const initial = (user.username ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="acct-wrap">
      <button
        className="acct"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user.avatar ? (
          <img className="acct-av" src={user.avatar} alt="" />
        ) : (
          <span className="acct-av acct-av--fallback">{initial}</span>
        )}
        <span className="acct-name">{user.username ?? "Account"}</span>
        {needsReply > 0 && <span className="acct-dot" title={`${needsReply} awaiting your reply`} />}
      </button>

      <AnimatePresence>
        {open && (
          <>


            <div className="acct-away" onClick={() => setOpen(false)} />
            <motion.div
              className="acct-menu glass glass-strong"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              role="menu"
            >
              <button
                className="acct-item"
                onClick={() => {
                  setOpen(false);
                  onNewTicket();
                }}
              >
                New ticket
              </button>
              <button
                className="acct-item"
                onClick={() => {
                  setOpen(false);
                  onMyTickets();
                }}
              >
                My tickets
                {needsReply > 0 && <span className="acct-badge num">{needsReply}</span>}
              </button>
              <div className="acct-sep" />


              <button
                className="acct-item"
                onClick={() => {
                  setOpen(false);
                  onTour();
                }}
              >
                Show me around
              </button>
              <div className="acct-sep" />
              <button
                className="acct-item"
                onClick={() => {
                  setOpen(false);
                  onAbout();
                }}
              >
                About ZFeedback
              </button>

              <button
                className="acct-item acct-item--quiet"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
              >
                Sign out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
