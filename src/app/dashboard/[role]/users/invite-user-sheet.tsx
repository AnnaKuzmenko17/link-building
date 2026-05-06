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
import { capitalize } from '@/lib/utils'
import { inviteUserAction } from './actions'

type Manager = { id: string; first_name: string; last_name: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewerRole: Role
  viewerName: string
  activeManagers: Manager[]
}

function buildSchema(viewerRole: Role) {
  return z
    .object({
      first_name: z.string().min(1, 'First name is required'),
      last_name: z.string().min(1, 'Last name is required'),
      email: z.string().email('Enter a valid email address'),
      role: z.enum(['client', 'manager', 'copywriter', 'sourcer', 'admin']),
      manager_id: z.string().uuid('Select a manager').optional(),
    })
    .superRefine((data, ctx) => {
      if (data.role === 'client' && viewerRole !== 'manager' && !data.manager_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['manager_id'],
          message: 'A manager is required for client users.',
        })
      }
    })
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>

const managerRoleOptions: Role[] = ['client', 'copywriter', 'sourcer']
const adminRoleOptions: Role[] = ['client', 'manager', 'copywriter', 'sourcer', 'admin']

export function InviteUserSheet({ open, onOpenChange, viewerRole, viewerName, activeManagers }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(viewerRole)),
    defaultValues: { first_name: '', last_name: '', email: '', role: 'client', manager_id: undefined },
  })

  const watchedRole = watch('role')
  const isClientRole = watchedRole === 'client'
  const roleOptions = viewerRole === 'manager' ? managerRoleOptions : adminRoleOptions
  const roleItems = roleOptions.map((r) => ({ value: r, label: capitalize(r) }))

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    const result = await inviteUserAction({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      role: values.role,
      manager_id: values.manager_id,
    })
    setIsPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Invite sent successfully.')
    reset()
    onOpenChange(false)
    router.refresh()
  }

  function handleRoleChange(value: string | null, onChange: (value: string) => void) {
    if (!value) return
    onChange(value)
    if (value !== 'client') {
      setValue('manager_id', undefined)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invite User</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              autoComplete="off"
              aria-invalid={!!errors.first_name}
              aria-describedby={errors.first_name ? 'invite-first-name-error' : undefined}
              {...register('first_name')}
            />
            {errors.first_name && (
              <p id="invite-first-name-error" role="alert" className="text-xs text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              autoComplete="off"
              aria-invalid={!!errors.last_name}
              aria-describedby={errors.last_name ? 'invite-last-name-error' : undefined}
              {...register('last_name')}
            />
            {errors.last_name && (
              <p id="invite-last-name-error" role="alert" className="text-xs text-destructive">{errors.last_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'invite-email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="invite-email-error" role="alert" className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => handleRoleChange(value, field.onChange)}
                  items={roleItems}
                >
                  <SelectTrigger id="role" aria-invalid={!!errors.role} aria-describedby={errors.role ? 'invite-role-error' : undefined} className="w-full">
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
            {errors.role && (
              <p id="invite-role-error" role="alert" className="text-xs text-destructive">{errors.role.message}</p>
            )}
          </div>

          {isClientRole && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manager_id">Assign Manager</Label>
              {viewerRole === 'manager' ? (
                <Input id="manager_id" value={viewerName} disabled />
              ) : (
                <Controller
                  name="manager_id"
                  control={control}
                  render={({ field }) => {
                    const managerItems = activeManagers.map((m) => ({
                      value: m.id,
                      label: `${m.first_name} ${m.last_name}`.trim(),
                    }))
                    return (
                      <Select
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                        items={managerItems}
                      >
                        <SelectTrigger id="manager_id" aria-invalid={!!errors.manager_id} aria-describedby={errors.manager_id ? 'invite-manager-error' : undefined} className="w-full">
                          <SelectValue placeholder="Select a manager…" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeManagers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.first_name} {m.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  }}
                />
              )}
              {errors.manager_id && (
                <p id="invite-manager-error" role="alert" className="text-xs text-destructive">{errors.manager_id.message}</p>
              )}
            </div>
          )}

          <SheetFooter className="px-0">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Sending…' : 'Send Invite'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
