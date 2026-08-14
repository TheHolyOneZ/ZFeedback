import { useState } from "react";
import { signOut } from "../lib/auth";
import "./DebugReset.css";


const KEYS = [
  "zf.welcome.v1",
  "zf.intro.v1",
  "zf.tour.v1",
];

export function DebugReset() {
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    if (busy) return;
    setBusy(true);

    for (const k of KEYS) {
      try {
        localStorage.removeItem(k);
      } catch {

      }
    }


    try {
      await signOut();
    } catch {

    }


    location.reload();
  };


  if (!import.meta.env.DEV) return null;

  return (
    <div className="dbg-row">
      <span className="dbg-tag">DEBUG</span>
      <button
        className="dbg"
        onClick={reset}
        title="Clear welcome, intro and tour flags, sign out, and reload"
      >
        {busy ? "Resetting…" : "Reset to a fresh install"}
      </button>
    </div>
  );
}
