import Link from "next/link";
import type { CopperCityLocale } from "@/lib/copper-city";
import { privacyPath, SUPPORT_MAIL } from "@/lib/copper-city";
import LanguageLinks from "./LanguageLinks";

/** Ersetzt {mail} durch den verlinkten Support-Kontakt. */
function withMail(text: string, mailto: string) {
  const parts = text.split("{mail}");
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <a href={mailto} className="font-semibold text-orange-600 hover:underline">
          {SUPPORT_MAIL}
        </a>
      )}
    </span>
  ));
}

/** Macht reportaproblem.apple.com im Text anklickbar. */
function withAppleLink(text: string) {
  const host = "reportaproblem.apple.com";
  if (!text.includes(host)) return text;
  const parts = text.split(host);
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <a
          href={`https://${host}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:underline"
        >
          {host}
        </a>
      )}
    </span>
  ));
}

export default function LocalizedSupport({ locale }: { locale: CopperCityLocale }) {
  const t = locale.support;
  const mailto = `mailto:${SUPPORT_MAIL}?subject=${encodeURIComponent(t.mailSubject)}`;
  const privacyHref = privacyPath(locale.code);

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-gray-900">🔎 Copper City</span>
          <div className="flex items-center gap-4 text-sm">
            <Link href={privacyHref} className="text-orange-500 hover:underline">
              {t.privacyLink}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.heading}</h1>
        <p className="text-gray-400 text-sm mb-8">{t.subheading}</p>

        {/* Kontakt zuerst (App Store Guideline 1.5) */}
        <section className="mb-10 rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.contactHeading}</h2>
          <p className="text-gray-700 leading-relaxed mb-4">{withMail(t.contactBody, mailto)}</p>
          <a
            href={mailto}
            className="inline-block rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
          >
            ✉️ {t.contactButton}
          </a>
          <p className="text-gray-500 text-sm mt-4">{t.contactNote}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t.aboutHeading}</h2>
          <p className="text-gray-600 leading-relaxed">{t.aboutBody}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t.faqHeading}</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            {t.faq.map((item) => (
              <p key={item.q}>
                <b className="text-gray-800">{item.q}</b>
                <br />
                {item.a}
              </p>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t.purchaseHeading}</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            {t.purchaseFaq.map((item) => (
              <p key={item.q}>
                <b className="text-gray-800">{item.q}</b>
                <br />
                {withAppleLink(item.a)}
              </p>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t.legalHeading}</h2>
          <p className="text-gray-600 leading-relaxed">
            <Link href={privacyHref} className="text-orange-500 hover:underline">
              {t.privacyLink}
            </Link>{" "}
            ·{" "}
            <Link href="/impressum" className="text-orange-500 hover:underline">
              {t.imprintLink}
            </Link>
            <br />
            {t.legalBody}
          </p>
        </section>

        <LanguageLinks kind="support" current={locale.code} label={t.otherLanguages} />
      </main>
    </div>
  );
}
