import type { ReactNode } from "react";
import type { IconName } from "./Icon";

/*
  Klassen-Helfer ohne "use client": dürfen aus Server- und Client-Komponenten
  importiert werden (z. B. <a className={buttonClasses(...)}> in Server-Seiten).
*/
export type ButtonVariant = "primary" | "secondary" | "quiet" | "icon";
export type ButtonSize = "md" | "sm";

export interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconFilled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none " +
  "transition-colors duration-150 disabled:cursor-not-allowed rounded-1";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover disabled:bg-line disabled:text-ink-3",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-soft disabled:text-ink-3 disabled:border-line",
  quiet: "bg-transparent text-brand hover:text-brand-hover hover:underline underline-offset-[3px] disabled:text-ink-3 px-0",
  icon: "bg-surface text-ink border border-line-strong hover:bg-surface-soft disabled:text-ink-3 disabled:border-line p-0",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-base",
  sm: "h-10 px-4 text-sm",
};

const iconSizes: Record<ButtonSize, string> = {
  md: "h-11 w-11",
  sm: "h-10 w-10",
};

export function buttonClasses({ variant = "primary", size = "md", fullWidth = false, className = "" }: ButtonBaseProps) {
  const sizeClass = variant === "icon" ? iconSizes[size] : variant === "quiet" ? "h-auto text-base" : sizes[size];
  return [base, variants[variant], sizeClass, fullWidth ? "w-full" : "", className].filter(Boolean).join(" ");
}

export function chipClasses(active = false, size: "md" | "sm" = "md", className = "") {
  return [
    "inline-flex shrink-0 items-center gap-1.5 rounded-pill border font-semibold whitespace-nowrap transition-colors duration-150",
    size === "md" ? "h-9 px-3.5 text-sm" : "h-8 px-3 text-sm",
    active
      ? "bg-brand border-brand text-white hover:bg-brand-hover hover:border-brand-hover"
      : "bg-surface border-line-strong text-ink hover:bg-surface-soft",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
