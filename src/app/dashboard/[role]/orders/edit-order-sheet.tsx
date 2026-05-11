"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import type { OrderWithSite } from "@/lib/data/orders";
import { getPublishMonthOptions } from "@/lib/publish-months";
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from "@/components/ui";

import { editOrderAction } from "./actions";
import { editOrderSchema } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  order: OrderWithSite;
}

type FormValues = z.infer<typeof editOrderSchema>;

export function EditOrderSheet({
  open,
  onOpenChange,
  onSuccess,
  order,
}: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const publishMonthOptions = getPublishMonthOptions();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(editOrderSchema),
    values: {
      orderId: order.id,
      publishMonth: order.publish_month,
      comment: order.comment ?? "",
    },
  });

  async function onSubmit({ publishMonth, comment }: FormValues) {
    setIsPending(true);
    const result = await editOrderAction(
      order.id,
      publishMonth,
      comment || undefined
    );
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Order updated.");
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    } else {
      router.refresh();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Order — {order.site?.domain ?? "—"}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 px-4 py-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="publish_month">Publish Month</Label>
            <Controller
              name="publishMonth"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={publishMonthOptions}
                >
                  <SelectTrigger id="publish_month" className="w-full">
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
              )}
            />
            {errors.publishMonth && (
              <p role="alert" className="text-destructive text-xs">
                {errors.publishMonth.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              {...register("comment")}
              placeholder="Add a comment…"
              maxLength={1000}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
