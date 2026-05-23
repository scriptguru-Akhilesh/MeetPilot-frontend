"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Toast } from "./Toast";

export type ToastVariant = "success" | "error" | "info";

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    variant: ToastVariant;
  } | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const value = useMemo(
    () => ({
      showToast: (message: string, variant: ToastVariant = "info") => {
        setToast({ message, variant });
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Toast open message={toast.message} variant={toast.variant} />
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}
