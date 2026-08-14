import { useMemo } from "react";
import { identity } from "../lib/identity";


export function IdentityMark({
  slug,
  title,
  size = 48,
  radius,
}: {
  slug: string;
  title: string;
  size?: number;
  radius?: number;
}) {
  const id = useMemo(() => identity(slug, title), [slug, title]);


  const r = radius ?? 48 * 0.26;


  const gid = `im-${slug}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="identity-mark"
      style={{ ["--mark-glow" as string]: id.glow }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={id.from} />
          <stop offset="100%" stopColor={id.to} />
        </linearGradient>


        <linearGradient id={`${gid}-sheen`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.20" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="48" height="48" rx={r} fill={`url(#${gid}-bg)`} />
      <rect x="0" y="0" width="48" height="48" rx={r} fill={`url(#${gid}-sheen)`} />

      <rect
        x="0.5"
        y="0.5"
        width="47"
        height="47"
        rx={r - 0.5}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.22"
      />

      <text
        x="24"
        y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="600"
        letterSpacing="-0.5"
        fill="#fff"
        fillOpacity="0.94"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {id.monogram}
      </text>
    </svg>
  );
}
