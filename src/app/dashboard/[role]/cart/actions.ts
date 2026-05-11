"use server";

import { Result } from "@/types";
import { z } from "zod";

import { requireSession } from "@/lib/auth/get-session";
import { clearCart, removeFromCart } from "@/lib/data/cart";
import { createOrders } from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";

import { createOrdersSchema } from "./types";

export async function removeFromCartAction(
  cartItemId: string
): Promise<Result> {
  const { user, role } = await requireSession();
  if (role !== "client") return { success: false, error: "Not authorized." };

  const parsed = z.uuid().safeParse(cartItemId);
  if (!parsed.success) return { success: false, error: "Invalid cart item." };

  const supabase = await createClient();
  const { error } = await removeFromCart(supabase, parsed.data, user.id);
  if (error) return { success: false, error: "Failed to remove item." };

  return { success: true };
}

export async function createOrdersAction(
  items: Array<{
    cartItemId: string;
    siteId: string;
    publishMonth: string;
    comment?: string;
  }>
): Promise<Result> {
  const { user, role } = await requireSession();
  if (role !== "client") return { success: false, error: "Not authorized." };

  const parsed = createOrdersSchema.safeParse(items);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };

  const supabase = await createClient();

  const rows = parsed.data.map(({ siteId, publishMonth, comment }) => ({
    client_id: user.id,
    site_id: siteId,
    publish_month: publishMonth,
    status: "new" as const,
    comment: comment || null,
  }));

  const { error: insertError } = await createOrders(supabase, rows);
  if (insertError)
    return {
      success: false,
      error: "Failed to create orders. Please try again.",
    };

  const { error: clearError } = await clearCart(supabase, user.id);
  if (clearError)
    console.error("[createOrdersAction] clearCart failed:", clearError.message);

  return { success: true };
}
