"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "@/lib/navigation";
import Icon, { type IconName } from "./Icon";

/*
  Ein Button für die ganze Seite (DESIGN.md §5).
  - primary:   Markenfläche, weißer Text. Einer je Sichtbereich.
  - secondary: weiß, Rahmen line-strong.
  - quiet:     nur Text in Markenfarbe.
  - icon:      44×44 (sm: 40×40), nur Icon. Braucht IMMER `aria-label`.
  Beschriftung nennt die Handlung ("Rezept speichern"), ohne Pfeil, ohne Emoji.
*/

type Variant = "primary" | "secondary" | "quiet" | "icon";
type Size = "md" | "sm";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconFilled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

type ButtonAsButton = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };
type ButtonAsLink = BaseProps & { href: string; target?: string; rel?: string; onClick?: () => void; "aria-label"?: string; title?: string };
export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none " +
  "transition-colors duration-150 disabled:cursor-not-allowed rounded-1";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover disabled:bg-line disabled:text-ink-3",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-soft disabled:text-ink-3 disabled:border-line",
  quiet: "bg-transparent text-brand hover:text-brand-hover hover:underline underline-offset-[3px] disabled:text-ink-3 px-0",
  icon: "bg-surface text-ink border border-line-strong hover:bg-surface-soft disabled:text-ink-3 disabled:border-line p-0",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-base",
  sm: "h-10 px-4 text-sm",
};

const iconSizes: Record<Size, string> = {
  md: "h-11 w-11",
  sm: "h-10 w-10",
};

export function buttonClasses({ variant = "primary", size = "md", fullWidth = false, className = "" }: BaseProps) {
  const sizeClass = variant === "icon" ? iconSizes[size] : variant === "quiet" ? "h-auto text-base" : sizes[size];
  return [base, variants[variant], sizeClass, fullWidth ? "w-full" : "", className].filter(Boolean).join(" ");
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { variant = "primary", size = "md", icon, iconFilled, loading = false, fullWidth, className, children, ...rest } = props as BaseProps & Record<string, unknown>;
  const classes = buttonClasses({ variant, size, fullWidth, className });
  const iconPx = variant === "icon" ? 24 : 18;

  const content = loading ? (
    <>
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      />
      <span className="sr-only">Lädt</span>
      {variant !== "icon" && <span className="invisible">{children}</span>}
    </>
  ) : (
    <>
      {icon && <Icon name={icon} size={iconPx} filled={iconFilled} />}
      {variant !== "icon" && children}
    </>
  );

  if ("href" in props && typeof props.href === "string") {
    const { href, target, rel, onClick, title } = props;
    return (
      <Link
        href={href as "/"}
        target={target}
        rel={rel}
        onClick={onClick}
        title={title}
        aria-label={props["aria-label"]}
        className={classes}
        aria-busy={loading || undefined}
      >
        {content}
      </Link>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      ref={ref}
      type={buttonRest.type ?? "button"}
      {...buttonRest}
      disabled={buttonRest.disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
    >
      {content}
    </button>
  );
});

export default Button;
