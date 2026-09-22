"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold text-white">Something went wrong</h1>
      <p className="mt-2 text-white/60">{error.message || "Please try again."}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black"
      >
        Try again
      </button>
    </main>
  );
}
