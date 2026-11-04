// Datenmodell für die Copper-City-Seiten (Support + Datenschutz) und die Store-Texte
// in allen Sprachen. Eine Datei pro Sprache unter lib/copper-city/locales/<code>.ts.

export type CopperCityLocaleCode =
  | "de"
  | "en"
  | "fr"
  | "es"
  | "it"
  | "pt-BR"
  | "ja"
  | "zh-Hant"
  | "zh-Hans"
  | "ko"
  | "nl"
  | "sv"
  | "da"
  | "no"
  | "tr"
  | "pl"
  | "ru";

export interface FaqItem {
  q: string;
  a: string;
}

export interface SupportTexts {
  /** <title> der Seite */
  metaTitle: string;
  metaDescription: string;
  /** Sprachname in der Sprache selbst, z. B. "Deutsch", "Français" */
  languageName: string;
  heading: string;
  /** Zeile unter der Überschrift, nennt den App-Namen in dieser Sprache */
  subheading: string;
  contactHeading: string;
  /** Fließtext; {mail} wird durch die E-Mail-Adresse ersetzt */
  contactBody: string;
  contactButton: string;
  /** Hinweiszeile unter dem Button: kein Konto, keine Werbung, 2 h gratis, Einmalkauf */
  contactNote: string;
  aboutHeading: string;
  aboutBody: string;
  faqHeading: string;
  faq: FaqItem[];
  purchaseHeading: string;
  purchaseFaq: FaqItem[];
  legalHeading: string;
  privacyLink: string;
  imprintLink: string;
  /** "Herausgeber: Peter Hölzer, Deutschland. Schriften unter …" */
  legalBody: string;
  /** Link-Text zur Sprachübersicht */
  otherLanguages: string;
  /** Betreff der Support-Mail */
  mailSubject: string;
}

export interface PrivacySection {
  heading: string;
  /** Absätze; {mail} = E-Mail, {privacyApple} = Link-Text apple.com/legal/privacy */
  paragraphs: string[];
}

export interface PrivacyTexts {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  /** z. B. "Stand: November 2026" */
  dateLine: string;
  /** Einleitung: App läuft auf dem Gerät, erhebt keine Daten, Ausnahme Kauf über Apple */
  intro: string;
  sections: PrivacySection[];
  supportLink: string;
  imprintLink: string;
}

export interface StoreTexts {
  /** App-Store-Sprache, wie App Store Connect sie nennt */
  appStoreLanguage: string;
  /** max. 30 Zeichen */
  name: string;
  /** max. 30 Zeichen */
  subtitle: string;
  /** max. 4000 Zeichen */
  description: string;
  /** max. 100 Zeichen, kommagetrennt, ohne Leerzeichen */
  keywords: string;
  /** max. 170 Zeichen */
  promotionalText: string;
  whatsNew: string;
  /** In-App-Kauf: Anzeigename, max. 30 Zeichen */
  iapDisplayName: string;
  /** In-App-Kauf: Beschreibung, max. 45 Zeichen */
  iapDescription: string;
}

export interface CopperCityLocale {
  code: CopperCityLocaleCode;
  /** BCP-47 für <html lang> */
  htmlLang: string;
  support: SupportTexts;
  privacy: PrivacyTexts;
  store: StoreTexts;
}
