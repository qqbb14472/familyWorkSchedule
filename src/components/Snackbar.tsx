import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
}

interface SnackbarProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Snackbar: React.FC<SnackbarProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <SnackbarItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

interface SnackbarItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const SnackbarItem: React.FC<SnackbarItemProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const config = {
    error: {
      bg: 'bg-red-50 text-red-900 border-red-200 shadow-red-100',
      iconBg: 'bg-red-100 text-red-600',
      icon: AlertCircle,
      title: 'Database Error',
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: CheckCircle2,
      title: 'Success',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-900 border-amber-200 shadow-amber-100',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: AlertTriangle,
      title: 'Warning',
    },
    info: {
      bg: 'bg-blue-50 text-blue-900 border-blue-200 shadow-blue-100',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: Info,
      title: 'Notice',
    },
  }[toast.type];

  const IconComponent = config.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${config.bg}`}
      role="alert"
    >
      <div className={`p-2 rounded-lg shrink-0 ${config.iconBg}`}>
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="text-sm font-semibold tracking-tight">{config.title}</h4>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
