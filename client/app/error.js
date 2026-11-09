"use client";

import { CircleAlert } from "lucide-react";

export default function ErrorPage({ reset }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
          <CircleAlert size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-body">
          The workspace could not complete that request. Try again, or return to the dashboard.
        </p>
        <button type="button" onClick={() => reset()} className="btn-primary-brand mt-6 w-full">
          Try again
        </button>
      </div>
    </main>
  );
}
