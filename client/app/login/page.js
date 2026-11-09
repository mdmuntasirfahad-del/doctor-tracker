import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@doctor-tracker/auth";
import { LoginView } from "@/components/auth/login-view";
import { safeReturnTo } from "@/lib/safe-return-to";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params?.returnTo);
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect(safeReturnTo(params?.returnTo, session.user.role));
  }

  return <LoginView returnTo={returnTo} />;
}
