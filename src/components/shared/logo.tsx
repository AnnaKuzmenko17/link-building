import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className, href }: { className?: string; href?: string }) {
  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-primary-foreground"
      >
        <rect width="28" height="28" rx="7" className="fill-primary" />
        {/* left link ring */}
        <path
          d="M11 14a3 3 0 0 1 3-3h2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10 11h-1a3 3 0 0 0 0 6h1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* right link ring */}
        <path
          d="M17 14a3 3 0 0 0-3 3h-2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M18 17h1a3 3 0 0 0 0-6h-1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* centre connector */}
        <line x1="11" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-lg font-semibold tracking-tight">LinkBuilding</span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
