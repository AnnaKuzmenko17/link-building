import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getAllOrders } from '@/lib/data/orders'
import { getActiveCopywriters, getActiveClients } from '@/lib/data/users'
import { PageHeader } from '@/components/shared/page-header'
import { ManagerOrdersClient } from './orders-client'

export default async function ManagerOrdersPage() {
  await requireSession()
  const supabase = await createClient()

  const [orders, copywriters, clients] = await Promise.all([
    getAllOrders(supabase),
    getActiveCopywriters(supabase),
    getActiveClients(supabase),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" />
      <ManagerOrdersClient
        orders={orders}
        copywriters={copywriters}
        clients={clients}
        role="manager"
      />
    </div>
  )
}
