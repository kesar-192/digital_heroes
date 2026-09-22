import { getActiveCharities } from "@/lib/charities/queries";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up · Digital Heroes" };

export default async function SignupPage() {
  const charities = await getActiveCharities();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold text-white">Create your account</h1>
      <p className="mt-1 text-sm text-white/60">
        Every subscription sends part of your fee to a cause you pick below.
      </p>
      <SignupForm charities={charities} />
    </main>
  );
}
