

export type Link = {
  label: string;
  url: string;
  primary: boolean;
};

export type Project = {
  title: string;
  category: string | null;
  description: string;
  url: string | null;
  links: Link[];

  slug: string;
};

export type Catalogue = {
  projects: Project[];
  count: number;

  fetched_at: number;

  stale: boolean;
};

export type Environment = {
  platform: string;
  arch: string;
  app_version: string;
  webview: string;
  custom_chrome: boolean;
};


export function primaryLink(p: Project): Link | null {
  return p.links.find((l) => l.primary) ?? p.links[0] ?? null;
}

export function secondaryLinks(p: Project): Link[] {
  const primary = primaryLink(p);
  return p.links.filter((l) => l !== primary);
}


export function linkKind(label: string): "download" | "source" | "docs" | "open" {
  const l = label.toLowerCase();
  if (l.includes("download")) return "download";
  if (l.includes("source") || l.includes("github")) return "source";
  if (l.includes("doc")) return "docs";
  return "open";
}
