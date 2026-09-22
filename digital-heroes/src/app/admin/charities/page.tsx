import { requireAdmin } from "@/lib/auth/guards";
import { NewCharityForm } from "./new-charity-form";
import { CharityRow } from "./charity-row";

export const metadata = { title: "Charities · Admin · Digital Heroes" };

export default async function AdminCharitiesPage() {
  const { supabase } = await requireAdmin();
  const { data: charities } = await supabase.from("charities").select("*").order("name");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Charities</h1>

      <NewCharityForm />

      <ul className="mt-8 space-y-3">
        {charities?.map((c) => (
          <CharityRow key={c.id} charity={c} />
        ))}
      </ul>
    </main>
  );
}
