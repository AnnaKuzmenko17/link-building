import { ChevronDownIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatPublishMonth } from '@/lib/publish-months'
import type { OrderWithFullDetails } from '@/lib/data/orders'

interface Props {
  order: OrderWithFullDetails
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2.5 border-b last:border-0">
      <span className="w-44 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function OrderDetail({ order }: Props) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const site = order.site

  return (
    <div className="flex flex-col gap-4">
      {/* Order info — always visible */}
      <Card>
        <CardContent className="pt-4 divide-y divide-border">
          <Row label="Publish Date">{formatPublishMonth(order.publish_month)}</Row>
          <Row label="Status"><StatusBadge status={order.status} /></Row>
          {order.status === 'content_approved' && (
            <Row label="Approved At">{formatDate(order.updated_at)}</Row>
          )}
          {order.client && (
            <Row label="Client">{order.client.first_name} {order.client.last_name}</Row>
          )}
          <Row label="Created At">{formatDate(order.created_at)}</Row>
        </CardContent>
      </Card>

      {/* Site info — collapsed by default */}
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium select-none hover:bg-muted/50 transition-colors">
          Site Information
          <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <Card className="mt-2 rounded-t-none border-t-0">
          <CardContent className="pt-4 divide-y divide-border">
            <Row label="Domain">{site?.domain ?? '—'}</Row>
            <Row label="DR">{site?.dr ?? '—'}</Row>
            {site?.category && <Row label="Category">{site.category.name}</Row>}
            {site?.link_type && <Row label="Link Type">{site.link_type}</Row>}
            {site?.languages && site.languages.length > 0 && (
              <Row label="Languages">{site.languages.join(', ')}</Row>
            )}
            {site?.top_countries && <Row label="Top Countries">{site.top_countries}</Row>}
            {site?.countries && site.countries.length > 0 && (
              <Row label="Countries">{site.countries.join(', ')}</Row>
            )}
            {site?.organic_keywords_count != null && (
              <Row label="Organic Keywords">{site.organic_keywords_count.toLocaleString()}</Row>
            )}
            {site?.organic_traffic_count != null && (
              <Row label="Organic Traffic">{site.organic_traffic_count.toLocaleString()}</Row>
            )}
            {site?.keywords_relevance && (
              <Row label="Keywords Relevance">{site.keywords_relevance}</Row>
            )}
            {site?.description && (
              <Row label="Description">
                <span className="whitespace-pre-wrap">{site.description}</span>
              </Row>
            )}
          </CardContent>
        </Card>
      </details>

      {/* Comments */}
      {(order.comment || order.change_requests.length > 0) && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium select-none hover:bg-muted/50 transition-colors">
            Comments
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <Card className="mt-2 rounded-t-none border-t-0">
            <CardContent className="pt-4 flex flex-col gap-3">
              {order.comment && (
                <div className="rounded-md border bg-muted/20 p-3 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">Client note</p>
                  <p className="whitespace-pre-wrap">{order.comment}</p>
                </div>
              )}
              {order.change_requests
                .slice()
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((cr) => (
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
        </details>
      )}
    </div>
  )
}
