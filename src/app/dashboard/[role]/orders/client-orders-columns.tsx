"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { startOrderChatAction } from "@/app/dashboard/[role]/chat/actions";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import type { OrderWithSite } from "@/lib/data/orders";
import { formatDate } from "@/lib/format-date";
import { formatPublishMonth } from "@/lib/publish-months";
import { ConfirmDialog, StatusBadge } from "@/components/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";

import { cancelOrderAction } from "./actions";
import { EditOrderSheet } from "./edit-order-sheet";
import { ReviewContentSheet } from "./review-content-sheet";

function OrderActions({ order, role }: { order: OrderWithSite; role: string }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isChatPending, startChatTransition] = useTransition();

  const showEdit = order.status === "new";
  const showCancel = order.status === "new";
  const showReview = order.status === "content_sent";
  const showLink =
    (order.status === "published" || order.status === "completed") &&
    !!order.published_url;

  async function handleCancel() {
    setIsCanceling(true);
    const result = await cancelOrderAction(order.id);
    setIsCanceling(false);
    setCancelOpen(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Order canceled.");
    router.refresh();
  }

  function handleStartChat(e: React.MouseEvent) {
    e.stopPropagation();
    startChatTransition(async () => {
      const result = await startOrderChatAction(order.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.push(`/dashboard/${role}/chat/${result.chatId}`);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Order actions"
              onClick={(e) => e.stopPropagation()}
              disabled={isChatPending}
            >
              <MoreHorizontalIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {showEdit && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              Edit
            </DropdownMenuItem>
          )}
          {showReview && (
            <DropdownMenuItem onClick={() => setReviewOpen(true)}>
              Review Content
            </DropdownMenuItem>
          )}
          {showLink && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  order.published_url!,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              View Published URL
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleStartChat}>
            Start Chat
          </DropdownMenuItem>
          {showCancel && <DropdownMenuSeparator />}
          {showCancel && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setCancelOpen(true)}
            >
              Cancel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditOrderSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        order={order}
      />
      <ReviewContentSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        order={order}
      />
      {cancelOpen && (
        <ConfirmDialog
          open={cancelOpen}
          onOpenChange={(open) => {
            if (!open) setCancelOpen(false);
          }}
          title="Cancel Order"
          description="Are you sure you want to cancel this order? This cannot be undone."
          confirmLabel="Cancel Order"
          variant="destructive"
          onConfirm={handleCancel}
          isLoading={isCanceling}
        />
      )}
    </>
  );
}

export function buildOrderColumns(role: string): ColumnDef<OrderWithSite>[] {
  return [
    {
      id: "domain",
      header: "Site",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.site?.domain ?? "—"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "publish_month",
      header: "Publish Month",
      cell: ({ row }) => formatPublishMonth(row.original.publish_month),
    },
    {
      id: "created_at",
      header: "Created",
      cell: ({ row }) =>
        formatDate(row.original.created_at),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <OrderActions order={row.original} role={role} />,
    },
  ];
}
