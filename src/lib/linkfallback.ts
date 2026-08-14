

type Listener = (url: string) => void;

let listener: Listener | null = null;


export function onLinkFailure(fn: Listener | null) {
  listener = fn;
}


export function reportLinkFailure(url: string) {
  if (listener) listener(url);
  else console.error("ZFeedback: could not open", url, "(no fallback mounted)");
}
