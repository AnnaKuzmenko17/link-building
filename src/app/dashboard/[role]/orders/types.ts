import { z } from "zod";

export const orderIdSchema = z.uuid();

export const publishSchema = z.object({
  orderId: z.uuid(),
  publishedUrl: z.url("Please enter a valid URL"),
});

export const editOrderSchema = z.object({
  orderId: z.uuid(),
  publishMonth: z.string().regex(/^\d{4}-\d{2}-01$/, "Invalid month format"),
  comment: z.string().max(1000).optional(),
});

export const requestChangesSchema = z.object({
  orderId: z.uuid(),
  comment: z.string().min(1, "Comment is required").max(2000),
});
