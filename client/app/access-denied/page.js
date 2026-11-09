import Link from "next/link";
import { ShieldX } from "lucide-react";

export const metadata = {
  title: "Access denied",
};

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6">
      <section className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
          <ShieldX size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Administrator access required</h1>
        <p className="mt-2 text-sm leading-6 text-body">
          This workspace is restricted to administrator accounts. Sign in with an administrator
          account or return to the public site.
        </p>
        <Link href="/" className="btn-primary-brand mt-6 w-full">
          Return home
        </Link>
      </section>
    </main>
  );
}
