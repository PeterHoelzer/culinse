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

import { buttonClasses, type ButtonBaseProps as BaseProps, type ButtonVariant as Variant, type ButtonSize as Size } from "./styles";
export { buttonClasses };

type ButtonAsButton = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };
type ButtonAsLink = BaseProps & { href: string; target?: string; rel?: string; onClick?: () => void; "aria-label"?: string; title?: string };
export type ButtonProps = ButtonAsButton | ButtonAsLink;

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
