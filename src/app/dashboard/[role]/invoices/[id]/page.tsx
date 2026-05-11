import { notFound } from "next/navigation";

import { requireSession } from "@/lib/auth/get-session";
import { getInvoiceById } from "@/lib/data/invoices";
import { createClient } from "@/lib/supabase/server";
import { BackButton, PageHeader, StatusBadge } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

import { InvoiceDetailActions } from "./invoice-detail-actions";

interface Props {
  params: Promise<{ role: string; id: string }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { role, id } = await params;
  const { user } = await requireSession();

  if (role === "copywriter" || role === "sourcer") notFound();

  const supabase = await createClient();
  const invoice = await getInvoiceById(supabase, id, role, user.id);
  if (!invoice) notFound();

  const total = invoice.invoice_items.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallbackHref={`/dashboard/${role}/invoices`} />
          <PageHeader
            title={`Invoice — ${formatDate(invoice.billing_period_start)} – ${formatDate(invoice.billing_period_end)}`}
          />
        </div>
        <InvoiceDetailActions invoice={invoice} role={role} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={invoice.status} />
          </CardContent>
        </Card>

        {role !== "client" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {invoice.client.first_name} {invoice.client.last_name}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Billing Period
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {formatDate(invoice.billing_period_start)} —{" "}
            {formatDate(invoice.billing_period_end)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold">
            ${total.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Invoice Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.invoice_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.order.site?.domain ?? "—"}</TableCell>
                  <TableCell>
                    #{String(item.order.order_number).padStart(6, "0")}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(item.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {invoice.invoice_items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground py-6 text-center text-sm"
                  >
                    No items
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
