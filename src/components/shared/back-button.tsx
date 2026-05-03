'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'

interface Props {
  fallbackHref: string
}

export function BackButton({ fallbackHref }: Props) {
  const router = useRouter()

  function handleClick() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors shrink-0"
      aria-label="Go back"
      type="button"
    >
      <ArrowLeftIcon className="size-5" />
    </button>
  )
}
