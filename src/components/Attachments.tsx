import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  attachmentUrl,
  formatBytes,
  MAX_PER_TICKET,
  rejectReason,
  uploadAttachment,
} from "../lib/attachments";
import type { Attachment } from "../lib/attachments";
import { parseError } from "../lib/tickets";
import "./Attachments.css";


const CACHE = new Map<number, string>();

export function AttachmentThumb({
  attachment: a,
  onOpen,
}: {
  attachment: Attachment;
  onOpen: (a: Attachment, url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(CACHE.get(a.id) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (url) return;
    let alive = true;
    attachmentUrl(a.id)
      .then((u) => {
        CACHE.set(a.id, u);
        if (alive) setUrl(u);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [a.id, url]);

  if (failed) {
    return (
      <div className="att-thumb att-thumb--gone" title={a.name}>
        <span>Unavailable</span>
      </div>
    );
  }

  return (
    <button
      className="att-thumb"
      onClick={() => url && onOpen(a, url)}
      title={`${a.name} · ${formatBytes(a.bytes)}`}
      disabled={!url}
    >
      {url ? <img src={url} alt={a.name} /> : <span className="att-shimmer" />}
    </button>
  );
}


export function AttachmentRow({ items }: { items: Attachment[] }) {
  const [open, setOpen] = useState<{ a: Attachment; url: string } | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className="att-row">
        {items.map((a) => (
          <AttachmentThumb key={a.id} attachment={a} onOpen={(a, url) => setOpen({ a, url })} />
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <Lightbox
            name={open.a.name}
            url={open.url}
            meta={`${formatBytes(open.a.bytes)}${
              open.a.width ? ` · ${open.a.width}×${open.a.height}` : ""
            }`}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}


function Lightbox({
  name,
  url,
  meta,
  onClose,
}: {
  name: string;
  url: string;
  meta: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="att-box"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <motion.img
        src={url}
        alt={name}
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      />
      <p className="att-box-meta">
        {name} <span>{meta}</span>
      </p>
    </motion.div>
  );
}


export function AttachmentPicker({
  reference,
  existing,
  onAdded,
  disabled,
}: {

  reference: string | null;
  existing: Attachment[];
  onAdded: (a: Attachment) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const room = MAX_PER_TICKET - existing.length;
  const full = room <= 0;

  const take = async (files: FileList | File[] | null) => {
    if (!files || !reference || busy || full) return;
    setErr(null);

    const list = Array.from(files).slice(0, room);
    setBusy(true);
    try {
      for (const f of list) {
        const bad = rejectReason(f);
        if (bad) {
          setErr(bad);
          continue;
        }
        const r = await uploadAttachment(reference, f);
        onAdded(r.attachment);
      }
    } catch (e) {
      setErr(parseError(e).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };


  useEffect(() => {
    if (!reference || disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter((i) => i.kind === "file")
        .map((i) => i.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length) {
        e.preventDefault();
        take(files);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, disabled, room, busy]);

  if (disabled) return null;

  return (
    <div
      className={`att-drop${dragging ? " over" : ""}${full ? " full" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!full) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        take(e.dataTransfer.files);
      }}
    >
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        hidden
        onChange={(e) => take(e.target.files)}
      />

      <button
        className="att-add"
        onClick={() => input.current?.click()}
        disabled={busy || full || !reference}
      >
        <Paperclip />
        {busy ? "Uploading…" : full ? `${MAX_PER_TICKET} images is the limit` : "Add a screenshot"}
      </button>


      <span className="att-hint">
        {full
          ? "Remove one to add another."
          : "Drop or paste an image — crop it to the part that's wrong (the window, the error, the setting). PNG, JPEG, GIF or WebP, up to 4 MB."}
      </span>

      {err && <p className="att-err">{err}</p>}
    </div>
  );
}

function Paperclip() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M11 6.5 6.6 10.9a2.6 2.6 0 0 1-3.7-3.7l4.6-4.6a1.7 1.7 0 0 1 2.4 2.4l-4.6 4.6a.8.8 0 0 1-1.2-1.2l4.2-4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
