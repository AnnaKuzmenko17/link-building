import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getOrderById } from '@/lib/data/orders'
import { PageHeader } from '@/components/shared/page-header'
import { BackButton } from '@/components/shared/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  const latestChangeRequest =
    order.status === 'needs_changes' && order.change_requests.length > 0
      ? order.change_requests.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
      : null

  const label = order.status === 'needs_changes' ? 'Edit Content' : 'Create Content'
  const siteLabel = order.site?.domain ?? 'Order'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton fallbackHref="/dashboard/copywriter/orders" />
        <PageHeader title={`${label} — ${siteLabel}`} />
      </div>

      {order.comment && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Client Note</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {order.comment}
          </CardContent>
        </Card>
      )}

      {latestChangeRequest && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Change Request</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {latestChangeRequest.comment}
          </CardContent>
        </Card>
      )}

      <ContentForm orderId={order.id} initialContent={order.content} />
    </div>
  )
}
