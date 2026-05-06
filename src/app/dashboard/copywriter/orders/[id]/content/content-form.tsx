'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { saveContentAction, submitContentAction } from '../../actions'

interface Props {
  orderId: string
  initialContent: string | null
}


export function ContentForm({ orderId, initialContent }: Props) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    const result = await saveContentAction(orderId, content)
    setIsSaving(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Content saved.')
    router.refresh()
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    const result = await submitContentAction(orderId, content)
    setIsSubmitting(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Content submitted.')
    router.push('/dashboard/copywriter/orders')
  }

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your content here…"
        className="min-h-[400px] resize-y font-mono text-sm"
      />
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={isSaving || isSubmitting || content.trim() === ''}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSaving || isSubmitting || content.trim() === ''}
        >
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
