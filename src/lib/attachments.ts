import { invoke } from "@tauri-apps/api/core";


export type Attachment = {
  id: number;
  name: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;

  message_id: number | null;
  created_at: string;
};


export const ACCEPTED = ["image/png", "image/jpeg", "image/gif", "image/webp"];


export const MAX_BYTES = 4 * 1024 * 1024;
export const MAX_PER_TICKET = 5;


export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("That file could not be read."));
    r.onload = () => {
      const s = String(r.result ?? "");
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    r.readAsDataURL(file);
  });
}

export async function uploadAttachment(
  reference: string,
  file: File,
): Promise<{ attachment: Attachment }> {
  const data = await fileToBase64(file);
  return invoke("attachment_upload", { reference, name: file.name || "image", data });
}


export async function attachmentUrl(id: number): Promise<string> {
  const r = await invoke<{ mime: string; data: string }>("attachment_data", { id });
  return `data:${r.mime};base64,${r.data}`;
}


export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}


export function rejectReason(file: File): string | null {
  if (file.size > MAX_BYTES) {


    return (
      `${file.name} is ${formatBytes(file.size)} — the limit is 4 MB. ` +
      `Crop it to the part that shows the problem; a full-screen capture is mostly background anyway.`
    );
  }
  if (file.size === 0) return `${file.name} is empty.`;


  if (file.type && !ACCEPTED.includes(file.type)) {
    return `${file.name} is not an image the ticket system accepts (PNG, JPEG, GIF or WebP).`;
  }
  return null;
}
