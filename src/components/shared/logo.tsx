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
        {/* left ring */}
        <rect x="5" y="11" width="8" height="6" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        {/* right ring */}
        <rect x="15" y="11" width="8" height="6" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        {/* overlap connector */}
        <line x1="13" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-lg font-semibold tracking-tight">Linkly</span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
