import { Role } from "@/types";
import z from "zod";

export function buildSchema(viewerRole: Role) {
  return z
    .object({
      first_name: z.string().min(1, "First name is required"),
      last_name: z.string().min(1, "Last name is required"),
      email: z.email("Enter a valid email address"),
      role: z.enum(["client", "manager", "copywriter", "sourcer", "admin"]),
      manager_id: z.uuid("Select a manager").optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.role === "client" &&
        viewerRole !== "manager" &&
        !data.manager_id
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["manager_id"],
          message: "A manager is required for client users.",
        });
      }
    });
}
