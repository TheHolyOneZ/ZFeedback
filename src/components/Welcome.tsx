import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { openExternal } from "../lib/catalogue";
import { Scroll } from "./Scroll";
import { KindGlyph } from "../lib/kinds";
import "./Welcome.css";


const SEEN_KEY = "zf.welcome.v1";


export function welcomeDone(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {


    return true;
  }
}

function markDone() {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {

  }
}

type Step = "hello" | "discord" | "ready";

export function Welcome({
  invite,
  onSignIn,
  onBrowse,
}: {
  invite: string;

  onSignIn: () => void;

  onBrowse: () => void;
}) {
  const [step, setStep] = useState<Step>("hello");
  const [joined, setJoined] = useState(false);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        markDone();
        onBrowse();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBrowse]);

  const browse = () => {
    markDone();
    onBrowse();
  };

  const signIn = () => {
    markDone();
    onSignIn();
  };

  return (
    <motion.div
      className="wc-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to ZFeedback"
    >
      <motion.div
        className="wc glass glass-strong"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 210, damping: 26, delay: 0.1 }}
      >
        <Scroll className="wc-scroll">


        <div className="wc-dots" aria-hidden="true">
          {(["hello", "discord", "ready"] as Step[]).map((s) => (
            <span key={s} className={`wc-dot${s === step ? " on" : ""}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "hello" && (
            <Pane key="hello">
              <Mark />
              <h1 className="wc-title">
                Every Z tool, and a way to be heard
              </h1>
              <p className="wc-lede">
                Browse all 50 tools and download any of them without an account.
                What an account adds is the other half: report a bug, ask for a
                feature, and get a reply from the person who wrote it.
              </p>

              <ul className="wc-list">
                <li>
                  <span className="wc-ico" style={{ ["--kind-hsl" as string]: "356 74% 62%" }}>
                    <KindGlyph kind="bug" size={14} />
                  </span>
                  <span>
                    <strong>Report a bug</strong> with your version and OS
                    attached — shown to you first, never collected quietly.
                  </span>
                </li>
                <li>
                  <span className="wc-ico" style={{ ["--kind-hsl" as string]: "262 83% 62%" }}>
                    <KindGlyph kind="feature" size={14} />
                  </span>
                  <span>
                    <strong>Ask for a feature</strong> and watch it move from
                    planned to shipped.
                  </span>
                </li>
                <li>
                  <span className="wc-ico" style={{ ["--kind-hsl" as string]: "199 89% 58%" }}>
                    <KindGlyph kind="app_request" size={14} />
                  </span>
                  <span>
                    <strong>Request a tool that doesn't exist.</strong> The most
                    wanted ones get built.
                  </span>
                </li>
              </ul>

              <div className="wc-actions">
                <button className="wc-btn wc-btn--primary" onClick={() => setStep("discord")}>
                  Set up my account
                </button>
                <button className="wc-btn" onClick={browse}>
                  Just let me look around
                </button>
              </div>
            </Pane>
          )}

          {step === "discord" && (
            <Pane key="discord">
              <div className="wc-shield">
                <ShieldGlyph />
              </div>
              <h1 className="wc-title">First, join the Discord server</h1>
              <p className="wc-lede">
                This is a security step, not a growth one — and it is worth
                thirty seconds of explanation.
              </p>

              <div className="wc-why">
                <p>
                  When you sign in, a bot sends you a <strong>6-digit code as a
                  direct message</strong>. Entering it proves the person at the
                  keyboard is actually you, and not someone who talked you into
                  approving their login.
                </p>
                <p>
                  <strong>Discord only lets a bot message people who share a
                  server with it.</strong> That is the whole reason for this
                  step. No shared server, no DM, no way to verify you — and no
                  way to reach you when your ticket gets answered.
                </p>
              </div>

              <p className="wc-fine">
                You can leave the server whenever you like. Everything you filed
                stays yours, and nothing is posted there on your behalf.
              </p>

              <div className="wc-actions">
                <button
                  className="wc-btn wc-btn--discord"
                  onClick={() => {
                    openExternal(invite);
                    setJoined(true);
                  }}
                >
                  <DiscordGlyph />
                  Open the invite
                </button>
                <button
                  className={`wc-btn${joined ? " wc-btn--primary" : ""}`}
                  onClick={() => setStep("ready")}
                >
                  {joined ? "I've joined — continue" : "I'm already in"}
                </button>
              </div>

              <button className="wc-back" onClick={() => setStep("hello")}>
                Back
              </button>
            </Pane>
          )}

          {step === "ready" && (
            <Pane key="ready">
              <div className="wc-shield wc-shield--ok">
                <CheckGlyph />
              </div>
              <h1 className="wc-title">Sign in with Discord</h1>
              <p className="wc-lede">
                A browser tab opens with a short code. Confirm it matches the one
                shown here, then check your DMs for the 6-digit code.
              </p>

              <ol className="wc-steps">
                <li><span>1</span> The app shows you a code</li>
                <li><span>2</span> Your browser opens — check the code matches</li>
                <li><span>3</span> The bot DMs you 6 digits to confirm it's you</li>
                <li><span>4</span> Close the tab; the app signs itself in</li>
              </ol>

              <p className="wc-fine">
                We store your Discord id, username and avatar. Nothing else —
                no email, no password, and nothing about how you use the app.
              </p>

              <div className="wc-actions">
                <button className="wc-btn wc-btn--primary" onClick={signIn}>
                  Sign in with Discord
                </button>
                <button className="wc-btn" onClick={browse}>
                  Later
                </button>
              </div>

              <button className="wc-back" onClick={() => setStep("discord")}>
                Back
              </button>
            </Pane>
          )}
        </AnimatePresence>
        </Scroll>
      </motion.div>
    </motion.div>
  );
}


function Pane({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="wc-pane"
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -14 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}


function Mark() {
  return (
    <motion.svg
      className="wc-mark"
      viewBox="0 0 24 24"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.15 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wc-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <motion.path
        d="M4.6 3.2h14.8a1.4 1.4 0 0 1 1.4 1.4v11.2a1.4 1.4 0 0 1-1.4 1.4h-6.3l-3.4 3.3a.7.7 0 0 1-1.2-.5v-2.8H4.6a1.4 1.4 0 0 1-1.4-1.4V4.6a1.4 1.4 0 0 1 1.4-1.4Z"
        fill="none"
        stroke="url(#wc-grad)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.path
        d="M9 8h6l-6 5h6"
        fill="none"
        stroke="url(#wc-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.85 }}
      />
    </motion.svg>
  );
}

function ShieldGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.8l7 2.6v6c0 4.4-2.9 8.3-7 9.6-4.1-1.3-7-5.2-7-9.6v-6l7-2.6Z"
        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M8.8 12.2l2.2 2.2 4.2-4.4" fill="none" stroke="currentColor"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12.4l2.6 2.6L16 9.6" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DiscordGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M19.3 5.3A16.9 16.9 0 0 0 15.1 4l-.2.4a12.6 12.6 0 0 1 3.7 1.9 15.9 15.9 0 0 0-13.2 0A12.6 12.6 0 0 1 9.1 4.4L8.9 4a16.9 16.9 0 0 0-4.2 1.3C2.1 9.1 1.4 12.9 1.7 16.6A17 17 0 0 0 6.9 19l1-1.5a11 11 0 0 1-1.7-.8l.4-.3a12.1 12.1 0 0 0 10.8 0l.4.3a11 11 0 0 1-1.7.8l1 1.5a17 17 0 0 0 5.2-2.4c.4-4.3-.7-8.1-2.9-11.3ZM8.5 14.3c-1 0-1.9-.9-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Zm7 0c-1 0-1.9-.9-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Z" />
    </svg>
  );
}
