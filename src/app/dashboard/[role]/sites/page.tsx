import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/get-session";
import { getCategories, getSites } from "@/lib/data/sites";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared";

import { AddSiteButton } from "./add-site-button";
import { SitesClient } from "./sites-client";

export default async function SitesPage() {
  const { user, role } = await requireSession();

  if (role === "copywriter") redirect(`/dashboard/${role}`);

  const supabase = await createClient();
  const [sites, categories] = await Promise.all([
    getSites(supabase, {}, role, user.id),
    getCategories(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sites"
        action={role === "sourcer" ? <AddSiteButton role={role} /> : undefined}
      />
      <SitesClient
        sites={sites}
        categories={categories}
        viewerRole={role}
        viewerUserId={user.id}
      />
    </div>
  );
}
