import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Client = SupabaseClient<Database>

export async function reassignOrder(
  supabase: Client,
  orderId: string,
  fromCopywriterId: string,
  toCopywriterId: string
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ copywriter_id: toCopywriterId })
    .eq('id', orderId)
    .eq('copywriter_id', fromCopywriterId)

  return { error }
}
