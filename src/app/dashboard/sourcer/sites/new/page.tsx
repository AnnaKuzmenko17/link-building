import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { getCategories } from '@/lib/data/sites'
import { PageHeader } from '@/components/shared/page-header'
import { SiteForm } from '@/app/dashboard/[role]/sites/site-form'

export default async function NewSitePage() {
  const { role } = await requireSession()
  if (role !== 'sourcer') redirect(`/dashboard/${role}`)

  const supabase = await createClient()
  const categories = await getCategories(supabase)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Add Site" backHref="/dashboard/sourcer/sites" />
      <SiteForm categories={categories} backHref="/dashboard/sourcer/sites" isSourcer />
    </div>
  )
}
