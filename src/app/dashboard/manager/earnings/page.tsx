import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getEarnings } from '@/lib/data/earnings'
import { getActiveSourcers } from '@/lib/data/users'
import { PageHeader } from '@/components/shared/page-header'
import { EarningsClient } from '@/app/dashboard/[role]/earnings/earnings-client'

export default async function ManagerEarningsPage() {
  const { user } = await requireSession()
  const supabase = await createClient()
  const [rows, sourcers] = await Promise.all([
    getEarnings(supabase, { viewerRole: 'manager', viewerId: user.id }),
    getActiveSourcers(supabase),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Earnings" />
      <EarningsClient rows={rows} sourcers={sourcers} role="manager" />
    </div>
  )
}
