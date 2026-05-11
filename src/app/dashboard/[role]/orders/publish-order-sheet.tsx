"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { type OrderWithDetails } from "@/lib/data/orders";
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";

import { publishOrderAction } from "./actions";
import { publishSchema } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithDetails;
}

type FormValues = z.infer<typeof publishSchema>;

export function PublishOrderSheet({ open, onOpenChange, order }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(publishSchema),
    defaultValues: { orderId: order.id, publishedUrl: "" },
  });

  async function onSubmit({ publishedUrl }: FormValues) {
    setIsPending(true);
    const result = await publishOrderAction(order.id, publishedUrl);
    setIsPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Order published.");
    reset();
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Publish Order — {order.site?.domain ?? "—"}</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-4 px-4 py-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="published_url">Published URL</Label>
            <Input
              id="published_url"
              type="url"
              placeholder="https://example.com/article"
              {...register("publishedUrl")}
            />
            {errors.publishedUrl && (
              <p role="alert" className="text-destructive text-xs">
                {errors.publishedUrl.message}
              </p>
            )}
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
              {isPending ? "Publishing…" : "Publish"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
