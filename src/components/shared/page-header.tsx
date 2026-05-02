import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeftIcon } from 'lucide-react'

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
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="size-5" />
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight truncate min-w-0">{title}</h1>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}
