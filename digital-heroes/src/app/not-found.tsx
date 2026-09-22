import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold text-white">Page not found</h1>
      <p className="mt-2 text-white/60">That page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Link href="/" className="mt-6 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black">
        Back home
      </Link>
    </main>
  );
}
