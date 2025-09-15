import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function Page() {
  // Use app routing default locale to avoid hardcoding
  const locale = routing.defaultLocale || "en";
  redirect(`/${locale}/worker/dashboard`);
}
