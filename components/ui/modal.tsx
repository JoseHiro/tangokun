"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const MODAL_OVERLAY_CLASS =
  "fixed inset-0 z-50 flex items-end sm:items-center justify-center";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Top bar label. Omit for close-only header (put the main title in `children` with `titleId`). */
  headerTitle?: string;
  /** Id of the visible title (header text or first heading in `children`) for `aria-labelledby` */
  titleId?: string;
  size?: "sm" | "md";
  closeLabel?: string;
};

export function Modal({
  open,
  onClose,
  children,
  headerTitle,
  titleId = "modal-title",
  size = "sm",
  closeLabel = "Close",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const maxW = size === "md" ? "sm:max-w-md" : "sm:max-w-sm";

  /* Portal avoids inheriting e.g. `uppercase` from a parent <th> when the trigger lives in a table header. */
  return createPortal(
    <div className={MODAL_OVERLAY_CLASS} onClick={onClose} role="presentation">
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div
        className={`relative z-10 w-full ${maxW} max-h-[80vh] flex flex-col normal-case bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          className={`flex items-center shrink-0 px-5 py-3 border-b border-gray-100 dark:border-gray-800 ${
            headerTitle ? "justify-between" : "justify-end"
          }`}
        >
          {headerTitle ? (
            <p id={titleId} className="text-sm font-semibold text-gray-800 dark:text-gray-200 pr-2">
              {headerTitle}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0 p-1 -mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={closeLabel}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 normal-case">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
