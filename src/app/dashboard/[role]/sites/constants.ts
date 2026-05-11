import { LinkType, SiteStatus } from "@/types";

import { StatusAction } from "./types";

export const LINK_OPTIONS: { value: LinkType; label: string }[] = [
  { value: "dofollow", label: "Dofollow" },
  { value: "nofollow", label: "Nofollow" },
  { value: "sponsored", label: "Sponsored" },
  { value: "ugc", label: "UGC" },
];

export const STATUS_OPTIONS: { value: SiteStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "needs_changes", label: "Needs Changes" },
  { value: "archived", label: "Archived" },
];

export const ACTION_CONFIG: Record<
  StatusAction,
  { title: string; description: string }
> = {
  request_changes: {
    title: "Request Changes",
    description: "Mark this site as Needs Changes?",
  },
  approve: {
    title: "Approve Site",
    description: "Approve this site and make it active?",
  },
  archive: {
    title: "Archive Site",
    description: "Archive this site? It will no longer be visible to clients.",
  },
  unarchive: {
    title: "Unarchive Site",
    description: "Unarchive this site and reset its status to Pending?",
  },
};
