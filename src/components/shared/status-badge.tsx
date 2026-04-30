import { Badge } from '@/components/ui/badge'
import type { OrderStatus, UserStatus, SiteStatus, InvoiceStatus } from '@/types'

type Status = OrderStatus | UserStatus | SiteStatus | InvoiceStatus

interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
}

const statusConfig: Record<Status, StatusConfig> = {
  // UserStatus
  active: { label: 'Active', variant: 'default' },
  pending: { label: 'Pending', variant: 'outline' },
  disabled: { label: 'Disabled', variant: 'secondary' },
  // SiteStatus
  archived: { label: 'Archived', variant: 'secondary' },
  // OrderStatus
  new: { label: 'New', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  content_sent: { label: 'Content Sent', variant: 'secondary' },
  needs_changes: { label: 'Needs Changes', variant: 'destructive' },
  content_approved: { label: 'Content Approved', variant: 'default' },
  published: { label: 'Published', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  canceled: { label: 'Canceled', variant: 'destructive' },
  // InvoiceStatus
  draft: { label: 'Draft', variant: 'outline' },
  sent: { label: 'Sent', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
}

interface Props {
  status: Status
}

export function StatusBadge({ status }: Props) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
