'use server'

import { createClient } from '@/lib/supabase/server'

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
