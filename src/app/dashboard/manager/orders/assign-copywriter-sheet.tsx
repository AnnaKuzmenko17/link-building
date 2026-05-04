'use client'

import { useState } from 'react'
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
import { assignCopywriterAction, reassignCopywriterAction } from './actions'
import type { OrderWithDetails } from '@/lib/data/orders'
import type { ActiveCopywriter } from '@/lib/data/users'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderWithDetails
  copywriters: ActiveCopywriter[]
}

export function AssignCopywriterSheet({ open, onOpenChange, order, copywriters }: Props) {
  const router = useRouter()
  const isReassign = order.copywriter_id !== null
  const [selectedId, setSelectedId] = useState(order.copywriter_id ?? '')
  const [isPending, setIsPending] = useState(false)

  const allCopywriters =
    order.copywriter && !copywriters.some((cw) => cw.id === order.copywriter!.id)
      ? [...copywriters, order.copywriter]
      : copywriters

  async function handleSave() {
    if (!selectedId) return
    setIsPending(true)
    const action = isReassign ? reassignCopywriterAction : assignCopywriterAction
    const result = await action(order.id, selectedId)
    setIsPending(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(isReassign ? 'Copywriter reassigned.' : 'Copywriter assigned.')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isReassign ? 'Reassign Copywriter' : 'Assign Copywriter'} — {order.site.domain}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="copywriter">Copywriter</Label>
            <Select
              value={selectedId}
              onValueChange={(v) => setSelectedId(v ?? '')}
              items={allCopywriters.map((cw) => ({ value: cw.id, label: `${cw.first_name} ${cw.last_name}` }))}
            >
              <SelectTrigger id="copywriter" className="w-full">
                <SelectValue placeholder="Select a copywriter" />
              </SelectTrigger>
              <SelectContent>
                {allCopywriters.map((cw) => (
                  <SelectItem key={cw.id} value={cw.id}>
                    {cw.first_name} {cw.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="px-4 pb-4">
          <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isPending || !selectedId} onClick={handleSave}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
