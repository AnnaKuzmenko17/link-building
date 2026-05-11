import type {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Order,
  Site,
  User,
} from "@/types";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

export type InvoiceListRow = Invoice & {
  client: Pick<User, "id" | "first_name" | "last_name" | "email">;
  invoice_items: Pick<InvoiceItem, "amount">[];
};

export type InvoiceWithItems = Invoice & {
  client: Pick<User, "id" | "first_name" | "last_name" | "email">;
  invoice_items: Array<
    InvoiceItem & {
      order: Pick<Order, "id" | "order_number"> & {
        site: Pick<Site, "domain">;
      };
    }
  >;
};

export async function getInvoices(
  supabase: Client,
  opts: { viewerRole: string; viewerId?: string }
): Promise<InvoiceListRow[]> {
  let query = supabase
    .from("invoices")
    .select(
      "*, client:users!client_id(id, first_name, last_name, email), invoice_items(amount)"
    )
    .order("created_at", { ascending: false });

  if (opts.viewerRole === "client") {
    if (!opts.viewerId) return [];
    query = query.eq("client_id", opts.viewerId).in("status", ["sent", "paid"]);
  }

  const { data } = await query;
  return (data ?? []) as unknown as InvoiceListRow[];
}

export async function getInvoiceById(
  supabase: Client,
  id: string,
  viewerRole: string,
  viewerId: string
): Promise<InvoiceWithItems | null> {
  let query = supabase
    .from("invoices")
    .select(
      "*, client:users!client_id(id, first_name, last_name, email), invoice_items(*, order:orders!order_id(id, order_number, site:sites!site_id(domain)))"
    )
    .eq("id", id);

  if (viewerRole === "client") {
    query = query.eq("client_id", viewerId).in("status", ["sent", "paid"]);
  }

  const { data } = await query.maybeSingle();
  return data as unknown as InvoiceWithItems | null;
}

export async function updateInvoiceFields(
  supabase: Client,
  id: string,
  fields: { billing_period_start: string; billing_period_end: string }
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from("invoices").update(fields).eq("id", id);
  return { error: error ?? null };
}

export async function updateInvoiceItemAmount(
  supabase: Client,
  itemId: string,
  amount: number
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("invoice_items")
    .update({ amount })
    .eq("id", itemId);
  return { error: error ?? null };
}

export async function setInvoiceStatus(
  supabase: Client,
  id: string,
  status: InvoiceStatus
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id);
  return { error: error ?? null };
}

export async function getPublishedOrdersNotInvoiced(
  supabase: Client
): Promise<Array<{ id: string; client_id: string; created_at: string }>> {
  const { data } = await supabase
    .from("orders")
    .select("id, client_id, created_at, invoice_items!left(id)")
    .eq("status", "published")
    .is("invoice_items.id", null);
  return (data ?? []) as unknown as Array<{
    id: string;
    client_id: string;
    created_at: string;
  }>;
}

export async function createInvoiceWithItems(
  supabase: Client,
  payload: {
    client_id: string;
    billing_period_start: string;
    billing_period_end: string;
    items: Array<{ order_id: string; amount: number }>;
  }
): Promise<{ invoiceId: string | null; error: PostgrestError | null }> {
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      client_id: payload.client_id,
      billing_period_start: payload.billing_period_start,
      billing_period_end: payload.billing_period_end,
      status: "draft",
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) return { invoiceId: null, error: invoiceError };

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(payload.items.map((item) => ({ invoice_id: invoice.id, ...item })));

  return { invoiceId: invoice.id, error: itemsError ?? null };
}
