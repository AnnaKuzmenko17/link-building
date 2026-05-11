import type { OrderStatus } from "@/types";

import { Constants } from "@/types/database.types";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  content_sent: "Content Sent",
  needs_changes: "Needs Changes",
  content_approved: "Content Approved",
  published: "Published",
  completed: "Completed",
  canceled: "Canceled",
};

export const STATUS_OPTIONS = Constants.public.Enums.order_status.map(
  (value) => ({
    value,
    label: ORDER_STATUS_LABELS[value],
  })
);
