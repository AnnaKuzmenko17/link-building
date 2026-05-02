import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getMetricsForRole } from '@/lib/data/metrics'
import { PageHeader } from '@/components/shared/page-header'
import { MetricsGrid, MetricsGridSkeleton } from '@/components/shared/metrics-grid'
import type { Role } from '@/types'

const skeletonCount: Record<Role, 2 | 3> = {
  client: 2,
  manager: 3,
  copywriter: 2,
  sourcer: 2,
  admin: 3,
}

async function Metrics({ role, userId }: { role: Role; userId: string }) {
  const supabase = await createClient()
  const metrics = await getMetricsForRole(supabase, role, userId)
  return <MetricsGrid metrics={metrics} />
}

export default async function DashboardHome() {
  const { user, role } = await requireSession()
  const firstName = user.user_metadata?.first_name ?? 'there'

  return (
    <>
      <PageHeader title={`Welcome back, ${firstName}`} />
      <Suspense fallback={<MetricsGridSkeleton count={skeletonCount[role]} />}>
        <Metrics role={role} userId={user.id} />
      </Suspense>
    </>
  )
}
