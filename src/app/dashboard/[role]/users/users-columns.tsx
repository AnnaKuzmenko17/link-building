"use client";

import { useRouter } from "next/navigation";

import type { ColumnDef } from "@tanstack/react-table";

import type { UserWithManager } from "@/lib/data/users";
import { capitalize, getInitials } from "@/lib/utils";
import { DataTable, StatusBadge } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui";

const columns: ColumnDef<UserWithManager>[] = [
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const { first_name, last_name, email, avatar_url } = row.original;
      const name = `${first_name} ${last_name}`.trim() || "—";
      return (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage src={avatar_url ?? undefined} />
            <AvatarFallback>
              {getInitials(first_name, last_name, email)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => capitalize(getValue<string>()),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <StatusBadge status={getValue<UserWithManager["status"]>()} />
    ),
  },
  {
    id: "manager",
    header: "Manager",
    cell: ({ row }) => {
      if (row.original.role !== "client") return "—";
      const m = row.original.manager;
      return m ? `${m.first_name} ${m.last_name}`.trim() : "—";
    },
  },
];

interface UsersTableProps {
  data: UserWithManager[];
  basePath: string;
}

export function UsersTable({ data, basePath }: UsersTableProps) {
  const router = useRouter();
  return (
    <DataTable
      columns={columns}
      data={data}
      onRowClick={(user) => router.push(`${basePath}/${user.id}`)}
    />
  );
}
