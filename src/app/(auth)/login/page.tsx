'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/shared/password-input'
import { Logo } from '@/components/shared/logo'
import { loginAction } from './actions'
import Link from 'next/link'

const DEMO_ROLES = [
  { label: 'Admin',       email: 'anna.kuzmenko+admin@archysoft.com' },
  { label: 'Client',      email: 'anna.kuzmenko+client@archysoft.com' },
  { label: 'Manager',     email: 'anna.kuzmenko+manager@archysoft.com' },
  { label: 'Copywriter',  email: 'anna.kuzmenko+copywriter@archysoft.com' },
  { label: 'Sourcer',     email: 'anna.kuzmenko+sourcer@archysoft.com' },
]
const DEMO_PASSWORD = '12345678'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [hashError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const hash = window.location.hash
    if (!hash) return null
    const params = new URLSearchParams(hash.slice(1))
    if (params.get('error')) {
      const description = params.get('error_description')?.replace(/\+/g, ' ') ?? 'This link is invalid or has expired.'
      window.history.replaceState(null, '', window.location.pathname)
      return description
    }
    const type = params.get('type')
    if (type === 'invite' || type === 'signup' || type === 'recovery') {
      window.location.replace(`/auth/set-password${hash}`)
    }
    return null
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    const result = await loginAction(values.email, values.password)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    router.push(`/dashboard/${result.role}`)
  }

  if (hashError) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Logo className="mb-2" />
          <CardTitle>Link expired</CardTitle>
          <CardDescription>{hashError}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ask an admin or manager to send you a new invite.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <Logo className="mb-2" />
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1.5">Demo accounts</p>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_ROLES.map((role) => (
              <Button
                key={role.label}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  setValue('email', role.email, { shouldValidate: true })
                  setValue('password', DEMO_PASSWORD, { shouldValidate: true })
                }}
              >
                {role.label}
              </Button>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
