import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getCategories } from '@/lib/data/sites'
import { PageHeader } from '@/components/shared/page-header'
import { CategoriesClient } from './categories-client'

export default async function CategoriesPage() {
  const { role } = await requireSession()
  if (role !== 'admin') redirect(`/dashboard/${role}`)

  const supabase = await createClient()
  const categories = await getCategories(supabase)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Categories" />
      <CategoriesClient categories={categories} />
    </div>
  )
}
