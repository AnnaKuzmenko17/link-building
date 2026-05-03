import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { getUserList, getActiveManagers } from '@/lib/data/users'
import { PageHeader } from '@/components/shared/page-header'
import { UsersClient } from './users-client'
import { InviteUserButton } from './invite-button'
import type { Role } from '@/types'

interface Props {
  params: Promise<{ role: string }>
  searchParams: Promise<{ role?: string; status?: string; search?: string }>
}

export default async function UsersPage({ params, searchParams }: Props) {
  const { role: urlRole } = await params

  if (urlRole !== 'manager' && urlRole !== 'admin') {
    notFound()
  }

  const { user } = await requireSession()
  const supabase = await createClient()
  const { role: filterRole, status, search } = await searchParams

  const [users, activeManagers] = await Promise.all([
    getUserList(supabase, { role: filterRole, status, search }),
    getActiveManagers(supabase),
  ])

  const viewerRole = urlRole as Role
  const basePath = `/dashboard/${urlRole}/users`
  const viewerName = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || user.email || ''

  return (
    <>
      <PageHeader
        title="Users"
        action={
          <InviteUserButton
            viewerRole={viewerRole}
            viewerName={viewerName}
            activeManagers={activeManagers}
          />
        }
      />
      <UsersClient
        users={users}
        basePath={basePath}
        defaultFilters={{ role: filterRole, status, search }}
      />
    </>
  )
}
