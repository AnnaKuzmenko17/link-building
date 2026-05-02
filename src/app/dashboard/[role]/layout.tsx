import type { ReactNode } from 'react'
import { redirect, notFound } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { requireSession } from '@/lib/auth/get-session'
import { VALID_ROLES } from '@/types'
import type { Role } from '@/types'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ role: string }>
}) {
  const { role: urlRole } = await params

  if (!VALID_ROLES.includes(urlRole as Role)) {
    notFound()
  }

  const { user, role } = await requireSession()

  if (urlRole !== role) {
    redirect(`/dashboard/${role}`)
  }

  return (
    <SidebarProvider>
      <AppSidebar role={role} user={user} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <span className="sr-only">Dashboard</span>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
