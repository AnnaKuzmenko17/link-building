"use server";

import type { Role } from "@/types";

import {
  createSalesChatForClient,
  createSupportChatForUser,
} from "@/lib/data/chats";
import {
  activateUserAndGetRole,
  getUserRole,
  getUserRoleAndStatus,
} from "@/lib/data/users";
import { resolveRole } from "@/lib/resolve-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ActivateResult =
  | { success: true; role: Role }
  | { success: false; error: string };

// Called after the client has already updated the password via supabase.auth.updateUser().
// Handles profile activation for first-login, or just returns the role for change mode.
export async function activateSessionAction(
  mode: "first-login" | "change"
): Promise<ActivateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (mode === "first-login") {
    const existing = await getUserRoleAndStatus(supabase, user.id);

    if (existing?.status !== "pending") {
      const profile = await getUserRole(supabase, user.id);
      const role = resolveRole(profile?.role);
      if (!role)
        return {
          success: false,
          error: "Account configuration error. Please contact support.",
        };
      return { success: true, role };
    }

    const adminClient = createAdminClient();
    const profile = await activateUserAndGetRole(adminClient, user.id);
    const role = resolveRole(profile?.role);
    if (!role)
      return {
        success: false,
        error: "Account configuration error. Please contact support.",
      };

    if (profile?.role === "client") {
      await createSupportChatForUser(adminClient, user.id);
      await createSalesChatForClient(adminClient, user.id);
    }

    return { success: true, role };
  }

  const profile = await getUserRole(supabase, user.id);
  const role = resolveRole(profile?.role);
  if (!role)
    return {
      success: false,
      error: "Account configuration error. Please contact support.",
    };
  return { success: true, role };
}
