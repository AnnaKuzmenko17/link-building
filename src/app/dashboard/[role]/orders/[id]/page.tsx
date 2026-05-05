import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getOrderById } from '@/lib/data/orders'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { BackButton } from '@/components/shared/back-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPublishMonth } from '@/lib/publish-months'
import { ClientOrderActions } from './client-order-actions'

interface Props {
  params: Promise<{ role: string; id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { role, id } = await params
  await requireSession()
  const supabase = await createClient()
  const order = await getOrderById(supabase, id)
  if (!order) notFound()

  const copywriterName = order.copywriter
    ? `${order.copywriter.first_name} ${order.copywriter.last_name}`
    : '—'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallbackHref={`/dashboard/${role}/orders`} />
          <PageHeader title={`Order — ${order.site?.domain ?? '—'}`} />
        </div>
        {role === 'client' && order.status === 'new' && (
          <ClientOrderActions order={order} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={order.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Client</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {order.client.first_name} {order.client.last_name}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Copywriter</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{copywriterName}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Publish Month</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{formatPublishMonth(order.publish_month)}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {new Date(order.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </CardContent>
        </Card>

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
      </div>

      {order.content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[100px] rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {order.content}
            </div>
          </CardContent>
        </Card>
      )}

      {order.change_requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Change Requests</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {order.change_requests.map((cr) => (
              <div key={cr.id} className="rounded-md border bg-muted/20 p-3 text-sm">
                <p className="text-muted-foreground text-xs mb-1">
                  {new Date(cr.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="whitespace-pre-wrap">{cr.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
