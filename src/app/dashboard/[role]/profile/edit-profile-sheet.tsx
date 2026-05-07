'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import type { User } from '@/types'
import { updateProfileAction } from './actions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: User
}

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

export function EditProfileSheet({ open, onOpenChange, profile }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
    },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    const result = await updateProfileAction(values)
    setIsPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Profile updated.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              aria-invalid={!!errors.first_name}
              aria-describedby={errors.first_name ? 'first-name-error' : undefined}
              {...register('first_name')}
            />
            {errors.first_name && (
              <p id="first-name-error" role="alert" className="text-xs text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              aria-invalid={!!errors.last_name}
              aria-describedby={errors.last_name ? 'last-name-error' : undefined}
              {...register('last_name')}
            />
            {errors.last_name && (
              <p id="last-name-error" role="alert" className="text-xs text-destructive">{errors.last_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile_email">Email</Label>
            <Input
              id="profile_email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'profile-email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="profile-email-error" role="alert" className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <SheetFooter className="px-0">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
