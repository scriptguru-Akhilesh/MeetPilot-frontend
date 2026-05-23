import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

const variantStyles: Record<string, string> = {
  primary: "bg-slate-950 text-white hover:bg-slate-800",
  secondary:
    "bg-white text-slate-950 border border-slate-200 hover:bg-slate-100",
  ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
};

const sizeStyles: Record<string, string> = {
  default: "h-11 px-5",
  sm: "h-9 px-3 rounded-lg",
  lg: "h-12 px-6 rounded-2xl",
};

export function Button({
  className = "",
  variant = "primary",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    />
  );
}
