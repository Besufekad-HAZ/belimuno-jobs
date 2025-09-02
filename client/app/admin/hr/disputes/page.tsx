import { redirect } from "next/navigation";

export default function Page() {
  // Redirect to localized HR disputes page if someone hits non-localized route
  redirect("/en/admin/hr/disputes");
}
