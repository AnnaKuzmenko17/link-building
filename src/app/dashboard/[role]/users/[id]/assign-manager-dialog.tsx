'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { assignManagerAction } from './actions'

type Manager = { id: string; first_name: string; last_name: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId: string
  currentManagerId: string | null
  managers: Manager[]
}

const schema = z.object({
  manager_id: z.string().min(1, 'Select a manager'),
})

type FormValues = z.infer<typeof schema>

export function AssignManagerDialog({ open, onOpenChange, targetUserId, currentManagerId, managers }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { manager_id: currentManagerId ?? '' },
  })

  function handleOpenChange(next: boolean) {
    if (!next) reset({ manager_id: currentManagerId ?? '' })
    onOpenChange(next)
  }

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    const result = await assignManagerAction({ userId: targetUserId, managerId: values.manager_id })
    setIsPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Manager assigned.')
    handleOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Manager</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assign_manager">Manager</Label>
            <Controller
              name="manager_id"
              control={control}
              render={({ field }) => {
                const items = managers.map((m) => ({
                  value: m.id,
                  label: `${m.first_name} ${m.last_name}`.trim(),
                }))
                return (
                  <Select value={field.value} onValueChange={field.onChange} items={items}>
                    <SelectTrigger id="assign_manager" className="w-full" aria-invalid={!!errors.manager_id}>
                      <SelectValue placeholder="Select a manager…" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.first_name} {m.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }}
            />
            {errors.manager_id && (
              <p className="text-xs text-destructive">{errors.manager_id.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Assign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
