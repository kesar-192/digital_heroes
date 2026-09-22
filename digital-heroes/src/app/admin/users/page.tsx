import { requireAdmin } from "@/lib/auth/guards";
import { UserRow } from "./user-row";

export const metadata = { title: "Users · Admin · Digital Heroes" };

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, subscriptions(status)")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-white">Users</h1>

      <ul className="mt-8 space-y-2">
        {users?.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
      </ul>
    </main>
  );
}
