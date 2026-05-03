import type { ReactNode } from 'react'
import { BackButton } from './back-button'

interface Props {
  title: string
  backHref?: string
  action?: ReactNode
}

export function PageHeader({ title, backHref, action }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {backHref && (
          <BackButton fallbackHref={backHref} />
        )}
        <h1 className="text-2xl font-semibold tracking-tight truncate min-w-0">{title}</h1>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}
