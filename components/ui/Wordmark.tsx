import { Link } from "@/lib/navigation";

/*
  Die Wortmarke als Text statt als 44-KB-PNG: skaliert scharf, braucht kein
  width/height, kein zweites Bild für dunkle Flächen. "nse" in Markenfarbe.
*/
export default function Wordmark({
  onDark = false,
  size = "md",
  href = "/",
  className = "",
}: {
  onDark?: boolean;
  size?: "md" | "lg";
  href?: string;
  className?: string;
}) {
  const text = size === "lg" ? "text-[28px]" : "text-[24px]";
  return (
    <Link
      href={href as "/"}
      aria-label="Culinse Startseite"
      className={[
        "inline-flex items-center font-sans font-bold leading-none tracking-[-0.02em] no-underline hover:no-underline",
        text,
        onDark ? "text-white" : "text-ink",
        className,
      ].join(" ")}
    >
      culi<span className={onDark ? "text-brand-on-dark" : "text-brand"}>nse</span>
    </Link>
  );
}
