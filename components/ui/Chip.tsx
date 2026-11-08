"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "@/lib/navigation";
import Icon, { type IconName } from "./Icon";

/*
  Filter-Chip (DESIGN.md §5): die einzige Pille im System.
  36 px hoch, Text 14/600. Inaktiv weiß mit Rahmen, aktiv Markenfläche.
  Kein Emoji vor dem Label; optional ein Strich-Icon (16 px).
*/

interface ChipBase {
  active?: boolean;
  icon?: IconName;
  size?: "md" | "sm";
  className?: string;
  children: ReactNode;
}

type ChipButton = ChipBase & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };
type ChipLink = ChipBase & { href: string };

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

export default function Chip(props: ChipButton | ChipLink) {
  const { active = false, icon, size = "md", className = "", children } = props;
  const classes = chipClasses(active, size, className);
  const inner = (
    <>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </>
  );

  if ("href" in props && typeof props.href === "string") {
    return (
      <Link href={props.href as "/"} className={classes} aria-current={active ? "true" : undefined}>
        {inner}
      </Link>
    );
  }

  const { active: _a, icon: _i, size: _s, className: _c, children: _ch, href: _h, ...rest } = props as ChipButton;
  return (
    <button type="button" aria-pressed={active} {...rest} className={classes}>
      {inner}
    </button>
  );
}

/** Horizontale Chip-Reihe: scrollt mobil, bricht ab sm um. */
export function ChipRow({ children, className = "", wrap = true }: { children: ReactNode; className?: string; wrap?: boolean }) {
  return (
    <div
      className={[
        "flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0",
        wrap ? "sm:flex-wrap sm:overflow-visible" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
