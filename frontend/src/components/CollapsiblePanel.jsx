import { useId, useState } from "react";

// Panel plegable accesible (tracking embebido: menos scroll).
export function CollapsiblePanel({ title, children, defaultOpen = false, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `${id}-panel`;

  return (
    <section className={`collapsible-panel ${className}`.trim()}>
      <button
        type="button"
        className="collapsible-panel__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        id={`${id}-btn`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="collapsible-panel__title">{title}</span>
        <span className="collapsible-panel__chev" aria-hidden data-open={open ? "true" : "false"}>
          ▼
        </span>
      </button>
      <div id={panelId} role="region" aria-labelledby={`${id}-btn`} hidden={!open}>
        {open ? <div className="collapsible-panel__inner">{children}</div> : null}
      </div>
    </section>
  );
}
