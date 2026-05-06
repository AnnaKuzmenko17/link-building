import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getOrderById } from '@/lib/data/orders'
import { PageHeader } from '@/components/shared/page-header'
import { BackButton } from '@/components/shared/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StartChatButton } from '@/app/dashboard/[role]/orders/[id]/start-chat-button'
import { OrderDetail } from './order-detail'
import { ContentForm } from './content/content-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CopywriterOrderPage({ params }: Props) {
  const { id } = await params
  const { user } = await requireSession()
  const supabase = await createClient()
  const order = await getOrderById(supabase, id)

  if (!order || order.copywriter_id !== user.id) notFound()

  const canEdit = order.status === 'in_progress' || order.status === 'needs_changes'
  const showContent = order.content && !canEdit

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallbackHref="/dashboard/copywriter/orders" />
          <PageHeader title={`Order — ${order.site?.domain ?? '—'}`} />
        </div>
        <StartChatButton orderId={order.id} role="copywriter" />
      </div>

      <OrderDetail order={order} />

      {order.published_url && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published URL</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <a
              href={order.published_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline break-all"
            >
              {order.published_url}
            </a>
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <ContentForm orderId={order.id} initialContent={order.content} />
      )}

      {showContent && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[100px] rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap font-mono">
              {order.content}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
