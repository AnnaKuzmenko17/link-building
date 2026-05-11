import { requireSession } from "@/lib/auth/get-session";
import { getCartSiteIds } from "@/lib/data/cart";
import { getCategories, getSites } from "@/lib/data/sites";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared";

import { SitesCatalogClient } from "./sites-catalog-client";

export default async function ClientSitesPage() {
  const { user } = await requireSession();
  const supabase = await createClient();

  const [sites, categories, cartSiteIdsList] = await Promise.all([
    getSites(supabase, {}, "client", user.id),
    getCategories(supabase),
    getCartSiteIds(supabase, user.id),
  ]);

  const cartSiteIds = new Set(cartSiteIdsList);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Site Catalog" />
      <SitesCatalogClient
        sites={sites}
        categories={categories}
        cartSiteIds={cartSiteIds}
      />
    </div>
  );
}
