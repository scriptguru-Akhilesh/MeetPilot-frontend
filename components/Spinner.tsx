"use client";

import React from "react";

/**
 * 1. Independent Modern Dot Pulse Spinner
 * Great for whole pages, cards, or section containers
 */
export function LoadingDots() {
    return (
        <div className="flex items-center justify-center space-x-2 py-3 w-full h-full m-auto" >
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes modern-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        .animate-dot { animation: modern-bounce 1.2s infinite ease-in-out; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
      `}} />
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary)] animate-dot" />
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary)] animate-dot delay-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary)] animate-dot delay-400" />
        </div>
    );
}

/**
 * 2. Inline Button Spinner
 * Sleek, high-fidelity circular tracker designed to align with text sizes
 */
export function ButtonSpinner({ className = "h-5 w-5" }: { className?: string }) {
    return (
        <svg
            className={`animate-spin text-current ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3.5"
            />
            <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}