import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "am", "om", "ti"],
  defaultLocale: "en",
  // Disable prefixing the locale in the URL
  localePrefix: "never",
});

export const config = {
  // Match only internationalized pathnames
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
