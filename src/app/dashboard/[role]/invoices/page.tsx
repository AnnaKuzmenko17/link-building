import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getInvoices } from '@/lib/data/invoices'
import { getActiveClients } from '@/lib/data/users'
import { PageHeader } from '@/components/shared/page-header'
import { InvoicesClient } from './invoices-client'

interface Props {
  params: Promise<{ role: string }>
}

export default async function InvoicesPage({ params }: Props) {
  const { role } = await params
  const { user } = await requireSession()

  if (role === 'copywriter' || role === 'sourcer') notFound()

  const supabase = await createClient()

  const [invoices, clients] = await Promise.all([
    getInvoices(supabase, {
      viewerRole: role,
      viewerId: role === 'client' ? user.id : undefined,
    }),
    role === 'manager' || role === 'admin' ? getActiveClients(supabase) : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Invoices" />
      <InvoicesClient invoices={invoices} clients={clients} role={role} />
    </div>
  )
}
