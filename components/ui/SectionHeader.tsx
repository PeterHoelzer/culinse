import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";

/*
  Abschnittskopf (DESIGN.md §3): Titel links in Serife, optional ein Satz
  darunter, rechts ein Link "Alle …". Nichts zentriert, keine Eyebrows.
*/
export default function SectionHeader({
  title,
  subtitle,
  linkHref,
  linkLabel,
  as: Heading = "h2",
  id,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  linkHref?: string;
  linkLabel?: ReactNode;
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
}) {
  return (
    <div className={["mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2", className].join(" ")}>
      <div className="min-w-0">
        <Heading id={id} className={Heading === "h1" ? "text-h1-sm sm:text-h1" : Heading === "h2" ? "text-h2-sm sm:text-h2" : "text-h3"}>
          {title}
        </Heading>
        {subtitle && <p className="mt-1 text-base text-ink-2">{subtitle}</p>}
      </div>
      {linkHref && linkLabel && (
        <Link href={linkHref as "/"} className="shrink-0 text-base font-semibold text-brand hover:text-brand-hover hover:underline underline-offset-[3px]">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
