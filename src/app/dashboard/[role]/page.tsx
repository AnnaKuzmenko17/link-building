import { VALID_ROLES } from '@/types'
import type { Role } from '@/types'
import { notFound } from 'next/navigation'
import { LogoutButton } from '@/components/shared/logout-button'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const { role } = await params

  if (!VALID_ROLES.includes(role as Role)) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground text-sm">
        Dashboard coming soon — logged in as <strong>{role}</strong>.
      </p>
      <LogoutButton />
    </div>
  )
}
