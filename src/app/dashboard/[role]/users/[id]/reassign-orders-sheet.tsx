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
import type { ActiveOrderForReassign, ActiveCopywriter } from '@/lib/data/users'
import { disableCopywriterWithReassignAction } from './actions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId: string
  orders: ActiveOrderForReassign[]
  copywriters: ActiveCopywriter[]
}

const schema = z.object({
  assignments: z.array(z.object({
    orderId: z.string(),
    copywriterId: z.string().min(1, 'Select a copywriter'),
  })),
})

type FormValues = z.infer<typeof schema>

export function ReassignOrdersSheet({ open, onOpenChange, targetUserId, orders, copywriters }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      assignments: orders.map((o) => ({ orderId: o.id, copywriterId: '' })),
    },
  })

  const copywriterItems = copywriters.map((c) => ({
    value: c.id,
    label: `${c.first_name} ${c.last_name}`.trim(),
  }))

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    const result = await disableCopywriterWithReassignAction({
      userId: targetUserId,
      assignments: values.assignments,
    })
    setIsPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('User disabled and orders reassigned.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Reassign Orders</SheetTitle>
        </SheetHeader>

        <p className="text-sm text-muted-foreground">
          This copywriter has active orders. Assign each order to another copywriter before disabling.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 py-2">
          {orders.map((order, index) => (
            <div key={order.id} className="flex flex-col gap-1.5">
              <Label htmlFor={`order-${order.id}`}>
                {order.site.domain} — {order.publish_month}
              </Label>
              <Controller
                name={`assignments.${index}.copywriterId`}
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} items={copywriterItems}>
                    <SelectTrigger
                      id={`order-${order.id}`}
                      className="w-full"
                      aria-invalid={!!errors.assignments?.[index]?.copywriterId}
                    >
                      <SelectValue placeholder="Select copywriter…" />
                    </SelectTrigger>
                    <SelectContent>
                      {copywriters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assignments?.[index]?.copywriterId && (
                <p className="text-xs text-destructive">
                  {errors.assignments[index].copywriterId.message}
                </p>
              )}
            </div>
          ))}

          <SheetFooter className="mt-auto">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save & Disable'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
