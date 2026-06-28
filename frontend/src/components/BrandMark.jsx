import { useId } from "react";

/** Trade route arc behind the N (origin → destination). */
const ROUTE = "M 13.5 14.5 Q 24 27 34.5 33.5";
/** Bold N letterform — maritime / navigation mark. */
const N_PATH = "M 15 34 V 14 L 33 34 V 14";
/** Compass ring — subtle chart / ops context. */
const RING = "M 24 22 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0";
/** Cardinal ticks on the ring. */
const TICKS = ["M 24 6.5 V 9.5", "M 24 34.5 V 37.5", "M 7.5 22 H 10.5", "M 37.5 22 H 40.5"];
const WAVE = "M 6 40.5 Q 14 37.5 24 39.5 T 42 40.5";

/** NaoLab mark — route N on compass ring + ocean line. */
export function BrandMark({ className, size = 40 }) {
  const raw = useId();
  const gid = `nl-${raw.replace(/:/g, "")}`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="8" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" stopOpacity="0.45" />
          <stop offset="0.4" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-strong)" />
        </linearGradient>
        <linearGradient id={`${gid}-route`} x1="13" y1="14" x2="35" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" stopOpacity="0.15" />
          <stop offset="1" stopColor="var(--accent-strong)" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <circle cx="13.5" cy="14.5" r="2.1" fill={`url(#${gid})`} opacity="0.85" />
      <circle cx="34.5" cy="33.5" r="2.1" fill={`url(#${gid})`} opacity="0.85" />

      <path d={RING} fill="none" stroke={`url(#${gid})`} strokeWidth="1.15" strokeOpacity="0.28" />

      <g stroke={`url(#${gid})`} strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.38">
        {TICKS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      <path
        d={ROUTE}
        fill="none"
        stroke={`url(#${gid}-route)`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="1 0"
      />

      <path
        d={N_PATH}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d={WAVE}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
    </svg>
  );
}
