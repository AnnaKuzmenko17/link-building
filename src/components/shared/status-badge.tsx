import type {
  InvoiceStatus,
  OrderStatus,
  SiteStatus,
  UserStatus,
} from "@/types";

import {
  invoiceStatusConfig,
  orderStatusConfig,
  siteStatusConfig,
  userStatusConfig,
} from "@/lib/status-config";
import { Badge } from "@/components/ui";

type Status = OrderStatus | UserStatus | SiteStatus | InvoiceStatus;

const allStatusConfig = {
  ...orderStatusConfig,
  ...userStatusConfig,
  ...siteStatusConfig,
  ...invoiceStatusConfig,
};

interface Props {
  status: Status;
}

export function StatusBadge({ status }: Props) {
  const config = allStatusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
