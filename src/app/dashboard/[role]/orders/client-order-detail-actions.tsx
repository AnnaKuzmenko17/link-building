"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "sonner";

import { type OrderWithFullDetails } from "@/lib/data/orders";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui";

import { StartChatButton } from "./[id]/start-chat-button";
import { cancelOrderAction } from "./actions";
import { EditOrderSheet } from "./edit-order-sheet";
import { ReviewContentSheet } from "./review-content-sheet";

interface Props {
  order: OrderWithFullDetails;
}

export function ClientOrderDetailActions({ order }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleCancel() {
    setIsPending(true);
    const result = await cancelOrderAction(order.id);
    setIsPending(false);
    setCancelOpen(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Order canceled.");
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        {order.status === "new" && (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        )}
        {order.status === "content_sent" && (
          <Button size="sm" onClick={() => setReviewOpen(true)}>
            Review Content
          </Button>
        )}
        <StartChatButton orderId={order.id} role="client" />
        {order.status === "new" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCancelOpen(true)}
          >
            Cancel Order
          </Button>
        )}
      </div>

      <EditOrderSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => router.refresh()}
        order={order}
      />
      <ReviewContentSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        order={order}
      />
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
        isLoading={isPending}
      />
    </>
  );
}
