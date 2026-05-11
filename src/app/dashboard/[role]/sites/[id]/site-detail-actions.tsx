"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Role } from "@/types";
import { toast } from "sonner";

import type { SiteWithRelations } from "@/lib/data/sites";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui";

import { changeSiteStatusAction } from "../actions";

interface Props {
  site: SiteWithRelations;
  viewerRole: Role;
  canEdit: boolean;
}

type StatusAction = "request_changes" | "approve" | "archive" | "unarchive";

const ACTION_CONFIG: Record<
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

export function SiteDetailActions({ site, viewerRole, canEdit }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<StatusAction | null>(null);

  async function handleConfirm() {
    if (!confirm) return;
    setPending(true);
    const result = await changeSiteStatusAction(site.id, confirm);
    setPending(false);
    setConfirm(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Status updated.");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/${viewerRole}/sites/${site.id}/edit`)
            }
          >
            Edit
          </Button>
        )}
        {viewerRole === "admin" && site.status === "pending" && (
          <Button
            variant="outline"
            onClick={() => setConfirm("request_changes")}
          >
            Request Changes
          </Button>
        )}
        {viewerRole === "admin" &&
          (site.status === "pending" || site.status === "needs_changes") && (
            <Button onClick={() => setConfirm("approve")}>Approve</Button>
          )}
        {viewerRole === "admin" && site.status !== "archived" && (
          <Button variant="outline" onClick={() => setConfirm("archive")}>
            Archive
          </Button>
        )}
        {viewerRole === "admin" && site.status === "archived" && (
          <Button variant="outline" onClick={() => setConfirm("unarchive")}>
            Unarchive
          </Button>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onOpenChange={(open) => {
            if (!open) setConfirm(null);
          }}
          title={ACTION_CONFIG[confirm].title}
          description={ACTION_CONFIG[confirm].description}
          onConfirm={handleConfirm}
          isLoading={pending}
        />
      )}
    </>
  );
}
