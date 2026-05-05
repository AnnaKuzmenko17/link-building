'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { updateInvoiceAction } from './actions'
import type { InvoiceWithItems } from '@/lib/data/invoices'

const schema = z.object({
  billing_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  billing_period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  items: z.array(z.object({ id: z.string().uuid(), amount: z.number().positive('Must be positive') })),
})

type FormValues = z.infer<typeof schema>

interface Props {
  invoice: InvoiceWithItems
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditInvoiceSheet({ invoice, open, onOpenChange, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      billing_period_start: invoice.billing_period_start,
      billing_period_end: invoice.billing_period_end,
      items: invoice.invoice_items.map((item) => ({
        id: item.id,
        amount: Number(item.amount),
      })),
    },
  })

  const { fields } = useFieldArray({ control, name: 'items' })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    const result = await updateInvoiceAction(invoice.id, values)
    setIsSubmitting(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Invoice updated')
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto">
        <SheetHeader className="px-6 py-4">
          <SheetTitle>Edit Invoice</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-6 py-4 flex-1">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="billing_period_start">Period Start</Label>
              <Input
                id="billing_period_start"
                type="date"
                {...register('billing_period_start')}
              />
              {errors.billing_period_start && (
                <p className="text-destructive text-sm">{errors.billing_period_start.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="billing_period_end">Period End</Label>
              <Input
                id="billing_period_end"
                type="date"
                {...register('billing_period_end')}
              />
              {errors.billing_period_end && (
                <p className="text-destructive text-sm">{errors.billing_period_end.message}</p>
              )}
            </div>
          </div>

          {fields.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Item Amounts</p>
              {fields.map((field, index) => {
                const item = invoice.invoice_items[index]
                return (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    <Label htmlFor={`items.${index}.amount`} className="text-muted-foreground text-xs">
                      {item?.order.site?.domain ?? `Item ${index + 1}`}
                    </Label>
                    <Input
                      id={`items.${index}.amount`}
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...register(`items.${index}.amount`, { valueAsNumber: true })}
                    />
                    {errors.items?.[index]?.amount && (
                      <p className="text-destructive text-sm">{errors.items[index]?.amount?.message}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <SheetFooter className="mt-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
