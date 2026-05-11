"use server";

import { z } from "zod";

import { getAppUrl } from "@/lib/get-app-url";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.email() });

export async function forgotPasswordAction(
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: "Invalid email address." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/auth/reset-password`,
  });

  if (error) {
    return {
      success: false,
      error: "Something went wrong. Please try again later.",
    };
  }

  return { success: true };
}
