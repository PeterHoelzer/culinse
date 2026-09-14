import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de", "es", "fr", "it", "pl", "tr"],
  defaultLocale: "en",
  localePrefix: "always",
});
