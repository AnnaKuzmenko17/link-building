import { notFound, redirect } from "next/navigation";

import { SiteForm } from "@/app/dashboard/[role]/sites/site-form";

import { requireSession } from "@/lib/auth/get-session";
import { getCategories, getSiteById } from "@/lib/data/sites";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared";

interface Props {
  params: Promise<{ role: string; id: string }>;
}

export default async function EditSitePage({ params }: Props) {
  const { role: roleParam, id } = await params;
  const { user, role } = await requireSession();

  if (role !== "sourcer" && role !== "admin") redirect(`/dashboard/${role}`);

  const supabase = await createClient();
  const [site, categories] = await Promise.all([
    getSiteById(supabase, id),
    getCategories(supabase),
  ]);

  if (!site) notFound();

  const isSourcer = role === "sourcer";
  if (
    isSourcer &&
    (site.created_by !== user.id || site.status === "archived")
  ) {
    redirect(`/dashboard/${roleParam}/sites/${id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Site"
        backHref={`/dashboard/${roleParam}/sites/${id}`}
      />
      <SiteForm
        categories={categories}
        site={site}
        backHref={`/dashboard/${roleParam}/sites/${id}`}
        isSourcer={isSourcer}
        isAdmin={role === "admin"}
      />
    </div>
  );
}
