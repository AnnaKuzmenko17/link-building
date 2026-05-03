import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/data/users'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileActions } from './profile-actions'

export default async function ProfilePage() {
  const { user } = await requireSession()
  const supabase = await createClient()

  const profile = await getUserById(supabase, user.id)
  if (!profile) notFound()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profile"
        action={<ProfileActions profile={profile} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
            <dt className="text-muted-foreground">First Name</dt>
            <dd>{profile.first_name || '—'}</dd>

            <dt className="text-muted-foreground">Last Name</dt>
            <dd>{profile.last_name || '—'}</dd>

            <dt className="text-muted-foreground">Email</dt>
            <dd>{profile.email}</dd>

            <dt className="text-muted-foreground">Role</dt>
            <dd className="capitalize">{profile.role}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
