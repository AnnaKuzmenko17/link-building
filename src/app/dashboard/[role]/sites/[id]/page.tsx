import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import type { Role } from "@/types";

import { requireSession } from "@/lib/auth/get-session";
import { getSiteById } from "@/lib/data/sites";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Card, CardContent } from "@/components/ui";

import { SiteDetailActions } from "./site-detail-actions";

interface Props {
  params: Promise<{ role: string; id: string }>;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export default async function SiteDetailPage({ params }: Props) {
  const { role: roleParam, id } = await params;
  const { user, role } = await requireSession();

  const supabase = await createClient();
  const site = await getSiteById(supabase, id);

  if (!site) notFound();

  const showStatus = role === "sourcer" || role === "admin";
  const showRestricted =
    role === "sourcer" || role === "manager" || role === "admin";
  const isAdmin = role === "admin";
  const isSourcer = role === "sourcer";

  const canEdit =
    isAdmin ||
    (isSourcer && site.created_by === user.id && site.status !== "archived");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={site.domain}
        backHref={`/dashboard/${roleParam}/sites`}
        action={
          <SiteDetailActions
            site={site}
            viewerRole={role as Role}
            canEdit={canEdit}
          />
        }
      />

      <Card>
        <CardContent className="pt-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Domain" value={site.domain} />
            <Field label="DR" value={site.dr} />
            <Field label="Category" value={site.category?.name} />
            <Field label="Top Countries" value={site.top_countries} />
            <Field label="Countries" value={site.countries.join(", ")} />
            <Field label="Languages" value={site.languages.join(", ")} />
            <Field label="Price" value={`$${Number(site.price).toFixed(2)}`} />
            <Field label="Link Type" value={site.link_type} />
            <Field
              label="Organic Keywords"
              value={site.organic_keywords_count}
            />
            <Field label="Organic Traffic" value={site.organic_traffic_count} />
            {site.keywords_relevance && (
              <Field
                label="Keywords Relevance"
                value={site.keywords_relevance}
              />
            )}

            {showStatus && (
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground text-xs">Status</dt>
                <dd>
                  <StatusBadge status={site.status} />
                </dd>
              </div>
            )}

            {isAdmin && site.status === "needs_changes" && (
              <>
                <Field
                  label="Needs Changes By"
                  value={
                    site.needs_changes_by_user
                      ? `${site.needs_changes_by_user.first_name} ${site.needs_changes_by_user.last_name}`
                      : "—"
                  }
                />
                <Field
                  label="Needs Changes At"
                  value={
                    site.needs_changes_at
                      ? new Date(site.needs_changes_at).toLocaleString()
                      : "—"
                  }
                />
              </>
            )}

            {isAdmin && site.status === "active" && (
              <>
                <Field
                  label="Approved By"
                  value={
                    site.approved_by_user
                      ? `${site.approved_by_user.first_name} ${site.approved_by_user.last_name}`
                      : "—"
                  }
                />
                <Field
                  label="Approved At"
                  value={
                    site.approved_at
                      ? new Date(site.approved_at).toLocaleString()
                      : "—"
                  }
                />
              </>
            )}

            {showRestricted && site.requirements && (
              <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                <dt className="text-muted-foreground text-xs">Requirements</dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {site.requirements}
                </dd>
              </div>
            )}

            {showRestricted && site.description && (
              <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                <dt className="text-muted-foreground text-xs">Description</dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {site.description}
                </dd>
              </div>
            )}

            {(isSourcer || isAdmin) && site.sourcer_notes && (
              <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                <dt className="text-muted-foreground text-xs">Sourcer Notes</dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {site.sourcer_notes}
                </dd>
              </div>
            )}

            {showRestricted && site.contact_info && (
              <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                <dt className="text-muted-foreground text-xs">Contact Info</dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {site.contact_info}
                </dd>
              </div>
            )}

            {isAdmin && site.created_by_user && (
              <Field
                label="Created By"
                value={`${site.created_by_user.first_name} ${site.created_by_user.last_name}`}
              />
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
