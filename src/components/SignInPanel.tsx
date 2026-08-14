import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { openExternal } from "../lib/catalogue";
import { cancelSignIn, onLoginProgress, startSignIn } from "../lib/auth";
import type { LoginProgress, PublicUser } from "../lib/auth";
import "./SignInPanel.css";


export function SignInPanel({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn: (user: PublicUser) => void;
}) {
  const [progress, setProgress] = useState<LoginProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const un = onLoginProgress((p) => {
      setProgress(p);
      if (p.state === "approved") {
        onSignedIn(p.user);
      }
    });
    return () => {
      un.then((f) => f());
    };
  }, [onSignedIn]);


  useEffect(() => () => void cancelSignIn(), []);

  const begin = async () => {
    setError(null);
    setStarting(true);
    setProgress(null);
    try {
      await startSignIn();
    } catch (e) {
      setError(String(e));
    } finally {
      setStarting(false);
    }
  };

  return (
    <motion.div
      className="si-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="si glass glass-strong"
        initial={{ opacity: 0, y: 26, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.985 }}
        transition={{ type: "spring", stiffness: 240, damping: 26, delay: 0.04 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
      >
        <button className="si-close" onClick={onClose} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={progress?.state ?? (error ? "error" : "idle")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {error ? (
              <Screen
                title="Could not start sign-in"
                body={error}
                action={{ label: "Try again", onClick: begin }}
                tone="err"
              />
            ) : !progress ? (
              <Intro onStart={begin} busy={starting} />
            ) : progress.state === "waiting" ? (
              <Waiting
                code={progress.user_code}
                url={progress.login_url}
                opened={progress.browser_opened}
              />
            ) : progress.state === "needs_guild" ? (
              <NeedsGuild invite={progress.discord_invite} message={progress.message} onRetry={begin} />
            ) : progress.state === "verifying" ? (
              <Screen
                title="Check your Discord DMs"
                body="The bot sent you a 6-digit code. Enter it in the browser tab that just opened."
                spinner
              />
            ) : progress.state === "approved" ? (
              <Screen title="Signed in" body="You're all set." tone="ok" />
            ) : progress.state === "expired" ? (
              <Screen
                title="That sign-in expired"
                body="Codes are valid for ten minutes."
                action={{ label: "Start again", onClick: begin }}
              />
            ) : (
              <Screen
                title="Sign-in failed"
                body={progress.message}
                action={{ label: "Try again", onClick: begin }}
                tone="err"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}


function Intro({ onStart, busy }: { onStart: () => void; busy: boolean }) {
  return (
    <div className="si-body">
      <h2 className="si-title">Sign in to file feedback</h2>
      <p className="si-text">
        Browsing needs no account. Signing in lets you report bugs, request features
        and track what happens to them.
      </p>

      <ol className="si-steps">
        <li>You'll be sent to Discord in your browser.</li>
        <li>
          You need to be in the <strong>ZSync.eu server</strong> — the bot sends your
          verification code by DM, and it can only message people who share a server
          with it.
        </li>
        <li>Enter the code, and you're back here.</li>
      </ol>

      <button className="si-btn si-btn--primary" onClick={onStart} disabled={busy}>
        {busy ? "Opening browser…" : "Continue with Discord"}
      </button>
      <p className="si-note">
        Opens your real browser — never a window inside this app.
      </p>
    </div>
  );
}

function Waiting({ code, url, opened }: { code: string; url: string; opened: boolean }) {
  return (
    <div className="si-body">
      <h2 className="si-title">Confirm this code</h2>


      {opened ? (
        <p className="si-text">
          Your browser should have opened. Check that it shows this exact code
          before approving.
        </p>
      ) : (
        <p className="si-text">
          We couldn't open a browser for you — on Linux that usually means{" "}
          <code className="si-inline-code">xdg-utils</code> isn't installed. Open
          the page yourself, then check it shows this exact code before approving.
        </p>
      )}

      <div className="si-code mono">{code}</div>

      <button className="si-btn" onClick={() => openExternal(url)}>
        {opened ? "Open the page again" : "Open the sign-in page"}
      </button>
      <p className="si-note si-warn">
        If you didn't start this, don't approve it — someone else would get access to
        your account.
      </p>
    </div>
  );
}

function NeedsGuild({
  invite,
  message,
  onRetry,
}: {
  invite: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="si-body">
      <h2 className="si-title">Join the Discord first</h2>
      <p className="si-text">{message}</p>

      <button className="si-btn si-btn--primary" onClick={() => openExternal(invite)}>
        Join the ZSync.eu server
      </button>
      <button className="si-btn" onClick={onRetry}>
        I've joined — try again
      </button>

      <p className="si-note">
        One-time step. It's also what lets the bot tell you when a request you made
        actually ships.
      </p>
    </div>
  );
}

function Screen({
  title,
  body,
  action,
  tone,
  spinner,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  tone?: "ok" | "err";
  spinner?: boolean;
}) {
  return (
    <div className="si-body">
      <h2 className={`si-title${tone ? ` si-${tone}` : ""}`}>{title}</h2>
      <p className="si-text">{body}</p>
      {spinner && <div className="si-pulse" aria-hidden="true" />}
      {action && (
        <button className="si-btn si-btn--primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
