import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Wordmark } from "./Wordmark";
import "./TitleBar.css";


export function TitleBar({
  unread = 0,


  play = true,
}: { unread?: number; play?: boolean }) {
  const [maximized, setMaximized] = useState(false);
  const win = getCurrentWindow();

  useEffect(() => {
    let alive = true;


    const sync = (m: boolean) => {
      if (!alive) return;
      setMaximized(m);
      document.documentElement.dataset.maximized = m ? "true" : "false";
    };

    win.isMaximized().then(sync);


    const un = win.onResized(() => {
      win.isMaximized().then(sync);
    });

    return () => {
      alive = false;
      delete document.documentElement.dataset.maximized;
      un.then((f) => f());
    };
  }, [win]);

  return (
    <header
      className="titlebar"
      data-tauri-drag-region
      onDoubleClick={() => win.toggleMaximize()}
    >
      <div className="titlebar-brand" data-tauri-drag-region>
        <Mark />
        <span className="titlebar-name" data-tauri-drag-region>
          <Wordmark as="span" text="Z" accent="Feedback" delay={0.42} stagger={0.024} play={play} />
        </span>
        {unread > 0 && (
          <span className="titlebar-dot" title={`${unread} awaiting your reply`} />
        )}
      </div>

      <div className="titlebar-controls">
        <button
          className="tb-btn"
          aria-label="Minimise"
          onClick={() => win.minimize()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1 5h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>

        <button
          className="tb-btn"
          aria-label={maximized ? "Restore" : "Maximise"}
          onClick={() => win.toggleMaximize()}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path
                d="M3 1.5h5.5V7M1.5 3h5v5.5h-5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <rect
                x="1.4"
                y="1.4"
                width="7.2"
                height="7.2"
                rx="1.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          )}
        </button>

        <button
          className="tb-btn tb-close"
          aria-label="Close"
          onClick={() => win.close()}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path
              d="M2 2l6 6M8 2l-6 6"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}


function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="tb-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <path
        d="M4.6 3.2h14.8a1.4 1.4 0 0 1 1.4 1.4v11.2a1.4 1.4 0 0 1-1.4 1.4h-6.3l-3.4 3.3a.7.7 0 0 1-1.2-.5v-2.8H4.6a1.4 1.4 0 0 1-1.4-1.4V4.6a1.4 1.4 0 0 1 1.4-1.4Z"
        fill="none"
        stroke="url(#tb-mark)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6l-6 5h6"
        fill="none"
        stroke="url(#tb-mark)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
