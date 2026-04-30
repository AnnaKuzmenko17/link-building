'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ email: z.string().email() })

export async function forgotPasswordAction(email: string): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = schema.safeParse({ email })
  if (!parsed.success) {
    return { success: false, error: 'Invalid email address.' }
  }

  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  })

  if (error) {
    return { success: false, error: 'internal' }
  }

  return { success: true }
}
