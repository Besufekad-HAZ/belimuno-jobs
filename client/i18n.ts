import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

const getLocales = ["en", "am", "om", "ti"];

export default getRequestConfig(async ({ locale }) => {
  if (!locale || !getLocales.includes(locale)) notFound();
  return {
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
