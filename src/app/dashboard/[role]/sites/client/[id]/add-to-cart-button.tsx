"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui";

import { addToCartAction } from "../actions";

interface Props {
  siteId: string;
  inCart: boolean;
}

export function AddToCartButton({ siteId, inCart }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    if (inCart) return;
    const result = await addToCartAction(siteId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Added to cart.");
    startTransition(() => router.refresh());
  }

  return (
    <Button
      variant={inCart ? "secondary" : "default"}
      disabled={inCart || isPending}
      onClick={handleClick}
    >
      <ShoppingCartIcon className="size-4" />
      {inCart ? "In Cart" : "Add to Cart"}
    </Button>
  );
}
