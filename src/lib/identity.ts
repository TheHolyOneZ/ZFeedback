

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Identity = {
  hue: number;
  from: string;
  to: string;
  glow: string;
  monogram: string;
};


export function identity(slug: string, title: string): Identity {
  const h = hash(slug);
  const hue = (h % 24) * 15;


  const from = `hsl(${hue} 44% 38%)`;
  const to = `hsl(${(hue + 30) % 360} 52% 22%)`;

  return {
    hue,
    from,
    to,


    glow: `hsla(${hue} 58% 47% / 0.26)`,
    monogram: monogram(title),
  };
}


export function monogram(title: string): string {
  const cleaned = title.replace(/[^A-Za-z0-9 -]/g, " ").trim();
  if (!cleaned) return "?";


  const parts = cleaned
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s-]+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}
