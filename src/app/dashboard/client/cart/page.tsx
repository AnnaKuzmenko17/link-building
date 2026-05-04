import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getCartItems } from '@/lib/data/cart'
import { PageHeader } from '@/components/shared/page-header'
import { CartClient } from './cart-client'

export default async function CartPage() {
  const { user } = await requireSession()
  const supabase = await createClient()
  const cartItems = await getCartItems(supabase, user.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cart" />
      <CartClient cartItems={cartItems} />
    </div>
  )
}
