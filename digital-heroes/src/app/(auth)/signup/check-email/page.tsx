export const metadata = { title: "Check your email · Digital Heroes" };

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-white">Check your email</h1>
      <p className="mt-2 text-white/60">
        We&apos;ve sent a confirmation link. Click it to activate your account, then sign in.
      </p>
    </main>
  );
}
