import Link from "next/link";
import type { CopperCityLocale } from "@/lib/copper-city";
import { supportPath, SUPPORT_MAIL } from "@/lib/copper-city";
import LanguageLinks from "./LanguageLinks";

const APPLE_PRIVACY = "https://www.apple.com/legal/privacy/";

/** Ersetzt {mail} und {privacyApple} durch Links. */
function render(text: string) {
  const tokens = text.split(/(\{mail\}|\{privacyApple\})/);
  return tokens.map((tok, i) => {
    if (tok === "{mail}") {
      return (
        <a key={i} href={`mailto:${SUPPORT_MAIL}`} className="text-orange-500 hover:underline">
          {SUPPORT_MAIL}
        </a>
      );
    }
    if (tok === "{privacyApple}") {
      return (
        <a
          key={i}
          href={APPLE_PRIVACY}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:underline"
        >
          apple.com/legal/privacy
        </a>
      );
    }
    return <span key={i}>{tok}</span>;
  });
}

export default function LocalizedPrivacy({ locale }: { locale: CopperCityLocale }) {
  const t = locale.privacy;
  const supportHref = supportPath(locale.code);

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href={supportHref} className="font-semibold text-gray-900">
            🔎 Copper City
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href={supportHref} className="text-orange-500 hover:underline">
              {t.supportLink}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.heading}</h1>
        <p className="text-gray-400 text-sm mb-8">{t.dateLine}</p>

        <section className="mb-8">
          <p className="text-gray-600 leading-relaxed">{t.intro}</p>
        </section>

        {t.sections.map((s) => (
          <section key={s.heading} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className={`text-gray-600 leading-relaxed${i < s.paragraphs.length - 1 ? " mb-3" : ""}`}>
                {render(p)}
              </p>
            ))}
          </section>
        ))}

        <p className="text-gray-600 leading-relaxed">
          <Link href={supportHref} className="text-orange-500 hover:underline">
            {t.supportLink}
          </Link>{" "}
          ·{" "}
          <Link href="/impressum" className="text-orange-500 hover:underline">
            {t.imprintLink}
          </Link>
        </p>

        <LanguageLinks kind="privacy" current={locale.code} label={locale.support.otherLanguages} />
      </main>
    </div>
  );
}
