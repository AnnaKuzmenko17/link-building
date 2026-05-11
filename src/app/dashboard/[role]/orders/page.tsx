import { notFound } from "next/navigation";

import { requireSession } from "@/lib/auth/get-session";
import {
  getAllOrders,
  getClientOrders,
  getCopywriterOrders,
} from "@/lib/data/orders";
import { getActiveClients, getActiveCopywriters } from "@/lib/data/users";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared";

import { ClientOrdersClient } from "./client-orders-client";
import { CopywriterOrdersClient } from "./copywriter-orders-client";
import { ManagerOrdersClient } from "./orders-client";

interface Props {
  params: Promise<{ role: string }>;
}

export default async function OrdersPage({ params }: Props) {
  const { role } = await params;
  const { user } = await requireSession();
  const supabase = await createClient();

  if (role === "admin" || role === "manager") {
    const [orders, copywriters, clients] = await Promise.all([
      getAllOrders(supabase),
      getActiveCopywriters(supabase),
      getActiveClients(supabase),
    ]);
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Orders" />
        <ManagerOrdersClient
          orders={orders}
          copywriters={copywriters}
          clients={clients}
          role={role}
        />
      </div>
    );
  }

  if (role === "client") {
    const orders = await getClientOrders(supabase, user.id);
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="My Orders" />
        <ClientOrdersClient orders={orders} role={role} />
      </div>
    );
  }

  if (role === "copywriter") {
    const orders = await getCopywriterOrders(supabase, user.id);
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Orders" />
        <CopywriterOrdersClient orders={orders} role={role} />
      </div>
    );
  }

  notFound();
}
