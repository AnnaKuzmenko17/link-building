import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { CartItem, Site, Category } from '@/types'

type Client = SupabaseClient<Database>

export type CartItemWithSite = CartItem & {
  site: Pick<Site, 'id' | 'domain' | 'price'> & {
    category: Pick<Category, 'id' | 'name'> | null
  }
}

export async function getCartItems(
  supabase: Client,
  clientId: string,
): Promise<CartItemWithSite[]> {
  const { data } = await supabase
    .from('cart_items')
    .select('*, site:sites(id, domain, price, category:categories(id, name))')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return (data ?? []) as CartItemWithSite[]
}

export async function getCartSiteIds(
  supabase: Client,
  clientId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('cart_items')
    .select('site_id')
    .eq('client_id', clientId)
  return (data ?? []).map((row) => row.site_id)
}

export async function addToCart(
  supabase: Client,
  clientId: string,
  siteId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('cart_items')
    .insert({ client_id: clientId, site_id: siteId })
  return { error: error ?? null }
}

export async function removeFromCart(
  supabase: Client,
  cartItemId: string,
  clientId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('client_id', clientId)
  return { error: error ?? null }
}

export async function clearCart(
  supabase: Client,
  clientId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('client_id', clientId)
  return { error: error ?? null }
}
