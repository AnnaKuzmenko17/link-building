"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Role } from "@/types";
import type { User } from "@supabase/supabase-js";
import {
  ClipboardListIcon,
  FileTextIcon,
  GlobeIcon,
  MessageCircleIcon,
  ShoppingCartIcon,
  TagIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import { Logo, LogoutButton } from "@/components/shared";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: Record<Role, NavItem[]> = {
  client: [
    { label: "Sites", href: "/dashboard/client/sites", icon: GlobeIcon },
    { label: "Cart", href: "/dashboard/client/cart", icon: ShoppingCartIcon },
    {
      label: "Orders",
      href: "/dashboard/client/orders",
      icon: ClipboardListIcon,
    },
    {
      label: "Invoices",
      href: "/dashboard/client/invoices",
      icon: FileTextIcon,
    },
    { label: "Chat", href: "/dashboard/client/chat", icon: MessageCircleIcon },
  ],
  manager: [
    {
      label: "Orders",
      href: "/dashboard/manager/orders",
      icon: ClipboardListIcon,
    },
    { label: "Sites", href: "/dashboard/manager/sites", icon: GlobeIcon },
    { label: "Users", href: "/dashboard/manager/users", icon: UsersIcon },
    {
      label: "Invoices",
      href: "/dashboard/manager/invoices",
      icon: FileTextIcon,
    },
    {
      label: "Earnings",
      href: "/dashboard/manager/earnings",
      icon: WalletIcon,
    },
    { label: "Chat", href: "/dashboard/manager/chat", icon: MessageCircleIcon },
  ],
  copywriter: [
    {
      label: "Orders",
      href: "/dashboard/copywriter/orders",
      icon: ClipboardListIcon,
    },
    {
      label: "Chat",
      href: "/dashboard/copywriter/chat",
      icon: MessageCircleIcon,
    },
  ],
  sourcer: [
    { label: "Sites", href: "/dashboard/sourcer/sites", icon: GlobeIcon },
    {
      label: "Earnings",
      href: "/dashboard/sourcer/earnings",
      icon: WalletIcon,
    },
    { label: "Chat", href: "/dashboard/sourcer/chat", icon: MessageCircleIcon },
  ],
  admin: [
    {
      label: "Orders",
      href: "/dashboard/admin/orders",
      icon: ClipboardListIcon,
    },
    { label: "Sites", href: "/dashboard/admin/sites", icon: GlobeIcon },
    { label: "Categories", href: "/dashboard/admin/categories", icon: TagIcon },
    { label: "Users", href: "/dashboard/admin/users", icon: UsersIcon },
    {
      label: "Invoices",
      href: "/dashboard/admin/invoices",
      icon: FileTextIcon,
    },
    { label: "Earnings", href: "/dashboard/admin/earnings", icon: WalletIcon },
    { label: "Chat", href: "/dashboard/admin/chat", icon: MessageCircleIcon },
  ],
};

interface Props {
  role: Role;
  user: User;
  unreadChatCount?: number;
}

function getInitial(value: string | null | undefined): string {
  return value && value.length > 0 ? value.charAt(0).toUpperCase() : "?";
}

export function AppSidebar({ role, user, unreadChatCount }: Props) {
  const pathname = usePathname();
  const items = navItems[role];
  const meta = user.user_metadata ?? {};
  const firstName =
    typeof meta.first_name === "string" ? meta.first_name : undefined;
  const lastName =
    typeof meta.last_name === "string" ? meta.last_name : undefined;
  const displayName = firstName
    ? `${firstName} ${lastName ?? ""}`.trim()
    : (user.email ?? "");
  const avatar = getInitial(firstName || user.email);
  const avatarUrl =
    typeof meta.avatar_url === "string" ? meta.avatar_url : undefined;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Logo href={`/dashboard/${role}`} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isChat = item.icon === MessageCircleIcon;
                const showBadge =
                  isChat && !!unreadChatCount && unreadChatCount > 0;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.href)}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                      {showBadge && (
                        <span className="bg-primary text-primary-foreground ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-medium">
                          {unreadChatCount > 99 ? "99+" : unreadChatCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Link
          href={`/dashboard/${role}/profile`}
          className="hover:bg-sidebar-accent focus-visible:ring-ring -mx-1 flex items-center gap-3 rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <Avatar size="default">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {avatar}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-muted-foreground truncate text-xs">
              {user.email}
            </p>
          </div>
        </Link>
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
