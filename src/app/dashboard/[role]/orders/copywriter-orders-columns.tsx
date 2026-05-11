"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { startOrderChatAction } from "@/app/dashboard/[role]/chat/actions";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import type { CopywriterOrder } from "@/lib/data/orders";
import { formatPublishMonth } from "@/lib/publish-months";
import { StatusBadge } from "@/components/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";

function OrderActions({
  order,
  role,
}: {
  order: CopywriterOrder;
  role: string;
}) {
  const router = useRouter();
  const [isChatPending, startChatTransition] = useTransition();

  const showWriteContent =
    order.status === "in_progress" || order.status === "needs_changes";

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
        {showWriteContent && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/${role}/orders/${order.id}`);
            }}
          >
            Write Content
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleStartChat}>
          Start Chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function buildCopywriterOrderColumns(
  role: string
): ColumnDef<CopywriterOrder>[] {
  return [
    {
      id: "domain",
      header: "Site",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.site?.domain ?? "—"}</span>
      ),
    },
    {
      id: "dr",
      header: "DR",
      cell: ({ row }) => row.original.site?.dr ?? "—",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "publish_month",
      header: "Publish Date",
      cell: ({ row }) => formatPublishMonth(row.original.publish_month),
    },
    {
      id: "comments",
      header: "Comments",
      cell: ({ row }) =>
        row.original.change_requests.length + (row.original.comment ? 1 : 0),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <OrderActions order={row.original} role={role} />,
    },
  ];
}
