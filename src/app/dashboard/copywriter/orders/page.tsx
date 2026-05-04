import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getCopywriterOrders } from '@/lib/data/orders'
import { PageHeader } from '@/components/shared/page-header'
import { CopywriterOrdersClient } from './orders-client'

export default async function CopywriterOrdersPage() {
  const { user } = await requireSession()
  const supabase = await createClient()
  const orders = await getCopywriterOrders(supabase, user.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" />
      <CopywriterOrdersClient orders={orders} />
    </div>
  )
}
