import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

const variantStyles: Record<string, string> = {
  primary: "primary-gradient text-[var(--background)] shadow-sm hover:opacity-95",
  secondary:
    "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--muted-bg)]",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted-bg)]",
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
      className={`inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    />
  );
}
