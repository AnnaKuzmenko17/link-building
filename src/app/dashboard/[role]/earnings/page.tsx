import { requireSession } from "@/lib/auth/get-session";
import { getEarnings } from "@/lib/data/earnings";
import { getActiveSourcers } from "@/lib/data/users";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared";

import { EarningsClient } from "./earnings-client";

interface Props {
  params: Promise<{ role: string }>;
}

export default async function EarningsPage({ params }: Props) {
  const { role } = await params;
  const { user } = await requireSession();
  const supabase = await createClient();

  const viewerRole = role as "admin" | "manager" | "sourcer";

  const [rows, sourcers] = await Promise.all([
    getEarnings(supabase, { viewerRole, viewerId: user.id }),
    viewerRole === "admin" || viewerRole === "manager"
      ? getActiveSourcers(supabase)
      : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Earnings" />
      <EarningsClient rows={rows} sourcers={sourcers} role={viewerRole} />
    </div>
  );
}
