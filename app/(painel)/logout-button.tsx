"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={sair}
      className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-neutral-400"
    >
      Sair
    </button>
  );
}
