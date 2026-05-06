import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getSiteById } from '@/lib/data/sites'
import { getCartSiteIds } from '@/lib/data/cart'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { AddToCartButton } from './add-to-cart-button'

interface Props {
  params: Promise<{ id: string }>
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value ?? '—'}</dd>
    </div>
  )
}

export default async function ClientSiteDetailPage({ params }: Props) {
  const { id } = await params
  const { user } = await requireSession()
  const supabase = await createClient()

  const [site, cartSiteIdsList] = await Promise.all([
    getSiteById(supabase, id),
    getCartSiteIds(supabase, user.id),
  ])

  if (!site) notFound()

  const inCart = cartSiteIdsList.includes(site.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={site.domain}
        backHref="/dashboard/client/sites"
        action={<AddToCartButton siteId={site.id} inCart={inCart} />}
      />

      <Card>
        <CardContent className="pt-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Domain" value={site.domain} />
            <Field label="DR" value={site.dr} />
            <Field label="Category" value={site.category?.name} />
            <Field label="Price" value={`$${Number(site.price).toFixed(2)}`} />
            <Field label="Link Type" value={site.link_type} />
            <Field label="Organic Keywords" value={site.organic_keywords_count} />
            <Field label="Organic Traffic" value={site.organic_traffic_count} />
            <Field label="Top Countries" value={site.top_countries} />
            <Field label="Countries" value={site.countries.join(', ') || '—'} />
            <Field label="Languages" value={site.languages.join(', ') || '—'} />
            {site.keywords_relevance && (
              <Field label="Keywords Relevance" value={site.keywords_relevance} />
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
