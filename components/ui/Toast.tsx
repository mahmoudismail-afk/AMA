'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type?: ToastType;
  /** Optional action button, e.g. { label: 'Undo', onClick } */
  action?: { label: string; onClick: () => void };
  /** Auto-dismiss after ms (default 4000, 6000 when there is an action) */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  message: string;
}

interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
  error: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
  info: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
}

const noop = () => {};
const ToastContext = createContext<ToastApi>({ show: noop, success: noop, error: noop, info: noop });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const COLORS = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--primary)' } as const;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    const id = nextId.current++;
    const duration = options.duration ?? (options.action ? 6000 : 4000);
    setToasts((prev) => [...prev.slice(-3), { id, message, ...options }]);
    window.setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const api: ToastApi = {
    show,
    success: (m, o) => show(m, { ...o, type: 'success' }),
    error: (m, o) => show(m, { ...o, type: 'error' }),
    info: (m, o) => show(m, { ...o, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => {
          const type = t.type ?? 'info';
          const Icon = ICONS[type];
          return (
            <div key={t.id} className={`toast toast-${type}`} role={type === 'error' ? 'alert' : undefined}>
              <Icon size={18} style={{ color: COLORS[type], flexShrink: 0 }} />
              <span className="toast-msg">{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
