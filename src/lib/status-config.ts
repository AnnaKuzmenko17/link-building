import type {
  InvoiceStatus,
  OrderStatus,
  SiteStatus,
  UserStatus,
} from "@/types";

export interface StatusMeta {
  label: string;
  className: string;
}

export const orderStatusConfig: Record<OrderStatus, StatusMeta> = {
  new: {
    label: "New",
    className: "border-blue-500/20 bg-blue-500/15 text-blue-400",
  },
  in_progress: {
    label: "In Progress",
    className: "border-amber-500/20 bg-amber-500/15 text-amber-400",
  },
  content_sent: {
    label: "Content Sent",
    className: "border-indigo-500/20 bg-indigo-500/15 text-indigo-400",
  },
  needs_changes: {
    label: "Needs Changes",
    className: "border-red-500/20 bg-red-500/15 text-red-400",
  },
  content_approved: {
    label: "Content Approved",
    className: "border-teal-500/20 bg-teal-500/15 text-teal-400",
  },
  published: {
    label: "Published",
    className: "border-green-500/20 bg-green-500/15 text-green-400",
  },
  completed: {
    label: "Completed",
    className: "border-emerald-500/20 bg-emerald-500/15 text-emerald-400",
  },
  canceled: {
    label: "Canceled",
    className: "border-zinc-500/20 bg-zinc-500/15 text-zinc-400",
  },
};

export const userStatusConfig: Record<UserStatus, StatusMeta> = {
  active: {
    label: "Active",
    className: "border-green-500/20 bg-green-500/15 text-green-400",
  },
  pending: {
    label: "Pending",
    className: "border-amber-500/20 bg-amber-500/15 text-amber-400",
  },
  disabled: {
    label: "Disabled",
    className: "border-zinc-500/20 bg-zinc-500/15 text-zinc-400",
  },
};

export const siteStatusConfig: Record<SiteStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    className: "border-amber-500/20 bg-amber-500/15 text-amber-400",
  },
  active: {
    label: "Active",
    className: "border-green-500/20 bg-green-500/15 text-green-400",
  },
  needs_changes: {
    label: "Needs Changes",
    className: "border-red-500/20 bg-red-500/15 text-red-400",
  },
  archived: {
    label: "Archived",
    className: "border-zinc-500/20 bg-zinc-500/15 text-zinc-400",
  },
};

export const invoiceStatusConfig: Record<InvoiceStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    className: "border-zinc-500/20 bg-zinc-500/15 text-zinc-400",
  },
  sent: {
    label: "Sent",
    className: "border-blue-500/20 bg-blue-500/15 text-blue-400",
  },
  paid: {
    label: "Paid",
    className: "border-green-500/20 bg-green-500/15 text-green-400",
  },
};
