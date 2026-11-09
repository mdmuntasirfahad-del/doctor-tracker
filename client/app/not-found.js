"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
          <Compass size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-body">
          The page you are looking for has moved, or the link is no longer valid.
        </p>
        <Link href="/" className="btn-primary-brand mt-6 w-full">
          Return home
        </Link>
      </div>
    </main>
  );
}
