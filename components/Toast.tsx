"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  variant?: "success" | "error" | "info";
  open: boolean;
}

const variantStyles: Record<string, { border: string; glow: string; badge: string; label: string }> = {
  success: {
    border: "border-emerald-500/20",
    glow: "from-emerald-500/10 via-transparent to-transparent",
    badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    label: "text-emerald-400/90",
  },
  error: {
    border: "border-red-500/20",
    glow: "from-red-500/10 via-transparent to-transparent",
    badge: "bg-red-500/10 border-red-500/20 text-red-400",
    label: "text-red-400/90",
  },
  info: {
    border: "border-[var(--border)]/80",
    glow: "from-[var(--primary)]/10 via-transparent to-transparent",
    badge: "bg-slate-800/60 border-slate-700/60 text-slate-300",
    label: "text-slate-400",
  },
};

const variantLabels: Record<string, string> = {
  success: "Success",
  error: "Error",
  info: "Notification",
};

const variantIcons: Record<string, string> = {
  success: "✓",
  error: "⚠️",
  info: "ℹ️",
};

export function Toast({ message, variant = "info", open }: ToastProps) {
  const styles = variantStyles[variant] || variantStyles.info;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-4 sm:right-6 sm:top-6 z-50 w-[calc(100%-2rem)] sm:w-full sm:max-w-sm rounded-2xl border bg-[#0d131f] bg-gradient-to-br ${styles.glow} p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] select-none ${styles.border}`}
        >
          <div className="flex items-start gap-3.5">

            {/* ICON BADGE */}
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold shadow-sm ${styles.badge}`}>
              {variantIcons[variant]}
            </div>

            {/* TEXT STRINGS */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className={`text-[10px] font-bold uppercase tracking-widest ${styles.label}`}>
                {variantLabels[variant]}
              </div>
              {/* Clean, high-contrast white text that stays perfectly readable over the dark surface */}
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-100 tracking-wide">
                {message}
              </p>
            </div>

          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}