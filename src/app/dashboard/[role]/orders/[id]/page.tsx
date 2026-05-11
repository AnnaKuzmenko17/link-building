import { notFound } from "next/navigation";

import { ContentForm } from "@/app/dashboard/[role]/orders/copywriter/[id]/content/content-form";

import { requireSession } from "@/lib/auth/get-session";
import { getOrderById } from "@/lib/data/orders";
import { createClient } from "@/lib/supabase/server";
import { BackButton, PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

import { ClientOrderDetailActions } from "../client-order-detail-actions";
import { OrderDetail } from "../order-copywriter-detail";
import { StartChatButton } from "./start-chat-button";

interface Props {
  params: Promise<{ role: string; id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { role, id } = await params;
  const { user } = await requireSession();
  const supabase = await createClient();
  const order = await getOrderById(supabase, id);

  if (!order) notFound();

  if (role === "client" && order.client_id !== user.id) notFound();
  if (role === "copywriter" && order.copywriter_id !== user.id) notFound();

  const canEdit =
    role === "copywriter" &&
    (order.status === "in_progress" || order.status === "needs_changes");
  const showContent = !!order.content && !canEdit;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallbackHref={`/dashboard/${role}/orders`} />
          <PageHeader title={`Order — ${order.site?.domain ?? "—"}`} />
        </div>
        {role === "client" ? (
          <ClientOrderDetailActions order={order} />
        ) : (
          <StartChatButton orderId={order.id} role={role} chatId={order.chat_id} />
        )}
      </div>

      <OrderDetail order={order} />

      {order.published_url && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Published URL
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <a
              href={order.published_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary break-all underline-offset-4 hover:underline"
            >
              {order.published_url}
            </a>
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <ContentForm orderId={order.id} initialContent={order.content} />
      )}

      {showContent && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 min-h-[100px] rounded-md p-3 font-mono text-sm whitespace-pre-wrap">
              {order.content}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
