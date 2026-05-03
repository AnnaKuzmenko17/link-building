import type { ReactNode } from 'react'
import { redirect, notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth/get-session'
import { VALID_ROLES } from '@/types'
import type { Role } from '@/types'
import { DashboardShell } from '@/components/shared/dashboard-shell'

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

  return <DashboardShell role={role} user={user}>{children}</DashboardShell>
}
