import z from "zod";

export const saveSchema = z.object({
  orderId: z.uuid(),
  content: z.string().min(1, "Content cannot be empty."),
});
