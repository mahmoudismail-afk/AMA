'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

// Global counter: how many modals are currently open.
// This prevents one modal closing from unlocking scroll while another is still open.
let openModalCount = 0;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // Unique id per modal so nested/stacked modals don't share the same aria-labelledby target
  const titleId = useId();

  // Keep latest onClose without re-running effects every render
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Only render portal after mount (avoids SSR mismatch)
  useEffect(() => { setMounted(true); }, []);

  // Escape to close + trap Tab focus inside the dialog
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Move focus into the dialog on open, and give it back to the trigger on close
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      // Prefer the first form field on desktop; on touch devices focus the dialog itself
      // so the on-screen keyboard doesn't pop up and cover the form.
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      const field = finePointer ? dialog.querySelector<HTMLElement>(
        '.modal-body input:not([disabled]):not([type="hidden"]), .modal-body select:not([disabled]), .modal-body textarea:not([disabled])'
      ) : null;
      (field ?? dialog).focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, mounted]);

  // Prevent body scroll — use a counter so multiple modals don't fight each other
  useEffect(() => {
    if (isOpen) {
      openModalCount++;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (isOpen) {
        openModalCount = Math.max(0, openModalCount - 1);
        if (openModalCount === 0) {
          document.body.style.overflow = '';
        }
      }
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return createPortal(
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div
        ref={dialogRef}
        className={`modal ${sizeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        <div className="modal-header">
          <h3 id={titleId} style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
