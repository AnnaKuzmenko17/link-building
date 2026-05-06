import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getOrderById } from '@/lib/data/orders'
import { PageHeader } from '@/components/shared/page-header'
import { BackButton } from '@/components/shared/back-button'
import { OrderDetail } from '../order-detail'
import { ContentForm } from './content-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ContentPage({ params }: Props) {
  const { id } = await params
  const { user } = await requireSession()
  const supabase = await createClient()
  const order = await getOrderById(supabase, id)

  if (!order || order.copywriter_id !== user.id) notFound()
  if (order.status !== 'in_progress' && order.status !== 'needs_changes') notFound()

  const label = order.status === 'needs_changes' ? 'Edit Content' : 'Create Content'
  const siteLabel = order.site?.domain ?? 'Order'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton fallbackHref={`/dashboard/copywriter/orders/${id}`} />
        <PageHeader title={`${label} — ${siteLabel}`} />
      </div>

      <OrderDetail order={order} />

      <ContentForm orderId={order.id} initialContent={order.content} />
    </div>
  )
}
