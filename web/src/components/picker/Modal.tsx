import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** id of the element labelling the dialog (e.g. its title heading). */
  labelledBy?: string;
  /** Fallback accessible name when there is no visible title element. */
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Minimal accessible modal dialog — the React replacement for Angular Material's
 * `MatDialog`. Renders an overlay with `role="dialog"`/`aria-modal`, closes on
 * Escape or backdrop click, and moves focus into the panel on open.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  ariaLabel,
  className,
  children
}: ModalProps): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={className ? `modal-panel ${className}` : "modal-panel"}
      >
        {children}
      </div>
    </div>
  );
}
