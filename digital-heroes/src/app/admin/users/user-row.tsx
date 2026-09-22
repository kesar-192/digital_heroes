"use client";

import { useTransition } from "react";
import { setUserRole } from "@/actions/users";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "subscriber";
  subscriptions: { status: string }[];
};

export function UserRow({ user }: { user: User }) {
  const [pending, startTransition] = useTransition();
  const latestStatus = user.subscriptions?.[0]?.status ?? "none";

  return (
    <li className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{user.full_name ?? user.email}</p>
        <p className="text-xs text-white/40">
          {user.email} · {latestStatus}
        </p>
      </div>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(() => setUserRole(user.id, user.role === "admin" ? "subscriber" : "admin"))
        }
        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-white/30 disabled:opacity-50"
      >
        {user.role === "admin" ? "Remove admin" : "Make admin"}
      </button>
    </li>
  );
}
