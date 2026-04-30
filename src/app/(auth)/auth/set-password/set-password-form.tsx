'use client'

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
import { setPasswordAction } from './actions'

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
  isChange: boolean
}

const copy = {
  'first-login': {
    title: 'Set your password',
    description: "You've been invited to Linkbuilding. Create a password to activate your account.",
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

export default function SetPasswordForm({ isChange }: Props) {
  const router = useRouter()
  const mode = isChange ? 'change' : 'first-login'
  const t = copy[mode]

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    const result = await setPasswordAction(values.password, mode)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    if (isChange) {
      router.back()
    } else {
      router.push(`/dashboard/${result.role}`)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <Logo className="mb-2" />
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t.passwordLabel}</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
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
