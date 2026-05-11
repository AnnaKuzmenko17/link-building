import z from "zod";

export const addToCartSchema = z.object({ siteId: z.uuid() });
