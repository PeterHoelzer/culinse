import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

/*
  Leer-, Fehler- und Ladezustände (DESIGN.md §5 „Zustände“).
  Ein Satz, was ist, und eine Handlung. Kein Emoji, kein Ausrufezeichen.
*/
export default function EmptyState({
  icon = "utensils",
  title,
  text,
  action,
  tone = "neutral",
  className = "",
}: {
  icon?: IconName;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "error" | "warn";
  className?: string;
}) {
  const iconColor = tone === "error" ? "text-error" : tone === "warn" ? "text-warn" : "text-line-strong";
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={["flex flex-col items-start gap-3 rounded-2 bg-surface-soft px-6 py-8 sm:items-center sm:text-center", className].join(" ")}
    >
      <Icon name={icon} size={32} className={iconColor} />
      <p className="text-h3 font-serif text-ink">{title}</p>
      {text && <p className="max-w-prose text-base text-ink-2">{text}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Platzhalter-Karte beim Laden; Puls nur ohne prefers-reduced-motion */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={["rounded-2 bg-surface-soft motion-safe:animate-pulse", className].join(" ")} />;
}

/** Hinweiskasten (Info, Warnung, Fehler) im Textfluss */
export function Notice({
  tone = "info",
  children,
  className = "",
}: {
  tone?: "info" | "warn" | "error" | "success";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "bg-brand-soft text-ink",
    warn: "bg-warn-soft text-warn",
    error: "bg-error-soft text-error",
    success: "bg-green-soft text-green-deep",
  }[tone];
  const icon: IconName = tone === "error" ? "alert" : tone === "warn" ? "alert" : tone === "success" ? "check" : "info";
  return (
    <div role={tone === "error" ? "alert" : tone === "success" ? "status" : undefined} className={["flex items-start gap-2.5 rounded-2 px-4 py-3 text-sm", styles, className].join(" ")}>
      <Icon name={icon} size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
