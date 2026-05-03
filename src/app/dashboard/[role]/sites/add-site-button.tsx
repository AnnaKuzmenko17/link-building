import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

interface Props {
  role: string
}

export function AddSiteButton({ role }: Props) {
  return (
    <Link href={`/dashboard/${role}/sites/new`} className={buttonVariants()}>
      Add Site
    </Link>
  )
}
