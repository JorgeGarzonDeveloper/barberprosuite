"use client";

import { AlertTriangle, Trash2, ToggleLeft, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "gold";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const colors = {
    danger: {
      icon: "bg-red-500/10 border-red-500/20 text-red-400",
      btn: "bg-red-500 hover:bg-red-600 text-white",
    },
    warning: {
      icon: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
      btn: "bg-yellow-500 hover:bg-yellow-600 text-black",
    },
    gold: {
      icon: "bg-gold-500/10 border-gold-500/20 text-gold-400",
      btn: "bg-gold-500 hover:bg-gold-400 text-black",
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-barber-secondary border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${colors.icon}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>

        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-white/40 text-sm leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-white/50 bg-white/5 border border-white/10 rounded-xl hover:text-white hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${colors.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
