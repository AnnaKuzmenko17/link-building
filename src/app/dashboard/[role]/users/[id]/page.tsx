import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { getUserById, getActiveManagers } from '@/lib/data/users'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserActions } from './user-actions'
import type { Role } from '@/types'

interface Props {
  params: Promise<{ role: string; id: string }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function UserDetailsPage({ params }: Props) {
  const { role: urlRole, id } = await params

  if (urlRole !== 'manager' && urlRole !== 'admin') {
    notFound()
  }

  const { user: sessionUser } = await requireSession()
  const supabase = await createClient()

  const viewerRole = urlRole as Role
  const isAdmin = viewerRole === 'admin'

  const targetUser = await getUserById(supabase, id)
  if (!targetUser) notFound()

  const activeManagers =
    isAdmin && targetUser.role === 'client'
      ? await getActiveManagers(supabase)
      : []

  const fullName = `${targetUser.first_name} ${targetUser.last_name}`.trim() || targetUser.email

  return (
    <>
      <PageHeader
        title={fullName}
        backHref={`/dashboard/${urlRole}/users`}
        action={
          <UserActions
            targetUser={targetUser}
            viewerRole={viewerRole}
            currentUserId={sessionUser.id}
            activeManagers={activeManagers}
          />
        }
      />

      <Card>
        <CardContent>
          <div className="flex justify-center mb-4">
            <Avatar size="lg">
              <AvatarImage src={targetUser.avatar_url ?? undefined} />
              <AvatarFallback>
                {[targetUser.first_name, targetUser.last_name]
                  .filter(Boolean)
                  .map((p) => p![0])
                  .join('')
                  .toUpperCase() || targetUser.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
            <dt className="text-muted-foreground">First Name</dt>
            <dd>{targetUser.first_name || '—'}</dd>

            <dt className="text-muted-foreground">Last Name</dt>
            <dd>{targetUser.last_name || '—'}</dd>

            <dt className="text-muted-foreground">Email</dt>
            <dd>{targetUser.email}</dd>

            <dt className="text-muted-foreground">Role</dt>
            <dd className="capitalize">{targetUser.role}</dd>

            <dt className="text-muted-foreground">Status</dt>
            <dd><StatusBadge status={targetUser.status} /></dd>

            {targetUser.role === 'client' && (
              <>
                <dt className="text-muted-foreground">Manager</dt>
                <dd>
                  {targetUser.manager
                    ? `${targetUser.manager.first_name} ${targetUser.manager.last_name}`.trim()
                    : 'Unassigned'}
                </dd>
              </>
            )}

            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(targetUser.created_at)}</dd>
          </dl>
        </CardContent>
      </Card>
    </>
  )
}
