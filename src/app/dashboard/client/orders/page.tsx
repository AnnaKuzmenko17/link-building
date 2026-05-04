import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getClientOrders } from '@/lib/data/orders'
import { PageHeader } from '@/components/shared/page-header'
import { OrdersClient } from './orders-client'

export default async function ClientOrdersPage() {
  const { user } = await requireSession()
  const supabase = await createClient()
  const orders = await getClientOrders(supabase, user.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Orders" />
      <OrdersClient orders={orders} />
    </div>
  )
}
