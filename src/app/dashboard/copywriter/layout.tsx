import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/get-session'
import { DashboardShell } from '@/components/shared/dashboard-shell'

export default async function CopywriterLayout({ children }: { children: ReactNode }) {
  const { user, role } = await requireSession()

  if (role !== 'copywriter') {
    redirect(`/dashboard/${role}`)
  }

  return <DashboardShell role={role} user={user}>{children}</DashboardShell>
}
