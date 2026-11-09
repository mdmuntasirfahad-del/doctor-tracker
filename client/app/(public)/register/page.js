import { RegisterView } from "@/components/public/register-view";

export const metadata = {
  title: "Register",
  description:
    "Register as a doctor or patient. Every request is reviewed by the workspace administrator.",
};

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const initialType = params?.type === "patient" ? "patient" : "doctor";

  return <RegisterView initialType={initialType} />;
}
