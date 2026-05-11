import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { VALID_ROLES, type Role } from "@/types";

import { requireSession } from "@/lib/auth/get-session";
import { getTotalUnreadCount } from "@/lib/data/chats";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/shared";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role: urlRole } = await params;

  if (!VALID_ROLES.includes(urlRole as Role)) {
    notFound();
  }

  const { user, role } = await requireSession();

  if (urlRole !== role) {
    redirect(`/dashboard/${role}`);
  }

  const supabase = await createClient();
  const unreadChatCount = await getTotalUnreadCount(supabase, user.id);

  return (
    <DashboardShell role={role} user={user} unreadChatCount={unreadChatCount}>
      {children}
    </DashboardShell>
  );
}
