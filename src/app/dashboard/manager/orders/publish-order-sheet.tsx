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
import { publishOrderAction } from './actions'
import type { OrderWithDetails } from '@/lib/data/orders'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderWithDetails
}

const schema = z.object({
  publishedUrl: z.string().url('Please enter a valid URL'),
})

type FormValues = z.infer<typeof schema>

export function PublishOrderSheet({ open, onOpenChange, order }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { publishedUrl: '' },
  })

  async function onSubmit({ publishedUrl }: FormValues) {
    setIsPending(true)
    const result = await publishOrderAction(order.id, publishedUrl)
    setIsPending(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Order published.')
    reset()
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Publish Order — {order.site?.domain ?? '—'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="published_url">Published URL</Label>
            <Input
              id="published_url"
              type="url"
              placeholder="https://example.com/article"
              {...register('publishedUrl')}
            />
            {errors.publishedUrl && (
              <p role="alert" className="text-xs text-destructive">{errors.publishedUrl.message}</p>
            )}
          </div>

          <SheetFooter className="px-0">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Publishing…' : 'Publish'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
