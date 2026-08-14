import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { openExternal } from "../lib/catalogue";
import { environment, platformName, type Environment } from "../lib/environment";
import { Wordmark } from "./Wordmark";
import { Scroll } from "./Scroll";
import "./About.css";


import { DebugReset } from "./DebugReset";

const REPO = "https://github.com/TheHolyOneZ/ZFeedback";
const SITE = "https://zsync.eu";


export function About({ onClose }: { onClose: () => void }) {
  const [env, setEnv] = useState<Environment | null>(null);

  useEffect(() => {
    environment().then(setEnv).catch(() => setEnv(null));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="ab-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
    >
      <motion.div
        className="ab"
        role="dialog"
        aria-modal="true"
        aria-label="About ZFeedback"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="ab-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <Scroll className="ab-scroll">
        <header className="ab-head">
          <Wordmark
            as="h1"
            className="ab-mark"
            text="Z"
            accent="Feedback"
            delay={0.05}
            stagger={0.022}
          />
          <p className="ab-tagline">The Z catalogue, and a way to report bugs.</p>
          <p className="ab-version mono selectable">
            {env ? `Version ${env.app_version}` : "Version …"}
          </p>
        </header>

        <p className="ab-desc">
          Browse every Z tool in one place and file bug reports, feature requests
          and app requests without leaving your desktop — and get a reply from a
          human rather than a black hole. Most of the catalogue has no public
          issue tracker, so for those tools this is the only way to report
          anything at all.
        </p>

        <section className="ab-sec">
          <h2 className="ab-h">Built with</h2>
          <ul className="ab-stack">
            <li><span className="ab-k">Shell</span><span className="ab-v">Tauri v2</span></li>
            <li><span className="ab-k">Core</span><span className="ab-v">Rust</span></li>
            <li><span className="ab-k">Interface</span><span className="ab-v">React 19 · TypeScript</span></li>
            <li><span className="ab-k">Motion</span><span className="ab-v">Motion (Framer)</span></li>
            <li><span className="ab-k">Type</span><span className="ab-v">Inter · JetBrains Mono</span></li>
          </ul>


          <p className="ab-note">
            Every network call happens in Rust. Your API token is kept in the OS
            keychain and never enters the web layer, so a scripting flaw in the
            interface cannot leak it.
          </p>
        </section>

        <section className="ab-sec">
          <h2 className="ab-h">This machine</h2>
          <div className="ab-env mono selectable">
            {env ? (
              <>
                <div><span>platform</span>{platformName(env.platform)} ({env.arch})</div>
                <div><span>webview</span>{env.webview}</div>
                <div><span>version</span>{env.app_version}</div>
                <div><span>chrome</span>{env.custom_chrome ? "custom titlebar" : "system titlebar"}</div>
              </>
            ) : (
              <div className="ab-env-empty">Reading…</div>
            )}
          </div>
          <p className="ab-note">
            Include this when you report something. It is the same information
            attached to a ticket, and nothing else is collected.
          </p>
        </section>

        <section className="ab-sec">
          <h2 className="ab-h">Licence</h2>
          <p className="ab-desc ab-desc--tight">
            ZFeedback is free software under the{" "}
            <strong>GNU General Public License v3.0 or later</strong>. You may
            use, study, share and modify it; if you distribute a modified
            version, it has to stay free software too.
          </p>
          <p className="ab-note">
            The name and the Z mark are trademarks and are not covered by that
            licence — fork freely, but please rename your fork. The server this
            app talks to is a separate, closed component.
          </p>
        </section>

        <footer className="ab-foot">
          <div className="ab-author">
            <span className="ab-by">Made by</span>
            <strong className="ab-name">TheHolyOneZ</strong>
          </div>
          <div className="ab-links">
            <button className="ab-link" onClick={() => openExternal(SITE)}>
              zsync.eu
            </button>
            <button className="ab-link" onClick={() => openExternal(REPO)}>
              Source
            </button>
            <button
              className="ab-link"
              onClick={() => openExternal(`${REPO}/blob/main/LICENSE`)}
            >
              Full licence
            </button>
          </div>
        </footer>

        <p className="ab-copy">Copyright © 2026 TheHolyOneZ</p>


        <DebugReset />
        </Scroll>
      </motion.div>
    </motion.div>
  );
}


export function AboutHost({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <About onClose={onClose} />}</AnimatePresence>;
}
