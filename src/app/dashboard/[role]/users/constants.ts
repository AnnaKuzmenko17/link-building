import { Role, UserStatus } from "@/types";

import { Constants } from "@/types/database.types";

export const MANAGER_ALLOWED_ROLES: Role[] = [
  "client",
  "copywriter",
  "sourcer",
];

export const ALL_ROLES: readonly Role[] = Constants.public.Enums.role;

export const ROLE_OPTIONS: { value: Role | "all"; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "client", label: "Client" },
  { value: "manager", label: "Manager" },
  { value: "copywriter", label: "Copywriter" },
  { value: "sourcer", label: "Sourcer" },
  { value: "admin", label: "Admin" },
];

export const STATUS_OPTIONS: { value: UserStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];
