import type { ReactNode } from "react";

import type { Role } from "@/types";
import type { User } from "@supabase/supabase-js";

import { AppSidebar } from "@/components/shared";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui";

interface Props {
  role: Role;
  user: User;
  unreadChatCount?: number;
  children: ReactNode;
}

export function DashboardShell({
  role,
  user,
  unreadChatCount,
  children,
}: Props) {
  return (
    <SidebarProvider>
      <AppSidebar role={role} user={user} unreadChatCount={unreadChatCount} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
