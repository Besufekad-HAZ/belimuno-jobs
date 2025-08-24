import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "am", "om", "ti"],
  defaultLocale: "en",
  localePrefix: "never",
});
