import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getEarnings } from '@/lib/data/earnings'
import { PageHeader } from '@/components/shared/page-header'
import { EarningsClient } from '@/app/dashboard/[role]/earnings/earnings-client'

export default async function SourcerEarningsPage() {
  const { user } = await requireSession()
  const supabase = await createClient()
  const rows = await getEarnings(supabase, { viewerRole: 'sourcer', viewerId: user.id })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Earnings" />
      <EarningsClient rows={rows} sourcers={[]} role="sourcer" />
    </div>
  )
}
