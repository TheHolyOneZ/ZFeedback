import type { Project } from "./types";


export type Hit = {
  project: Project;
  score: number;

  ranges: [number, number][];
};

const SCORE = {
  titleExact: 1000,
  titlePrefix: 500,
  titleWordPrefix: 400,
  titleContains: 300,
  titleFuzzy: 150,
  categoryExact: 200,
  descContains: 60,

  termBonus: 1.15,
};

function norm(s: string): string {
  return s
    .toLowerCase()

    .replace(/[-_\s./]+/g, "");
}


const MAX_FUZZY_GAP = 2;

function fuzzy(haystack: string, needle: string): boolean {
  if (needle.length < 2) return false;
  let h = 0;
  let lastHit = -1;
  for (let n = 0; n < needle.length; n++) {
    let found = -1;
    while (h < haystack.length) {
      if (haystack[h] === needle[n]) {
        found = h;
        h++;
        break;
      }
      h++;
    }
    if (found === -1) return false;
    if (lastHit !== -1 && found - lastHit > MAX_FUZZY_GAP) return false;
    lastHit = found;
  }
  return true;
}


function descriptionHit(description: string, term: string): boolean {
  if (term.length < 3) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}`, "i").test(description);
}

function scoreOne(p: Project, term: string): { score: number; ranges: [number, number][] } {
  const title = p.title.toLowerCase();
  const nTitle = norm(p.title);
  const nTerm = norm(term);
  const cat = (p.category ?? "").toLowerCase();

  if (!nTerm) return { score: 0, ranges: [] };


  if (nTitle === nTerm) {
    return { score: SCORE.titleExact, ranges: [[0, p.title.length]] };
  }


  if (nTitle.startsWith(nTerm)) {
    const at = title.indexOf(term.toLowerCase());
    return {
      score: SCORE.titlePrefix,
      ranges: at >= 0 ? [[at, at + term.length]] : [[0, term.length]],
    };
  }


  const at = title.indexOf(term.toLowerCase());
  if (at >= 0) {
    const isWordStart = at === 0 || /[\s\-_]/.test(title[at - 1]);
    return {
      score: isWordStart ? SCORE.titleWordPrefix : SCORE.titleContains,
      ranges: [[at, at + term.length]],
    };
  }

  if (cat && (cat === term.toLowerCase() || cat.startsWith(term.toLowerCase()))) {
    return { score: SCORE.categoryExact, ranges: [] };
  }

  if (fuzzy(nTitle, nTerm)) {
    return { score: SCORE.titleFuzzy, ranges: [] };
  }

  if (descriptionHit(p.description, term)) {
    return { score: SCORE.descContains, ranges: [] };
  }

  return { score: 0, ranges: [] };
}


export function search(projects: Project[], query: string): Hit[] {
  const q = query.trim();
  if (!q) return projects.map((project) => ({ project, score: 0, ranges: [] }));

  const terms = q.split(/\s+/).filter(Boolean);
  const hits: Hit[] = [];

  for (const project of projects) {
    let total = 0;
    let ranges: [number, number][] = [];
    let matchedAll = true;

    for (const term of terms) {
      const r = scoreOne(project, term);
      if (r.score === 0) {
        matchedAll = false;
        break;
      }
      total += r.score;
      if (r.ranges.length) ranges = r.ranges;
    }

    if (!matchedAll) continue;

    if (terms.length > 1) total *= SCORE.termBonus ** (terms.length - 1);
    hits.push({ project, score: total, ranges });
  }


  return hits.sort(
    (a, b) => b.score - a.score || a.project.title.localeCompare(b.project.title),
  );
}


export function highlight(title: string, ranges: [number, number][]) {
  if (!ranges.length) return [{ text: title, hit: false }];
  const [start, end] = ranges[0];
  const out: { text: string; hit: boolean }[] = [];
  if (start > 0) out.push({ text: title.slice(0, start), hit: false });
  out.push({ text: title.slice(start, end), hit: true });
  if (end < title.length) out.push({ text: title.slice(end), hit: false });
  return out;
}
