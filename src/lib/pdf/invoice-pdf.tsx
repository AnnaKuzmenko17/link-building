import React from "react";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { InvoiceWithItems } from "@/lib/data/invoices";
import { formatDateLong } from "@/lib/format-date";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#111",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 9,
    color: "#666",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
    gap: 32,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 12,
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colSite: { flex: 3 },
  colOrder: { flex: 2 },
  colAmount: { flex: 1, textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#f9fafb",
  },
});


interface Props {
  invoice: InvoiceWithItems;
}

export function InvoicePDFDocument({ invoice }: Props) {
  const total = invoice.invoice_items.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.subtitle}>
          {formatDateLong(invoice.billing_period_start)} —{" "}
          {formatDateLong(invoice.billing_period_end)}
        </Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Client</Text>
              <Text style={styles.value}>
                {invoice.client.first_name} {invoice.client.last_name}
              </Text>
              <Text style={[styles.value, { color: "#666" }]}>
                {invoice.client.email}
              </Text>
            </View>
            <View>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.value, styles.bold]}>
                {invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={[styles.colSite, styles.bold]}>Site</Text>
          <Text style={[styles.colOrder, styles.bold]}>Order ID</Text>
          <Text style={[styles.colAmount, styles.bold]}>Amount</Text>
        </View>

        {invoice.invoice_items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colSite}>{item.order.site.domain}</Text>
            <Text style={styles.colOrder}>
              #{String(item.order.order_number).padStart(6, "0")}
            </Text>
            <Text style={styles.colAmount}>
              ${Number(item.amount).toFixed(2)}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={[styles.colSite, styles.bold]}>Total</Text>
          <Text style={styles.colOrder} />
          <Text style={[styles.colAmount, styles.bold]}>
            ${total.toFixed(2)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
