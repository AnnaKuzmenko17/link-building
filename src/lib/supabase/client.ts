import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import { supabaseUrl, supabasePublishableKey } from './env'

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey)
}
