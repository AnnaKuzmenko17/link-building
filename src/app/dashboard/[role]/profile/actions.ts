"use server";

import { z } from "zod";

import { requireSession } from "@/lib/auth/get-session";
import {
  findUserByEmailExcluding,
  getUserById,
  updateUserAvatar,
  updateUserProfile,
} from "@/lib/data/users";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Result = { success: true } | { success: false; error: string };

const updateProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.email("Enter a valid email address"),
});

export async function updateProfileAction(input: {
  first_name: string;
  last_name: string;
  email: string;
}): Promise<Result> {
  const { user } = await requireSession();

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { first_name, last_name, email } = parsed.data;

  const adminClient = createAdminClient();

  if (email !== user.email) {
    const existing = await findUserByEmailExcluding(
      adminClient,
      email,
      user.id
    );
    if (existing) {
      return {
        success: false,
        error: "A user with this email already exists.",
      };
    }
  }

  const profile = await getUserById(adminClient, user.id);
  if (!profile) return { success: false, error: "Profile not found." };

  const { error } = await updateUserProfile(adminClient, user.id, {
    first_name,
    last_name,
    email,
    role: profile.role,
  });
  if (error)
    return {
      success: false,
      error: "Failed to update profile. Please try again.",
    };

  await adminClient.auth.admin.updateUserById(user.id, { email });

  return { success: true };
}

// ── Update Avatar ──────────────────────────────────────────────────────────

export async function updateAvatarAction(
  avatar_url: string | null
): Promise<Result> {
  const { user } = await requireSession();
  const admin = createAdminClient();

  const { error } = await updateUserAvatar(admin, user.id, avatar_url);
  if (error) return { success: false, error: "Failed to save avatar." };

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, avatar_url },
  });

  return { success: true };
}

// ── Change Password ────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<Result> {
  const { user } = await requireSession();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  if (!user.email) {
    return {
      success: false,
      error: "Unable to verify password. Please log in again.",
    };
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) {
    return { success: false, error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    return {
      success: false,
      error: "Failed to update password. Please try again.",
    };
  }

  return { success: true };
}
