'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShoppingCartIcon,
  FileTextIcon,
  MessageCircleIcon,
  GlobeIcon,
  UsersIcon,
  WalletIcon,
  ClipboardListIcon,
  type LucideIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/shared/logo'
import { LogoutButton } from '@/components/shared/logout-button'
import type { Role } from '@/types'
import type { User } from '@supabase/supabase-js'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: Record<Role, NavItem[]> = {
  client: [
    { label: 'Orders', href: '/dashboard/client/orders', icon: ClipboardListIcon },
    { label: 'Cart', href: '/dashboard/client/cart', icon: ShoppingCartIcon },
    { label: 'Invoices', href: '/dashboard/client/invoices', icon: FileTextIcon },
    { label: 'Chat', href: '/dashboard/client/chat', icon: MessageCircleIcon },
  ],
  manager: [
    { label: 'Orders', href: '/dashboard/manager/orders', icon: ClipboardListIcon },
    { label: 'Sites', href: '/dashboard/manager/sites', icon: GlobeIcon },
    { label: 'Users', href: '/dashboard/manager/users', icon: UsersIcon },
    { label: 'Invoices', href: '/dashboard/manager/invoices', icon: FileTextIcon },
    { label: 'Earnings', href: '/dashboard/manager/earnings', icon: WalletIcon },
    { label: 'Chat', href: '/dashboard/manager/chat', icon: MessageCircleIcon },
  ],
  copywriter: [
    { label: 'Orders', href: '/dashboard/copywriter/orders', icon: ClipboardListIcon },
    { label: 'Chat', href: '/dashboard/copywriter/chat', icon: MessageCircleIcon },
  ],
  sourcer: [
    { label: 'Sites', href: '/dashboard/sourcer/sites', icon: GlobeIcon },
    { label: 'Earnings', href: '/dashboard/sourcer/earnings', icon: WalletIcon },
    { label: 'Chat', href: '/dashboard/sourcer/chat', icon: MessageCircleIcon },
  ],
  admin: [
    { label: 'Orders', href: '/dashboard/admin/orders', icon: ClipboardListIcon },
    { label: 'Sites', href: '/dashboard/admin/sites', icon: GlobeIcon },
    { label: 'Users', href: '/dashboard/admin/users', icon: UsersIcon },
    { label: 'Invoices', href: '/dashboard/admin/invoices', icon: FileTextIcon },
    { label: 'Earnings', href: '/dashboard/admin/earnings', icon: WalletIcon },
    { label: 'Chat', href: '/dashboard/admin/chat', icon: MessageCircleIcon },
  ],
}

interface Props {
  role: Role
  user: User
}

function getInitial(value: string | null | undefined): string {
  return value && value.length > 0 ? value.charAt(0).toUpperCase() : '?'
}

export function AppSidebar({ role, user }: Props) {
  const pathname = usePathname()
  const items = navItems[role]
  const firstName = user.user_metadata?.first_name as string | undefined
  const lastName = user.user_metadata?.last_name as string | undefined
  const displayName = firstName ? `${firstName} ${lastName ?? ''}`.trim() : user.email ?? ''
  const avatar = getInitial(firstName || user.email)

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Logo href={`/dashboard/${role}`} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
