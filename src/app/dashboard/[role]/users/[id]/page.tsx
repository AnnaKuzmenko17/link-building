import { notFound } from "next/navigation";

import type { Role } from "@/types";

import { requireSession } from "@/lib/auth/get-session";
import { getActiveManagers, getUserById } from "@/lib/data/users";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format-date";
import { PageHeader, StatusBadge } from "@/components/shared";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
} from "@/components/ui";

import { UserActions } from "./user-actions";

interface Props {
  params: Promise<{ role: string; id: string }>;
}

export default async function UserDetailsPage({ params }: Props) {
  const { role: urlRole, id } = await params;

  if (urlRole !== "manager" && urlRole !== "admin") {
    notFound();
  }

  const { user: sessionUser } = await requireSession();
  const supabase = await createClient();

  const viewerRole = urlRole as Role;
  const isAdmin = viewerRole === "admin";

  const targetUser = await getUserById(supabase, id);
  if (!targetUser) notFound();

  const activeManagers =
    isAdmin && targetUser.role === "client"
      ? await getActiveManagers(supabase)
      : [];

  const fullName =
    `${targetUser.first_name} ${targetUser.last_name}`.trim() ||
    targetUser.email;

  return (
    <>
      <PageHeader
        title={fullName}
        backHref={`/dashboard/${urlRole}/users`}
        action={
          <UserActions
            targetUser={targetUser}
            viewerRole={viewerRole}
            currentUserId={sessionUser.id}
            activeManagers={activeManagers}
          />
        }
      />

      <Card>
        <CardContent>
          <div className="mb-4 flex justify-center">
            <Avatar size="lg">
              <AvatarImage src={targetUser.avatar_url ?? undefined} />
              <AvatarFallback>
                {[targetUser.first_name, targetUser.last_name]
                  .filter(Boolean)
                  .map((p) => p![0])
                  .join("")
                  .toUpperCase() || targetUser.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
            <dt className="text-muted-foreground">First Name</dt>
            <dd>{targetUser.first_name || "—"}</dd>

            <dt className="text-muted-foreground">Last Name</dt>
            <dd>{targetUser.last_name || "—"}</dd>

            <dt className="text-muted-foreground">Email</dt>
            <dd>{targetUser.email}</dd>

            <dt className="text-muted-foreground">Role</dt>
            <dd className="capitalize">{targetUser.role}</dd>

            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <StatusBadge status={targetUser.status} />
            </dd>

            {targetUser.role === "client" && (
              <>
                <dt className="text-muted-foreground">Manager</dt>
                <dd>
                  {targetUser.manager
                    ? `${targetUser.manager.first_name} ${targetUser.manager.last_name}`.trim()
                    : "Unassigned"}
                </dd>
              </>
            )}

            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(targetUser.created_at)}</dd>
          </dl>
        </CardContent>
      </Card>
    </>
  );
}
