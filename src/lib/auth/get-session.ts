import { redirect } from "next/navigation";
import { cache } from "react";

import type { Role } from "@/types";
import type { User } from "@supabase/supabase-js";

import { resolveRole } from "@/lib/resolve-role";
import { createClient } from "@/lib/supabase/server";

export interface AuthSession {
  user: User;
  role: Role;
}

// cache() deduplicates calls within a single Server Component render tree.
// It has no effect inside Server Actions (each action is an independent request).
export const requireSession = cache(async (): Promise<AuthSession> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = resolveRole(user.user_metadata?.role);
  if (!role) {
    redirect("/login");
  }

  return { user, role };
});
