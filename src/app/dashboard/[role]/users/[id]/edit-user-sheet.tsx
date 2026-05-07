'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Role } from '@/types'
import type { UserWithManager } from '@/lib/data/users'
import { capitalize } from '@/lib/utils'
import { editUserAction } from './actions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserWithManager
  viewerRole: Role
}

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.email('Enter a valid email'),
  role: z.enum(['client', 'manager', 'copywriter', 'sourcer', 'admin']),
})

type FormValues = z.infer<typeof schema>

const ALL_ROLES: Role[] = ['client', 'manager', 'copywriter', 'sourcer', 'admin']
const MANAGER_EDITABLE_ROLES: Role[] = ['client', 'copywriter', 'sourcer']

export function EditUserSheet({ open, onOpenChange, user, viewerRole }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    },
  })

  const roleOptions = viewerRole === 'admin' ? ALL_ROLES : MANAGER_EDITABLE_ROLES
  const roleItems = roleOptions.map((r) => ({ value: r, label: capitalize(r) }))

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    const result = await editUserAction({ targetId: user.id, ...values })
    setIsPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('User updated.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'edit-email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="edit-email-error" role="alert" className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit_role">Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} items={roleItems}>
                  <SelectTrigger id="edit_role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>{capitalize(r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
