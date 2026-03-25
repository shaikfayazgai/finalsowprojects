"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge, Button } from "@/components/ui";

/* ── Mock subscription data ── */
const subscription = {
  plan: "Enterprise",
  status: "Active",
  billingCycle: "Annual",
  nextBillingDate: "2027-01-15",
  seats: { used: 34, total: 50 },
  monthlyRate: "$2,400",
  annualTotal: "$28,800",
};

const paymentMethod = {
  type: "Visa",
  last4: "4242",
  expiry: "09/2028",
  name: "TechVista Solutions Pvt Ltd",
};

const invoiceHistory = [
  { id: "INV-2026-003", date: "2026-03-01", amount: "$2,400.00", status: "Paid" },
  { id: "INV-2026-002", date: "2026-02-01", amount: "$2,400.00", status: "Paid" },
  { id: "INV-2026-001", date: "2026-01-01", amount: "$2,400.00", status: "Paid" },
  { id: "INV-2025-012", date: "2025-12-01", amount: "$2,400.00", status: "Paid" },
  { id: "INV-2025-011", date: "2025-11-01", amount: "$2,400.00", status: "Paid" },
];

export default function BillingSubscriptionPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <Link
            href="/enterprise/admin/config"
            className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Settings
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              Billing & Subscription
            </h1>
          </div>
          <p className="text-[13px] text-beige-500 mt-1">
            Manage your subscription plan, payment method, and billing details.
          </p>
        </div>
        <Button
          variant="gradient-primary"
          size="sm"
          onClick={() => toast.info("Upgrade", "Please contact sales for plan changes.")}
        >
          <Zap className="w-3.5 h-3.5" />
          Upgrade Plan
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-gold-700" />
            </div>
            <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">Plan</span>
          </div>
          <p className="text-[20px] font-bold text-brown-900">{subscription.plan}</p>
          <p className="text-[10px] text-beige-500">{subscription.billingCycle} billing</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-forest-600" />
            </div>
            <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">Status</span>
          </div>
          <p className="text-[20px] font-bold text-brown-900">{subscription.status}</p>
          <p className="text-[10px] text-beige-500">All features enabled</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brown-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-brown-600" />
            </div>
            <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">Seats</span>
          </div>
          <p className="text-[20px] font-bold text-brown-900">
            {subscription.seats.used}/{subscription.seats.total}
          </p>
          <p className="text-[10px] text-beige-500">seats used</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-[10px] font-bold text-beige-500 uppercase tracking-wider">Next Billing</span>
          </div>
          <p className="text-[20px] font-bold text-brown-900">Jan 15</p>
          <p className="text-[10px] text-beige-500">2027</p>
        </div>
      </motion.div>

      {/* Payment Method & Plan Details */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Method */}
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-brown-900">Payment Method</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Update", "Payment method update form coming soon.")}
            >
              Update
            </Button>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-beige-50/80 border border-beige-100">
            <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-brown-900">
                {paymentMethod.type} ending in {paymentMethod.last4}
              </p>
              <p className="text-[11px] text-beige-500 mt-0.5">
                Expires {paymentMethod.expiry} &middot; {paymentMethod.name}
              </p>
            </div>
            <Badge variant="forest" size="sm" dot>
              Default
            </Badge>
          </div>
        </div>

        {/* Plan Details */}
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-brown-900">Plan Details</h2>
            <Badge variant="gold" size="sm">
              {subscription.plan}
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-beige-100">
              <span className="text-[12px] text-beige-600">Monthly Rate</span>
              <span className="text-[13px] font-semibold text-brown-900">{subscription.monthlyRate}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-beige-100">
              <span className="text-[12px] text-beige-600">Annual Total</span>
              <span className="text-[13px] font-semibold text-brown-900">{subscription.annualTotal}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-beige-100">
              <span className="text-[12px] text-beige-600">Billing Cycle</span>
              <span className="text-[13px] font-semibold text-brown-900">{subscription.billingCycle}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[12px] text-beige-600">Seat Allocation</span>
              <span className="text-[13px] font-semibold text-brown-900">
                {subscription.seats.total} seats
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-beige-100 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-brown-900">Recent Invoices</h2>
          <Link
            href="/enterprise/billing/history"
            className="text-[11px] text-brown-500 hover:text-brown-700 transition-colors flex items-center gap-1"
          >
            View all
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-beige-100">
          {invoiceHistory.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center gap-4 px-5 py-3.5"
            >
              <div className="w-8 h-8 rounded-lg bg-beige-50 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-beige-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-brown-900">{invoice.id}</p>
                <p className="text-[11px] text-beige-500 mt-0.5">{invoice.date}</p>
              </div>
              <span className="text-[13px] font-semibold text-brown-900">{invoice.amount}</span>
              <Badge variant="forest" size="sm" dot>
                {invoice.status}
              </Badge>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl bg-gradient-to-r from-gold-50 to-beige-50 border border-gold-100/60 p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-gold-900 mb-1">
              Billing Support
            </h3>
            <p className="text-[12px] text-gold-800 leading-relaxed">
              For plan changes, custom seat allocations, or enterprise pricing adjustments,
              please contact your account manager or reach out to billing support.
              Invoices are generated on the 1st of each month and available for download in Payment History.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
