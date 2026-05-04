'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { getPublishMonthOptions } from '@/lib/publish-months'
import { editOrderAction } from './actions'
import type { OrderWithSite } from '@/lib/data/orders'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderWithSite
}

const schema = z.object({
  publishMonth: z.string().regex(/^\d{4}-\d{2}-01$/, 'Select a publish month'),
  comment: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>

export function EditOrderSheet({ open, onOpenChange, order }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const publishMonthOptions = getPublishMonthOptions()

  const { control, register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { publishMonth: order.publish_month, comment: order.comment ?? '' },
  })

  async function onSubmit({ publishMonth, comment }: FormValues) {
    setIsPending(true)
    const result = await editOrderAction(order.id, publishMonth, comment || undefined)
    setIsPending(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Order updated.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Order — {order.site.domain}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="publish_month">Publish Month</Label>
            <Controller
              name="publishMonth"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={publishMonthOptions}
                >
                  <SelectTrigger id="publish_month" className="w-full">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {publishMonthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.publishMonth && (
              <p role="alert" className="text-xs text-destructive">{errors.publishMonth.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              {...register('comment')}
              placeholder="Add a comment…"
              maxLength={1000}
              rows={3}
              className="resize-none text-sm"
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
