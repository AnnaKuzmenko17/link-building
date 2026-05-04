'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/shared/password-input'
import { Logo } from '@/components/shared/logo'
import { createClient } from '@/lib/supabase/client'
import { activateSessionAction } from './actions'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

interface Props {
  mode: 'first-login' | 'change'
}

const copy = {
  'first-login': {
    title: 'Set your password',
    description: "You've been invited to Linkly. Create a password to activate your account.",
    passwordLabel: 'Password',
    button: 'Activate account',
    buttonPending: 'Activating…',
  },
  change: {
    title: 'Change your password',
    description: 'Enter and confirm a new password for your account.',
    passwordLabel: 'New password',
    button: 'Update password',
    buttonPending: 'Updating…',
  },
}

const INVITE_TIMEOUT_MS = 10000

export default function SetPasswordForm({ mode }: Props) {
  const router = useRouter()
  const t = copy[mode]
  const [ready, setReady] = useState(mode === 'change')
  const [timedOut, setTimedOut] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (mode === 'change') return
    // Guard against React Strict Mode double-invocation — the first mount
    // consumes the hash token; the second mount would find no token and time out.
    if (initializedRef.current) return
    initializedRef.current = true

    const supabase = createClient()
    supabaseRef.current = supabase

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION') && session) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setReady(true)
      }
    })

    // @supabase/ssr disables detectSessionInUrl, so we must manually exchange
    // the hash fragment tokens into a session.
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        if (error) setTimedOut(true)
      })
    } else {
      // No hash tokens — check if there's already a cookie session (change mode fallback)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setReady(true)
        }
      })
    }

    timeoutRef.current = setTimeout(() => setTimedOut(true), INVITE_TIMEOUT_MS)
    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [mode])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = useCallback(async (values: FormValues) => {
    const supabase = supabaseRef.current ?? createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: values.password })
    if (updateError) {
      toast.error(updateError.message)
      return
    }

    const result = await activateSessionAction(mode)
    if (!result.success) {
      toast.error(result.error)
      return
    }

    if (mode === 'change') {
      router.back()
    } else {
      router.push(`/dashboard/${result.role}`)
    }
  }, [mode, router])

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); handleSubmit(onSubmit)(e) },
    [handleSubmit, onSubmit],
  )

  if (!ready) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Logo className="mb-2" />
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>
            {timedOut
              ? 'This invite link has expired or is invalid. Ask an admin to resend the invite.'
              : 'Verifying your invite link…'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <Logo className="mb-2" />
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t.passwordLabel}</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p id="confirm-password-error" role="alert" className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t.buttonPending : t.button}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
