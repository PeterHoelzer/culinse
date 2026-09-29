import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de", "es", "fr", "it", "pl", "tr", "nl", "cs", "ru", "pt"],
  defaultLocale: "en",
  localePrefix: "always",
});
