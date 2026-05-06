'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MessageCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startOrderChatAction } from '@/app/dashboard/[role]/chat/actions'

interface Props {
  orderId: string
  role: string
}

export function StartChatButton({ orderId, role }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await startOrderChatAction(orderId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      router.push(`/dashboard/${role}/chat/${result.chatId}`)
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      <MessageCircleIcon className="size-4" />
      {isPending ? 'Opening…' : 'Start Chat'}
    </Button>
  )
}
