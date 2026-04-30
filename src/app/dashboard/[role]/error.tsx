'use client'

import { Button } from '@/components/ui/button'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ reset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">An unexpected error occurred while loading this page.</p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  )
}
