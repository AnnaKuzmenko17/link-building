import type { Role, User } from "@/types";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

// ── Shared types ──────────────────────────────────────────────────────────────

export type UserWithManager = User & {
  manager: Pick<User, "first_name" | "last_name"> | null;
};

export type ActiveOrderForReassign = {
  id: string;
  publish_month: string;
  site: { domain: string };
};

export type ActiveCopywriter = Pick<User, "id" | "first_name" | "last_name">;

// ── Private helpers ───────────────────────────────────────────────────────────

const ACTIVE_ORDER_STATUSES = [
  "new",
  "in_progress",
  "content_sent",
  "needs_changes",
  "content_approved",
] as const;

const VALID_STATUS_VALUES = ["pending", "active", "disabled"] as const;
type ValidStatus = (typeof VALID_STATUS_VALUES)[number];

function isValidRole(
  v: string
): v is "client" | "manager" | "copywriter" | "sourcer" | "admin" {
  return ["client", "manager", "copywriter", "sourcer", "admin"].includes(v);
}

function isValidStatus(v: string): v is ValidStatus {
  return (VALID_STATUS_VALUES as readonly string[]).includes(v);
}

async function attachManagers(
  supabase: Client,
  users: User[]
): Promise<UserWithManager[]> {
  const managerIds = [
    ...new Set(
      users.filter((u) => u.manager_id).map((u) => u.manager_id as string)
    ),
  ];

  if (managerIds.length === 0) {
    return users.map((u) => ({ ...u, manager: null }));
  }

  const { data: managers } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .in("id", managerIds);

  const managerMap = new Map(
    (managers ?? []).map((m) => [
      m.id,
      { first_name: m.first_name, last_name: m.last_name },
    ])
  );

  return users.map((u) => ({
    ...u,
    manager: u.manager_id ? (managerMap.get(u.manager_id) ?? null) : null,
  }));
}

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function getUserList(
  supabase: Client,
  filters: { role?: string; status?: string; search?: string } = {}
): Promise<UserWithManager[]> {
  let query = supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.role && isValidRole(filters.role))
    query = query.eq("role", filters.role);
  if (filters.status && isValidStatus(filters.status))
    query = query.eq("status", filters.status);
  if (filters.search) {
    const term = `%${filters.search.slice(0, 255)}%`;
    query = query.or(
      `email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load users: ${error.message}`);
  return attachManagers(supabase, data ?? []);
}

export async function getUserById(
  supabase: Client,
  id: string
): Promise<UserWithManager | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) console.error("[getUserById]", error.code, error.message);
  if (!data) return null;
  const [withManager] = await attachManagers(supabase, [data]);
  return withManager ?? null;
}

export async function getActiveManagers(
  supabase: Client
): Promise<Pick<User, "id" | "first_name" | "last_name">[]> {
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "manager")
    .eq("status", "active")
    .order("first_name");

  return data ?? [];
}

export async function getActiveClients(
  supabase: Client
): Promise<Pick<User, "id" | "first_name" | "last_name">[]> {
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "client")
    .eq("status", "active")
    .order("first_name");

  return data ?? [];
}

export async function getActiveSourcers(
  supabase: Client
): Promise<Pick<User, "id" | "first_name" | "last_name">[]> {
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "sourcer")
    .eq("status", "active")
    .order("first_name");

  return data ?? [];
}

export async function getActiveCopywriters(
  supabase: Client,
  excludeId?: string
): Promise<ActiveCopywriter[]> {
  let query = supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("role", "copywriter")
    .eq("status", "active")
    .order("first_name");

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query;
  return data ?? [];
}

export async function getActiveOrdersForCopywriter(
  supabase: Client,
  copywriterId: string
): Promise<ActiveOrderForReassign[]> {
  const { data } = await supabase
    .from("orders")
    .select("id, publish_month, site:sites!site_id(domain)")
    .eq("copywriter_id", copywriterId)
    .in("status", ACTIVE_ORDER_STATUSES);

  return (data ?? []) as ActiveOrderForReassign[];
}

export async function findUserByEmail(
  supabase: Client,
  email: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return data ?? null;
}

export async function findUserByEmailExcluding(
  supabase: Client,
  email: string,
  excludeId: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .neq("id", excludeId)
    .maybeSingle();

  return data ?? null;
}

export async function getUserRoleAndStatus(
  supabase: Client,
  id: string
): Promise<{ role: string; status: string } | null> {
  const { data } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", id)
    .single();

  return data ?? null;
}

export async function getUserRole(
  supabase: Client,
  id: string
): Promise<{ role: string } | null> {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", id)
    .single();

  return data ?? null;
}

// ── Writes ────────────────────────────────────────────────────────────────────

export async function insertUserProfile(
  supabase: Client,
  profile: {
    id: string;
    email: string;
    role: Role;
    status: "pending";
    first_name: string;
    last_name: string;
    manager_id: string | null;
  }
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from("users").insert(profile);
  return { error };
}

export async function updateUserProfile(
  supabase: Client,
  id: string,
  fields: { first_name: string; last_name: string; email: string; role: Role }
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from("users").update(fields).eq("id", id);

  return { error };
}

export async function updateUserAvatar(
  supabase: Client,
  id: string,
  avatar_url: string | null
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("users")
    .update({ avatar_url })
    .eq("id", id);

  return { error };
}

export async function setUserStatus(
  supabase: Client,
  id: string,
  status: "active" | "disabled"
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", id);

  return { error };
}

export async function activateUserAndGetRole(
  supabase: Client,
  id: string
): Promise<{ role: string } | null> {
  const { data } = await supabase
    .from("users")
    .update({ status: "active" })
    .eq("id", id)
    .select("role")
    .single();

  return data ?? null;
}

export async function assignManagerToUser(
  supabase: Client,
  userId: string,
  managerId: string
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("users")
    .update({ manager_id: managerId })
    .eq("id", userId);

  return { error };
}
