"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { startOrderChatAction } from "@/app/dashboard/[role]/chat/actions";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { type OrderWithDetails } from "@/lib/data/orders";
import { type ActiveCopywriter } from "@/lib/data/users";
import { formatPublishMonth } from "@/lib/publish-months";
import { StatusBadge } from "@/components/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";

import { AssignCopywriterSheet } from "./assign-copywriter-sheet";
import { PublishOrderSheet } from "./publish-order-sheet";

interface OrderActionsProps {
  order: OrderWithDetails;
  copywriters: ActiveCopywriter[];
  role: string;
}

function OrderActions({ order, copywriters, role }: OrderActionsProps) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [isChatPending, startChatTransition] = useTransition();

  const showAssign = order.copywriter_id === null;
  const showReassign = order.copywriter_id !== null;
  const showPublish = order.status === "content_approved";

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
          {showAssign && (
            <DropdownMenuItem onClick={() => setAssignOpen(true)}>
              Assign Copywriter
            </DropdownMenuItem>
          )}
          {showReassign && (
            <DropdownMenuItem onClick={() => setAssignOpen(true)}>
              Reassign
            </DropdownMenuItem>
          )}
          {showPublish && (
            <DropdownMenuItem onClick={() => setPublishOpen(true)}>
              Publish
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleStartChat}>
            Start Chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {assignOpen && (
        <AssignCopywriterSheet
          open={assignOpen}
          onOpenChange={setAssignOpen}
          order={order}
          copywriters={copywriters}
        />
      )}

      {publishOpen && (
        <PublishOrderSheet
          open={publishOpen}
          onOpenChange={setPublishOpen}
          order={order}
        />
      )}
    </>
  );
}

export function buildManagerOrderColumns(
  copywriters: ActiveCopywriter[],
  role: string
): ColumnDef<OrderWithDetails>[] {
  return [
    {
      id: "domain",
      header: "Site",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.site?.domain ?? "—"}</span>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: ({ row }) =>
        row.original.client
          ? `${row.original.client.first_name} ${row.original.client.last_name}`
          : "—",
    },
    {
      id: "copywriter",
      header: "Copywriter",
      cell: ({ row }) =>
        row.original.copywriter ? (
          `${row.original.copywriter.first_name} ${row.original.copywriter.last_name}`
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
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
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <OrderActions
          order={row.original}
          copywriters={copywriters}
          role={role}
        />
      ),
    },
  ];
}
