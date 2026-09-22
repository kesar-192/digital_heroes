import { requireAdmin } from "@/lib/auth/guards";
import { CreateDrawButton } from "./create-draw-button";
import { DrawControls } from "./draw-controls";

export const metadata = { title: "Draws · Admin · Digital Heroes" };

export default async function AdminDrawsPage() {
  const { supabase } = await requireAdmin();

  const { data: draws } = await supabase
    .from("draws")
    .select("*")
    .order("period", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Draws</h1>
        <CreateDrawButton />
      </div>

      <div className="mt-8 space-y-6">
        {draws?.map((draw) => (
          <div key={draw.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="font-medium text-white">
                {new Date(draw.period).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs uppercase text-white/60">
                {draw.status}
              </span>
            </div>

            {draw.status === "published" ? (
              <div className="mt-3 text-sm text-white/70">
                <p>Winning numbers: {draw.winning_numbers?.join(", ")}</p>
                <p className="mt-1 text-white/50">
                  Pool: £{(draw.pool_total_minor / 100).toFixed(2)} · Published{" "}
                  {new Date(draw.published_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <DrawControls drawId={draw.id} />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
