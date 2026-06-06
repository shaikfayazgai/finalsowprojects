"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Mail,
  Phone,
  FileText,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import { mockInvoices } from "@/mocks/data/enterprise-billing";
import { mockProjects } from "@/mocks/data/enterprise-projects";
import { downloadPdf } from "@/lib/utils/file-download";

const statusConfig: Record<
  string,
  { variant: "beige" | "gold" | "forest" | "danger" | "brown"; label: string }
> = {
  draft: { variant: "beige", label: "Draft" },
  pending: { variant: "gold", label: "Pending" },
  paid: { variant: "forest", label: "Paid" },
  overdue: { variant: "danger", label: "Overdue" },
  cancelled: { variant: "brown", label: "Cancelled" },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getProjectTitle(projectId: string): string {
  return mockProjects.find((p) => p.id === projectId)?.title ?? projectId;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  const invoice =
    mockInvoices.find((inv) => inv.id === invoiceId) ?? mockInvoices[0];
  const config = statusConfig[invoice.status];

  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = 0;
  const total = subtotal + tax;
  const balanceDue = total - invoice.paidAmount;

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=960,height=800");
    if (!win) return;

    const client = mockProjects.find((p) => p.id === invoice.projectId)?.client ?? "Client";

    const lineItemRows = invoice.lineItems
      .map(
        (item) => `
        <tr>
          <td class="td">${item.description}</td>
          <td class="td center">${item.quantity}</td>
          <td class="td right mono">${formatCurrency(item.rate)}</td>
          <td class="td right mono bold">${formatCurrency(item.amount)}</td>
        </tr>`
      )
      .join("");

    const paidRow =
      invoice.paidAmount > 0
        ? `<div class="total-row green"><span>Amount Paid</span><span class="mono">-${formatCurrency(invoice.paidAmount)}</span></div>`
        : "";

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.number}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#1a1613;padding:40px}
    @page{margin:16mm}
    @media print{body{padding:0}}
    .wrap{max-width:760px;margin:0 auto}
    .header{background:linear-gradient(135deg,#3d2b1f,#5c3d2a);color:#fff;padding:28px 32px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:flex-start}
    .brand{font-size:18px;font-weight:700;letter-spacing:-.3px}
    .brand-sub{font-size:11px;color:rgba(255,255,255,.6);margin-top:3px}
    .inv-label{font-size:28px;font-weight:700;letter-spacing:1px;text-align:right}
    .inv-num{font-size:15px;font-family:monospace;font-weight:600;color:rgba(255,255,255,.85);text-align:right;margin-top:4px}
    .inv-dates{margin-top:8px;text-align:right;font-size:12px;color:rgba(255,255,255,.7);line-height:1.8}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #ede8e3;border-top:none}
    .meta-box{padding:20px 24px}
    .meta-box+.meta-box{border-left:1px solid #ede8e3}
    .meta-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9b8b7a;margin-bottom:6px}
    .meta-val{font-size:14px;font-weight:600;color:#1a1613}
    .meta-sub{font-size:12px;color:#9b8b7a;margin-top:3px;line-height:1.6}
    .status-badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#f0f9f6;color:#1a7a5e;border:1px solid #c6ebe0;margin-top:4px}
    table{width:100%;border-collapse:collapse;margin-top:0;border:1px solid #ede8e3;border-top:none}
    .th{background:#f7f4f0;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9b8b7a;border-bottom:1px solid #ede8e3}
    .td{padding:11px 14px;font-size:13px;color:#3d2b1f;border-bottom:1px solid #f5f1ec}
    .center{text-align:center}
    .right{text-align:right}
    .mono{font-family:monospace}
    .bold{font-weight:600}
    .totals{border:1px solid #ede8e3;border-top:none;padding:16px 24px;display:flex;justify-content:flex-end}
    .totals-inner{width:280px}
    .total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#7a6a5a;border-bottom:1px solid #f5f1ec}
    .total-row.green{color:#1a7a5e;font-weight:600}
    .total-row.grand{font-size:16px;font-weight:700;color:#1a1613;border:none;padding-top:10px}
    .notes{background:#f7f4f0;border:1px solid #ede8e3;border-top:none;padding:16px 24px;border-radius:0 0 12px 12px;font-size:12px;color:#9b8b7a;line-height:1.6}
    .footer{margin-top:32px;text-align:center;font-size:11px;color:#c0b0a0}
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div>
      <div class="brand">GlimmoraTeam</div>
      <div class="brand-sub">Powered by Baarez Technology Solutions</div>
      <div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,.65);line-height:1.8">
        Dubai Internet City, Tower B, Suite 4200<br>
        billing@glimmorateam.com &nbsp;|&nbsp; +971 4 XXX XXXX
      </div>
    </div>
    <div>
      <div class="inv-label">INVOICE</div>
      <div class="inv-num">${invoice.number}</div>
      <div class="inv-dates">
        Issued: ${formatDate(invoice.issuedDate)}<br>
        Due: ${formatDate(invoice.dueDate)}
      </div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <div class="meta-label">Bill To</div>
      <div class="meta-val">${client}</div>
      <div class="meta-sub">Accounts Payable Department<br>Mumbai, Maharashtra 400001, India</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Project</div>
      <div class="meta-val">${getProjectTitle(invoice.projectId)}</div>
      <div class="meta-sub">
        ${invoice.milestoneId ? `Milestone: ${invoice.milestoneId}<br>` : ""}
        Currency: ${invoice.currency}
        <br><span class="status-badge">${statusConfig[invoice.status].label}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="th" style="text-align:left">Description</th>
        <th class="th" style="text-align:center">Qty</th>
        <th class="th" style="text-align:right">Rate</th>
        <th class="th" style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${lineItemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-inner">
      <div class="total-row"><span>Subtotal</span><span class="mono">${formatCurrency(subtotal)}</span></div>
      <div class="total-row"><span>Tax (0%)</span><span class="mono">${formatCurrency(tax)}</span></div>
      ${paidRow}
      <div class="total-row grand"><span>Balance Due</span><span class="mono">${formatCurrency(Math.max(balanceDue, 0))}</span></div>
    </div>
  </div>

  <div class="notes">
    Payment is due within the terms specified above. Late payments may incur additional fees as per the service agreement.
    Please include the invoice number <strong>${invoice.number}</strong> as reference when making payment.
  </div>

  <div class="footer">GlimmoraTeam &nbsp;|&nbsp; Confidential &nbsp;|&nbsp; ${new Date().toISOString().split("T")[0]}</div>
</div>
<script>window.onload = function(){ window.focus(); window.print(); }<\/script>
</body>
</html>`);
    win.document.close();
  };

  const handleDownloadPdf = async () => {
    try {
      const client = mockProjects.find((p) => p.id === invoice.projectId)?.client ?? "Client";
      await downloadPdf(`invoice-${invoice.number}.pdf`, {
        title: `Invoice ${invoice.number}`,
        subtitle: `Status: ${statusConfig[invoice.status].label}`,
        meta: {
          "Issued By": "GlimmoraTeam  |  Dubai Internet City, Tower B, Suite 4200",
          "Bill To": `${client}  |  Accounts Payable Department, Mumbai, India`,
          "Project": getProjectTitle(invoice.projectId),
          "Issue Date": formatDate(invoice.issuedDate),
          "Due Date": formatDate(invoice.dueDate),
          "Currency": invoice.currency,
          ...(invoice.milestoneId ? { "Milestone": invoice.milestoneId } : {}),
        },
        table: {
          headers: ["Description", "Qty", "Rate (USD)", "Amount (USD)"],
          rows: invoice.lineItems.map((item) => [
            item.description,
            String(item.quantity),
            formatCurrency(item.rate),
            formatCurrency(item.amount),
          ]),
          colWeights: [3.5, 0.7, 1.4, 1.4],
        },
        summary: [
          { label: "Subtotal", value: formatCurrency(subtotal) },
          { label: "Tax (0%)", value: formatCurrency(tax) },
          { label: "Total", value: formatCurrency(total) },
          ...(invoice.paidAmount > 0 ? [{ label: "Amount Paid", value: `-${formatCurrency(invoice.paidAmount)}` }] : []),
          { label: "Balance Due", value: formatCurrency(Math.max(balanceDue, 0)) },
        ],
        footerNote:
          "Payment is due within the terms specified above. Late payments may incur additional fees as per the service agreement. Include the invoice number as payment reference.",
      });
      toast.success("Download Complete", `Invoice ${invoice.number} downloaded as PDF.`);
    } catch {
      toast.error("Download Failed", "Could not generate the PDF. Please try again.");
    }
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeUp} className="flex items-center gap-2 text-sm">
        <Link
          href="/enterprise/billing/invoices"
          className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Invoices
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-beige-400" />
        <span className="text-beige-500">{invoice.number}</span>
      </motion.div>

      {/* Actions bar */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-brown-900 tracking-tight font-heading">
            {invoice.number}
          </h1>
          <Badge variant={config.variant} size="md" dot>
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "pending" && (
            <Button variant="gradient-forest" size="sm" onClick={() => toast.success("Payment Recorded", `Invoice ${invoice.number} marked as paid.`)}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark as Paid
            </Button>
          )}
          {invoice.status === "overdue" && (
            <Button variant="gold" size="sm" onClick={() => toast.success("Reminder Sent", `Payment reminder sent for ${invoice.number}.`)}>
              <Send className="w-3.5 h-3.5" />
              Send Reminder
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Invoice Document */}
      <motion.div
        id="invoice-print-area"
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white backdrop-blur-sm shadow-sm overflow-hidden"
      >
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-brown-50 to-beige-50/50 p-6 sm:p-8 border-b border-beige-200/60">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-500 to-brown-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GT</span>
                </div>
                <div>
                  <p className="text-[15px] font-bold text-brown-900 tracking-tight">
                    GlimmoraTeam
                  </p>
                  <p className="text-[11px] text-beige-500">
                    Powered by Baarez Technology Solutions
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-[12px] text-beige-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  <span>Dubai Internet City, Tower B, Suite 4200</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  <span>billing@glimmorateam.com</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
                  <span>+971 4 XXX XXXX</span>
                </div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="text-right">
              <p className="text-[26px] font-bold text-brown-900 tracking-tight font-heading">
                INVOICE
              </p>
              <p className="text-[14px] font-mono text-brown-700 font-semibold mt-1">
                {invoice.number}
              </p>
              <div className="mt-3 space-y-1 text-[12px]">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-beige-500">Issued:</span>
                  <span className="font-medium text-brown-800">
                    {formatDate(invoice.issuedDate)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-beige-500">Due:</span>
                  <span
                    className={cn(
                      "font-medium",
                      invoice.status === "overdue"
                        ? "text-[var(--danger)]"
                        : "text-brown-800"
                    )}
                  >
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To / From */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 sm:p-8 border-b border-beige-100/60">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-beige-500 mb-2">
              Bill To
            </p>
            <p className="text-[14px] font-semibold text-brown-900">
              {mockProjects.find((p) => p.id === invoice.projectId)?.client ?? "Client"}
            </p>
            <div className="mt-1.5 space-y-0.5 text-[12px] text-beige-600">
              <p>Accounts Payable Department</p>
              <p>Mumbai, Maharashtra 400001</p>
              <p>India</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-beige-500 mb-2">
              Project
            </p>
            <p className="text-[14px] font-semibold text-brown-900">
              {getProjectTitle(invoice.projectId)}
            </p>
            <div className="mt-1.5 space-y-0.5 text-[12px] text-beige-600">
              {invoice.milestoneId && (
                <p>Milestone: {invoice.milestoneId}</p>
              )}
              <p>Currency: {invoice.currency}</p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="px-6 sm:px-8 py-6">
          <div className="rounded-xl overflow-hidden border border-beige-100/60">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-beige-50/60 text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            {/* Line Items */}
            {invoice.lineItems.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-t border-beige-100/60"
              >
                <div className="col-span-6">
                  <p className="text-[13px] text-brown-800">{item.description}</p>
                </div>
                <div className="col-span-2 text-center text-[13px] text-beige-600">
                  {item.quantity}
                </div>
                <div className="col-span-2 text-right text-[13px] text-beige-600 font-mono">
                  {formatCurrency(item.rate)}
                </div>
                <div className="col-span-2 text-right text-[13px] font-semibold text-brown-800 font-mono">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex items-center justify-between py-2 text-[13px]">
                <span className="text-beige-500">Subtotal</span>
                <span className="font-medium text-brown-800 font-mono">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-[13px] border-b border-beige-100/60">
                <span className="text-beige-500">Tax (0%)</span>
                <span className="font-medium text-beige-400 font-mono">
                  {formatCurrency(tax)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-[15px]">
                <span className="font-semibold text-brown-900">Total</span>
                <span className="font-bold text-brown-900 font-mono">
                  {formatCurrency(total)}
                </span>
              </div>

              {invoice.paidAmount > 0 && (
                <div className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-forest-600 font-medium">Amount Paid</span>
                  <span className="font-semibold text-forest-600 font-mono">
                    -{formatCurrency(invoice.paidAmount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-3 px-4 -mx-4 rounded-xl bg-gradient-to-r from-brown-50 to-gold-50/50 border border-brown-100/50">
                <span className="font-bold text-brown-900 text-[15px]">
                  Balance Due
                </span>
                <span
                  className={cn(
                    "font-bold text-[18px] font-mono tracking-tight",
                    balanceDue > 0 ? "text-brown-900" : "text-forest-600"
                  )}
                >
                  {formatCurrency(Math.max(balanceDue, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="px-6 sm:px-8 py-5 bg-beige-50/40 border-t border-beige-100/60">
          <div className="flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 text-beige-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-medium text-beige-500 mb-1">Notes</p>
              <p className="text-[12px] text-beige-600 leading-relaxed">
                Payment is due within the terms specified above. Late payments may incur
                additional fees as per the service agreement. Please include the invoice
                number as reference when making payment.
              </p>
            </div>
          </div>

          {invoice.status === "overdue" && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-[var(--danger-light)] border border-[var(--danger-light)]">
              <AlertTriangle className="w-4 h-4 text-[var(--danger)] shrink-0" />
              <p className="text-[12px] text-[var(--danger-hover)] font-medium">
                This invoice is past due. A reminder will be sent to the billing contact.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
