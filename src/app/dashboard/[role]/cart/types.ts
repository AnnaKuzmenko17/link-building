import z from "zod";

export const createOrdersSchema = z
  .array(
    z.object({
      cartItemId: z.string().uuid(),
      siteId: z.uuid(),
      publishMonth: z
        .string()
        .regex(/^\d{4}-\d{2}-01$/, "Invalid month format"),
      comment: z.string().max(1000).optional(),
    })
  )
  .min(1);
