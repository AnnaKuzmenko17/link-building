"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Role } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import type { SiteWithRelations } from "@/lib/data/sites";
import { ConfirmDialog, StatusBadge } from "@/components/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";

import { changeSiteStatusAction } from "./actions";
import { ACTION_CONFIG } from "./constants";
import { StatusAction } from "./types";

interface Props {
  site: SiteWithRelations;
  viewerRole: Role;
  viewerUserId: string;
}

function ActionButtons({ site, viewerRole, viewerUserId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<StatusAction | null>(null);

  const canEdit =
    viewerRole === "admin" ||
    (viewerRole === "sourcer" &&
      site.created_by === viewerUserId &&
      site.status !== "archived");

  const showRequestChanges =
    viewerRole === "admin" && site.status === "pending";
  const showApprove =
    viewerRole === "admin" &&
    (site.status === "pending" || site.status === "needs_changes");
  const showArchive = viewerRole === "admin" && site.status !== "archived";
  const showUnarchive = viewerRole === "admin" && site.status === "archived";

  const hasActions =
    canEdit ||
    showRequestChanges ||
    showApprove ||
    showArchive ||
    showUnarchive;
  if (!hasActions) return null;

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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Site actions"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/${viewerRole}/sites/${site.id}/edit`)
              }
            >
              Edit
            </DropdownMenuItem>
          )}
          {canEdit &&
            (showRequestChanges ||
              showApprove ||
              showArchive ||
              showUnarchive) && <DropdownMenuSeparator />}
          {showRequestChanges && (
            <DropdownMenuItem onClick={() => setConfirm("request_changes")}>
              Request Changes
            </DropdownMenuItem>
          )}
          {showApprove && (
            <DropdownMenuItem onClick={() => setConfirm("approve")}>
              Approve
            </DropdownMenuItem>
          )}
          {showArchive && (
            <DropdownMenuItem onClick={() => setConfirm("archive")}>
              Archive
            </DropdownMenuItem>
          )}
          {showUnarchive && (
            <DropdownMenuItem onClick={() => setConfirm("unarchive")}>
              Unarchive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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

export function buildSiteColumns(
  viewerRole: Role,
  viewerUserId: string
): ColumnDef<SiteWithRelations>[] {
  const columns: ColumnDef<SiteWithRelations>[] = [
    {
      accessorKey: "domain",
      header: "Domain",
      cell: ({ row }) => (
        <span className="block max-w-50 truncate font-medium">
          {row.original.domain}
        </span>
      ),
    },
    { accessorKey: "dr", header: "DR" },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name ?? "—",
    },
    { accessorKey: "top_countries", header: "Top Countries" },
    {
      id: "countries",
      header: "Countries",
      cell: ({ row }) => row.original.countries.join(", ") || "—",
    },
    {
      id: "languages",
      header: "Languages",
      cell: ({ row }) => row.original.languages.join(", ") || "—",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `$${Number(row.original.price).toFixed(2)}`,
    },
  ];

  if (viewerRole === "sourcer" || viewerRole === "admin") {
    columns.push({
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    });
  }

  columns.push({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ActionButtons
        site={row.original}
        viewerRole={viewerRole}
        viewerUserId={viewerUserId}
      />
    ),
  });

  return columns;
}
