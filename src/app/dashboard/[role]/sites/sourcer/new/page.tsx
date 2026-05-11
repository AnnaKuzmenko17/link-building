import { redirect } from "next/navigation";

import { SiteForm } from "@/app/dashboard/[role]/sites/site-form";

import { requireSession } from "@/lib/auth/get-session";
import { getCategories } from "@/lib/data/sites";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared";

interface Props {
  params: Promise<{ role: string }>;
}

export default async function NewSitePage({ params }: Props) {
  const { role } = await params;
  const { role: sessionRole } = await requireSession();
  if (sessionRole !== "sourcer") redirect(`/dashboard/${sessionRole}`);

  const supabase = await createClient();
  const categories = await getCategories(supabase);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Add Site" backHref={`/dashboard/${role}/sites`} />
      <SiteForm
        categories={categories}
        backHref={`/dashboard/${role}/sites`}
        isSourcer
      />
    </div>
  );
}
