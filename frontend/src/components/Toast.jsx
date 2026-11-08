import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/40'
                : isError
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/40'
                : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200 shadow-indigo-950/40'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {isInfo && <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}

            <div className="flex-1 text-sm">
              {toast.title && <div className="font-semibold">{toast.title}</div>}
              <div className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
