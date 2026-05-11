"use server";

import { Result } from "@/types";

import { requireSession } from "@/lib/auth/get-session";
import {
  getOrderById,
  saveOrderContent,
  updateOrderStatus,
} from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";

import { saveSchema } from "./types";

export async function saveContentAction(
  orderId: string,
  content: string
): Promise<Result> {
  const { user, role } = await requireSession();
  if (role !== "copywriter")
    return { success: false, error: "Not authorized." };

  const parsed = saveSchema.safeParse({ orderId, content });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };

  const supabase = await createClient();
  const order = await getOrderById(supabase, parsed.data.orderId);
  if (!order) return { success: false, error: "Order not found." };
  if (order.copywriter_id !== user.id)
    return { success: false, error: "Not authorized." };
  if (order.status !== "in_progress" && order.status !== "needs_changes") {
    return {
      success: false,
      error: "Order cannot be edited in its current status.",
    };
  }

  const { error } = await saveOrderContent(
    supabase,
    parsed.data.orderId,
    parsed.data.content
  );
  if (error) return { success: false, error: "Failed to save content." };

  return { success: true };
}

export async function submitContentAction(
  orderId: string,
  content: string
): Promise<Result> {
  const { user, role } = await requireSession();
  if (role !== "copywriter")
    return { success: false, error: "Not authorized." };

  const parsed = saveSchema.safeParse({ orderId, content });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };

  const supabase = await createClient();
  const order = await getOrderById(supabase, parsed.data.orderId);
  if (!order) return { success: false, error: "Order not found." };
  if (order.copywriter_id !== user.id)
    return { success: false, error: "Not authorized." };
  if (order.status !== "in_progress" && order.status !== "needs_changes") {
    return {
      success: false,
      error: "Order cannot be submitted in its current status.",
    };
  }

  const { error: saveError } = await saveOrderContent(
    supabase,
    parsed.data.orderId,
    parsed.data.content
  );
  if (saveError) return { success: false, error: "Failed to save content." };

  const { error: statusError } = await updateOrderStatus(
    supabase,
    parsed.data.orderId,
    "content_sent"
  );
  if (statusError)
    return { success: false, error: "Failed to submit content." };

  return { success: true };
}
