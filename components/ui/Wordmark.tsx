import NextLink from "next/link";
import { Link } from "@/lib/navigation";

/*
  Die Wortmarke als Text statt als 44-KB-PNG: skaliert scharf, braucht kein
  width/height, kein zweites Bild für dunkle Flächen. "nse" in Markenfarbe.

  plain: für Seiten außerhalb des [locale]-Baums (/impressum, /datenschutz).
  Der sprachabhängige Link braucht den next-intl-Kontext und wirft dort sonst
  "No intl context found", die Seite antwortet dann mit 500.
*/
export default function Wordmark({
  onDark = false,
  size = "md",
  href = "/",
  className = "",
  plain = false,
}: {
  onDark?: boolean;
  size?: "md" | "lg";
  href?: string;
  className?: string;
  plain?: boolean;
}) {
  const text = size === "lg" ? "text-[28px]" : "text-[24px]";
  const classes = [
    "inline-flex items-center font-sans font-bold leading-none tracking-[-0.02em] no-underline hover:no-underline",
    text,
    onDark ? "text-white" : "text-ink",
    className,
  ].join(" ");
  const label = (
    <>
      culi<span className={onDark ? "text-brand-on-dark" : "text-brand"}>nse</span>
    </>
  );
  if (plain) {
    return (
      <NextLink href={href} aria-label="Culinse Startseite" className={classes}>
        {label}
      </NextLink>
    );
  }
  return (
    <Link href={href as "/"} aria-label="Culinse Startseite" className={classes}>
      {label}
    </Link>
  );
}
