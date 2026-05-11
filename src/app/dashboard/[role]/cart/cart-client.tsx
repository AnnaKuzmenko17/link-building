"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import type { CartItemWithSite } from "@/lib/data/cart";
import { getPublishMonthOptions } from "@/lib/publish-months";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";

import { createOrdersAction, removeFromCartAction } from "./actions";

interface Props {
  cartItems: CartItemWithSite[];
}

export function CartClient({ cartItems }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [months, setMonths] = useState<Record<string, string>>(() =>
    Object.fromEntries(cartItems.map((item) => [item.id, ""]))
  );
  const [comments, setComments] = useState<Record<string, string>>(() =>
    Object.fromEntries(cartItems.map((item) => [item.id, ""]))
  );
  const [isPending, setIsPending] = useState(false);

  const publishMonthOptions = getPublishMonthOptions();
  const allSelected =
    cartItems.length > 0 && cartItems.every((item) => !!months[item.id]);

  async function handleRemove(cartItemId: string) {
    setIsPending(true);
    const result = await removeFromCartAction(cartItemId);
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Item removed.");
    startTransition(() => router.refresh());
  }

  async function handleCreateOrders() {
    const items = cartItems.map((item) => ({
      cartItemId: item.id,
      siteId: item.site_id,
      publishMonth: months[item.id],
      comment: comments[item.id] || undefined,
    }));
    setIsPending(true);
    const result = await createOrdersAction(items);
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Orders created successfully.");
    startTransition(() => router.push("/dashboard/client/orders"));
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button
          variant="link"
          className="mt-2"
          onClick={() => router.push("/dashboard/client/sites")}
        >
          Browse sites
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {item.site?.domain ?? "—"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {item.site.category?.name ?? "—"} · $
                  {Number(item.site.price).toFixed(2)}
                </p>
              </div>

              <Select
                value={months[item.id]}
                onValueChange={(v) =>
                  setMonths((prev) => ({ ...prev, [item.id]: v ?? "" }))
                }
                items={publishMonthOptions}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {publishMonthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove from cart"
                disabled={isPending}
                onClick={() => handleRemove(item.id)}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>

            <Textarea
              value={comments[item.id]}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, [item.id]: e.target.value }))
              }
              placeholder="Comment (optional)"
              maxLength={1000}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleCreateOrders}
          disabled={!allSelected || isPending}
        >
          {isPending ? "Creating…" : "Create Orders"}
        </Button>
      </div>
    </div>
  );
}
