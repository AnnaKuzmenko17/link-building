import { notFound } from "next/navigation";

import { OrderDetail } from "@/app/dashboard/[role]/orders/order-copywriter-detail";

import { requireSession } from "@/lib/auth/get-session";
import { getOrderById } from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";
import { BackButton, PageHeader } from "@/components/shared";

import { ContentForm } from "./content-form";

interface Props {
  params: Promise<{ role: string; id: string }>;
}

export default async function ContentPage({ params }: Props) {
  const { role, id } = await params;
  const { user } = await requireSession();
  const supabase = await createClient();
  const order = await getOrderById(supabase, id);

  if (!order || order.copywriter_id !== user.id) notFound();
  if (order.status !== "in_progress" && order.status !== "needs_changes")
    notFound();

  const label =
    order.status === "needs_changes" ? "Edit Content" : "Create Content";
  const siteLabel = order.site?.domain ?? "Order";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton fallbackHref={`/dashboard/${role}/orders/${id}`} />
        <PageHeader title={`${label} — ${siteLabel}`} />
      </div>

      <OrderDetail order={order} />

      <ContentForm orderId={order.id} initialContent={order.content} />
    </div>
  );
}
