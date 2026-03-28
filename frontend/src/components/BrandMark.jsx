import { useId } from "react";

// Marca espiral (gradiente azul, referencia orgánica / movimiento).
export function BrandMark({ className, size = 40 }) {
  const raw = useId();
  const gid = `bm-${raw.replace(/:/g, "")}`;

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" />
          <stop offset="0.42" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gid})`} strokeLinecap="round">
        <circle cx="24" cy="24" r="19" strokeWidth="3.2" strokeDasharray="78 125" transform="rotate(-38 24 24)" />
        <circle
          cx="24"
          cy="24"
          r="13.5"
          strokeWidth="3"
          strokeDasharray="52 155"
          transform="rotate(18 24 24)"
          opacity="0.92"
        />
        <circle cx="24" cy="24" r="8" strokeWidth="2.6" strokeDasharray="36 185" transform="rotate(88 24 24)" opacity="0.88" />
      </g>
    </svg>
  );
}
