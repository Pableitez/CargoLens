import { ReactNode, useEffect, useId } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, closeLabel, children, className }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="app-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={className ? `app-modal ${className}` : "app-modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-modal__head">
          <h2 id={titleId} className="app-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="app-modal__close btn btn--ghost btn--icon"
            onClick={onClose}
            aria-label={closeLabel}
          >
            ×
          </button>
        </div>
        <div className="app-modal__body">{children}</div>
      </div>
    </div>
  );
}
