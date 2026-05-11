import React from "react";

import { pdf } from "@react-pdf/renderer";

import { getInvoiceById } from "@/lib/data/invoices";
import { InvoicePDFDocument } from "@/lib/pdf/invoice-pdf";
import { resolveRole } from "@/lib/resolve-role";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = resolveRole(user.user_metadata?.role);
  if (!role || role === "copywriter" || role === "sourcer") {
    return new Response("Forbidden", { status: 403 });
  }

  const invoice = await getInvoiceById(supabase, id, role, user.id);
  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const stream = await pdf(
    React.createElement(InvoicePDFDocument, { invoice }) as any
  ).toBuffer();
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return new Response(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
