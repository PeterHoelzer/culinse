// This route is never served — middleware redirects /login → /en/login.
// Kept as a fallback redirect in case middleware is bypassed.
import { redirect } from "next/navigation";

export default function LoginFallback() {
  redirect("/en/login");
}
