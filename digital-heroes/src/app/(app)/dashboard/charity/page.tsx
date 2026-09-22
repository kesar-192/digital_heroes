import { requireProfile } from "@/lib/auth/guards";
import { getActiveCharities } from "@/lib/charities/queries";
import { CharityForm } from "./charity-form";

export const metadata = { title: "Charity settings · Digital Heroes" };

export default async function CharitySettingsPage() {
  const { profile } = await requireProfile();
  const charities = await getActiveCharities();

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Charity settings</h1>
      <p className="mt-1 text-sm text-white/60">Change who you support and how much of your fee goes to them.</p>
      <CharityForm
        charities={charities}
        currentCharityId={profile.charity_id}
        currentPercent={profile.charity_percent}
      />
    </main>
  );
}
