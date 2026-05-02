import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Client = SupabaseClient<Database>

export async function unlinkSourcerFromSites(
  supabase: Client,
  sourcerId: string
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('sites')
    .update({ sourcer_id: null })
    .eq('sourcer_id', sourcerId)

  return { error }
}
