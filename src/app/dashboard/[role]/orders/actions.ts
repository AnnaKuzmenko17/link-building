"use server";

import { Result } from "@/types";
import { z } from "zod";

import { requireSession } from "@/lib/auth/get-session";
import {
  assignCopywriter,
  createChangeRequest,
  getClientOrderById,
  getOrderById,
  publishOrder,
  reassignCopywriter,
  updateOrderComment,
  updateOrderPublishMonth,
  updateOrderStatus,
} from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";

import {
  editOrderSchema,
  orderIdSchema,
  publishSchema,
  requestChangesSchema,
} from "./types";

export async function assignCopywriterAction(
  orderId: string,
  copywriterId: string
): Promise<Result> {
  const { role } = await requireSession();
  if (role !== "manager" && role !== "admin")
    return { success: false, error: "Not authorized." };

  const parsedOrder = orderIdSchema.safeParse(orderId);
  const parsedCopywriter = orderIdSchema.safeParse(copywriterId);
  if (!parsedOrder.success || !parsedCopywriter.success)
    return { success: false, error: "Invalid input." };

  const supabase = await createClient();
  const order = await getOrderById(supabase, parsedOrder.data);
  if (!order) return { success: false, error: "Order not found." };
  if (order.copywriter_id !== null)
    return {
      success: false,
      error: "Order already has a copywriter. Use reassign instead.",
    };

  const { error } = await assignCopywriter(
    supabase,
    parsedOrder.data,
    parsedCopywriter.data
  );
  if (error) return { success: false, error: "Failed to assign copywriter." };

  return { success: true };
}

export async function reassignCopywriterAction(
  orderId: string,
  copywriterId: string
): Promise<Result> {
  const { role } = await requireSession();
  if (role !== "manager" && role !== "admin")
    return { success: false, error: "Not authorized." };

  const parsedOrder = orderIdSchema.safeParse(orderId);
  const parsedCopywriter = orderIdSchema.safeParse(copywriterId);
  if (!parsedOrder.success || !parsedCopywriter.success)
    return { success: false, error: "Invalid input." };

  const supabase = await createClient();
  const order = await getOrderById(supabase, parsedOrder.data);
  if (!order) return { success: false, error: "Order not found." };
  if (!order.copywriter_id)
    return { success: false, error: "Order has no copywriter to reassign." };

  const { error } = await reassignCopywriter(
    supabase,
    parsedOrder.data,
    parsedCopywriter.data
  );
  if (error) return { success: false, error: "Failed to reassign copywriter." };

  return { success: true };
}

export async function publishOrderAction(
  orderId: string,
  publishedUrl: string
): Promise<Result> {
  const { role } = await requireSession();
  if (role !== "manager" && role !== "admin")
    return { success: false, error: "Not authorized." };

  const parsed = publishSchema.safeParse({ orderId, publishedUrl });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };

  const supabase = await createClient();
  const order = await getOrderById(supabase, parsed.data.orderId);
  if (!order) return { success: false, error: "Order not found." };
  if (order.status !== "content_approved")
    return {
      success: false,
      error: "Only content-approved orders can be published.",
    };

  const { error } = await publishOrder(
    supabase,
    parsed.data.orderId,
    parsed.data.publishedUrl
  );
  if (error) return { success: false, error: "Failed to publish order." };

  return { success: true };
}

export async function cancelOrderAction(orderId: string): Promise<Result> {
  const { user, role } = await requireSession();
  if (role !== "client") return { success: false, error: "Not authorized." };

  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) return { success: false, error: "Invalid order." };

  const supabase = await createClient();
  const order = await getClientOrderById(supabase, parsed.data, user.id);
  if (!order) return { success: false, error: "Order not found." };
  if (order.status !== "new")
    return { success: false, error: "Only new orders can be canceled." };

  const { error } = await updateOrderStatus(supabase, parsed.data, "canceled");
  if (error) return { success: false, error: "Failed to cancel order." };

  return { success: true };
}

export async function editOrderAction(
  orderId: string,
  publishMonth: string,
  comment?: string
): Promise<Result> {
  const { user, role } = await requireSession();
  if (role !== "client") return { success: false, error: "Not authorized." };

  const parsed = editOrderSchema.safeParse({ orderId, publishMonth, comment });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };

  const supabase = await createClient();
  const order = await getClientOrderById(
    supabase,
    parsed.data.orderId,
    user.id
  );
  if (!order) return { success: false, error: "Order not found." };
  if (order.status !== "new")
    return { success: false, error: "Only new orders can be edited." };

  const { error: monthError } = await updateOrderPublishMonth(
    supabase,
    parsed.data.orderId,
    parsed.data.publishMonth
  );
  if (monthError) return { success: false, error: "Failed to update order." };

  const { error: commentError } = await updateOrderComment(
    supabase,
    parsed.data.orderId,
    parsed.data.comment ?? null
  );
  if (commentError) return { success: false, error: "Failed to update order." };

  return { success: true };
}

export async function approveContentAction(orderId: string): Promise<Result> {
  const { user, role } = await requireSession();
  if (role !== "client") return { success: false, error: "Not authorized." };

  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) return { success: false, error: "Invalid order." };

  const supabase = await createClient();
  const order = await getClientOrderById(supabase, parsed.data, user.id);
  if (!order) return { success: false, error: "Order not found." };
  if (order.status !== "content_sent")
    return { success: false, error: "Content has not been sent yet." };

  const { error } = await updateOrderStatus(
    supabase,
    parsed.data,
    "content_approved"
  );
  if (error) return { success: false, error: "Failed to approve content." };

  return { success: true };
}

export async function requestChangesAction(
  orderId: string,
  comment: string
): Promise<Result> {
  const { user, role } = await requireSession();
  if (role !== "client") return { success: false, error: "Not authorized." };

  const parsed = requestChangesSchema.safeParse({ orderId, comment });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };

  const supabase = await createClient();
  const order = await getClientOrderById(
    supabase,
    parsed.data.orderId,
    user.id
  );
  if (!order) return { success: false, error: "Order not found." };
  if (order.status !== "content_sent")
    return { success: false, error: "Content has not been sent yet." };

  const { error } = await createChangeRequest(
    supabase,
    parsed.data.orderId,
    parsed.data.comment,
    user.id
  );
  if (error)
    return { success: false, error: "Failed to submit change request." };

  return { success: true };
}
