'use client'

import { useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { approveContentAction, requestChangesAction } from './actions'
import type { OrderWithSite } from '@/lib/data/orders'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderWithSite
}

export function ReviewContentSheet({ open, onOpenChange, order }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [changesDialogOpen, setChangesDialogOpen] = useState(false)
  const [comment, setComment] = useState('')

  async function handleApprove() {
    setIsPending(true)
    const result = await approveContentAction(order.id)
    setIsPending(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Content approved.')
    onOpenChange(false)
    router.refresh()
  }

  async function handleRequestChanges() {
    setIsPending(true)
    const result = await requestChangesAction(order.id, comment)
    setIsPending(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Changes requested.')
    setChangesDialogOpen(false)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Review Content — {order.site?.domain ?? '—'}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-2 px-4 py-4">
            <Label>Content</Label>
            <div className="min-h-[200px] rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {order.content ?? 'No content submitted yet.'}
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" disabled={isPending} onClick={() => setChangesDialogOpen(true)}>
              Needs Changes
            </Button>
            <Button disabled={isPending} onClick={handleApprove}>
              {isPending ? 'Please wait…' : 'Approve'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={changesDialogOpen} onOpenChange={setChangesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe the changes needed. The copywriter will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="change_comment">Comment</Label>
            <Textarea
              id="change_comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="What needs to be changed?"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={isPending} onClick={() => setChangesDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending || !comment.trim()} onClick={handleRequestChanges}>
              {isPending ? 'Submitting…' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
