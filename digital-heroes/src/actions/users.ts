"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";

export async function setUserRole(userId: string, role: "admin" | "subscriber") {
  const { supabase, profile } = await requireAdmin();

  if (userId === profile.id && role !== "admin") {
    throw new Error("You can't remove your own admin access.");
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}
