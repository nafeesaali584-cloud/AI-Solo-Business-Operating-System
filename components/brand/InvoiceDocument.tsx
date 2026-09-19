"use client";

import React from "react";
import { COLOR_TOKENS, ThemeMode } from "@/lib/brand/tokens";
import { BRAND } from "@/lib/brand/config";

export interface InvoiceDocumentProps {
  mode?: ThemeMode;
  clientName?: string;
  clientAddress?: string;
  clientPhone?: string;
  invoiceNumber?: string;
  relatedProposalNumber?: string;
  issueDate?: string;
  dueDate?: string;
  status?: string; // "Awaiting payment" | "Paid" | "Draft" | "Overdue"
  lineItems?: Array<{
    description: string;
    subDescription?: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal?: number;
  depositPaid?: number;
  amountDue?: number;
  currency?: string;
  bankDetails?: string;
  referenceNumber?: string;
}

export function InvoiceDocument({
  mode = "dark",
  clientName = "Miss Al Reem Beauty Centre",
  clientAddress = "Ajman, UAE",
  clientPhone = "+971 50 xxx xxxx",
  invoiceNumber = "#INV-0118",
  relatedProposalNumber = "#PRP-0042",
  issueDate = "18 Sep 2026",
  dueDate = "25 Sep 2026",
  status = "Awaiting payment",
  lineItems = [
    {
      description: "Website redesign",
      subDescription: "5-page responsive site, mobile-first",
      quantity: 1,
      unit_price: 2800,
      total: 2800,
    },
    {
      description: "WhatsApp booking automation",
      subDescription: "Setup & configuration",
      quantity: 1,
      unit_price: 1400,
      total: 1400,
    },
    {
      description: "Local SEO setup",
      subDescription: "Google Business + on-page SEO",
      quantity: 1,
      unit_price: 900,
      total: 900,
    },
  ],
  subtotal,
  depositPaid = 2550,
  amountDue,
  currency = "AED",
  bankDetails = "Bank transfer — Emirates NBD · IBAN: AE00 0000 0000 0000 0000 000",
  referenceNumber,
}: InvoiceDocumentProps) {
  const t = COLOR_TOKENS[mode];
  const calculatedSubtotal = subtotal ?? lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const calculatedDue = amountDue ?? (calculatedSubtotal - (depositPaid || 0));
  const activeRef = referenceNumber || invoiceNumber.replace("#", "");

  return (
    <div
      className="w-full max-w-[840px] mx-auto rounded-[16px] transition-colors duration-300 font-sans shadow-2xl"
      style={{
        backgroundColor: t.bg,
        borderColor: t.border,
        borderWidth: "1px",
        borderStyle: "solid",
        color: t.textPrimary,
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      <div className="p-6 sm:p-10 md:p-[56px] space-y-8">
        {/* 1. Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          {/* Left: Avatar + Name + Tag */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND.profileImage}
                alt={BRAND.ownerName}
                className="w-10 h-10 rounded-full object-cover shadow-sm"
                style={{
                  border: `2px solid ${t.accent}`,
                }}
              />
            </div>
            <div>
              <h2
                className="text-[15px] font-bold tracking-tight leading-snug"
                style={{
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                  color: t.textPrimary,
                }}
              >
                {BRAND.ownerName}
              </h2>
              <p
                className="text-[10px] tracking-[0.18em] uppercase font-medium mt-0.5"
                style={{ color: t.textExtraMuted }}
              >
                AI · WEB · AUTOMATION
              </p>
            </div>
          </div>

          {/* Right: Contact meta */}
          <div className="text-left sm:text-right text-xs space-y-0.5">
            <p style={{ color: t.textMuted }}>nafeesaali.com</p>
            <p style={{ color: t.textExtraMuted }}>Ajman, UAE</p>
          </div>
        </div>

        {/* 2. Title Row + Status Badge */}
        <div className="flex items-center justify-between pt-1">
          <h1
            className="text-3xl sm:text-[2rem] font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              color: t.textPrimary,
            }}
          >
            Invoice
          </h1>
          <span
            className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide"
            style={{
              backgroundColor: t.accentSoftBg,
              borderColor: t.accentBorder,
              borderWidth: "1px",
              borderStyle: "solid",
              color: t.accent,
            }}
          >
            {status}
          </span>
        </div>

        {/* 3. Two-Column Metadata Row (Billed to & Invoice Meta) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
          {/* Left: Billed to */}
          <div className="space-y-1">
            <span
              className="text-[10px] font-bold tracking-[0.14em] uppercase"
              style={{ color: t.textExtraMuted }}
            >
              BILLED TO
            </span>
            <div
              className="text-sm font-bold pt-0.5"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              {clientName}
            </div>
            {clientAddress && (
              <p className="text-xs" style={{ color: t.textMuted }}>
                {clientAddress}
              </p>
            )}
            {clientPhone && (
              <p className="text-xs" style={{ color: t.textMuted }}>
                {clientPhone}
              </p>
            )}
          </div>

          {/* Right: Invoice Info */}
          <div className="sm:text-right space-y-1">
            <span
              className="text-[10px] font-bold tracking-[0.14em] uppercase"
              style={{ color: t.textExtraMuted }}
            >
              INVOICE
            </span>
            <div
              className="text-sm font-bold pt-0.5"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              {invoiceNumber}
            </div>
            {relatedProposalNumber && (
              <p className="text-xs" style={{ color: t.textMuted }}>
                Related to Proposal {relatedProposalNumber}
              </p>
            )}
          </div>
        </div>

        {/* 4. Dates Row (Issued & Due) */}
        <div className="flex items-center gap-12 pt-1">
          <div className="space-y-0.5">
            <span
              className="text-[10px] font-bold tracking-[0.14em] uppercase block"
              style={{ color: t.textExtraMuted }}
            >
              ISSUED
            </span>
            <span
              className="text-sm font-bold"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              {issueDate}
            </span>
          </div>

          <div className="space-y-0.5">
            <span
              className="text-[10px] font-bold tracking-[0.14em] uppercase block"
              style={{ color: t.textExtraMuted }}
            >
              DUE
            </span>
            <span
              className="text-sm font-bold"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              {dueDate}
            </span>
          </div>
        </div>

        {/* 5. Line Items Table */}
        <div className="pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                style={{
                  borderBottomColor: t.border,
                  borderBottomWidth: "1px",
                  borderBottomStyle: "solid",
                  color: t.textExtraMuted,
                }}
              >
                <tr>
                  <th className="pb-2.5 font-medium text-[11px]">Item</th>
                  <th className="pb-2.5 font-medium text-[11px] text-center w-16">Qty</th>
                  <th className="pb-2.5 font-medium text-[11px] text-right w-28">Rate</th>
                  <th className="pb-2.5 font-medium text-[11px] text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: t.border }}>
                {lineItems.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottomColor: t.border,
                      borderBottomWidth: "1px",
                      borderBottomStyle: "solid",
                    }}
                  >
                    <td className="py-4 pr-4">
                      <div className="font-bold text-[13px]" style={{ color: t.textPrimary }}>
                        {item.description}
                      </div>
                      {item.subDescription && (
                        <div className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>
                          {item.subDescription}
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-center font-medium" style={{ color: t.textSecondaryBody }}>
                      {item.quantity}
                    </td>
                    <td className="py-4 text-right font-medium" style={{ color: t.textSecondaryBody }}>
                      {currency} {Number(item.unit_price).toLocaleString()}
                    </td>
                    <td className="py-4 text-right font-semibold" style={{ color: t.textPrimary }}>
                      {currency} {Number(item.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Totals Block (Right-Aligned) */}
        <div className="flex flex-col items-end pt-2">
          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex items-center justify-between" style={{ color: t.textMuted }}>
              <span>Subtotal</span>
              <span className="font-medium" style={{ color: t.textPrimary }}>
                {currency} {calculatedSubtotal.toLocaleString()}
              </span>
            </div>

            {depositPaid > 0 && (
              <div className="flex items-center justify-between" style={{ color: t.textMuted }}>
                <span>Deposit paid</span>
                <span className="font-medium" style={{ color: t.textPrimary }}>
                  – {currency} {depositPaid.toLocaleString()}
                </span>
              </div>
            )}

            <div
              className="pt-2.5 flex items-baseline justify-between"
              style={{
                borderTopColor: t.border,
                borderTopWidth: "1px",
                borderTopStyle: "solid",
              }}
            >
              <span className="text-xs font-medium" style={{ color: t.textMuted }}>
                Amount due
              </span>
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                  color: t.accent,
                }}
              >
                {currency} {calculatedDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 7. Payment Details Box */}
        <div
          className="rounded-xl p-4.5 space-y-1.5"
          style={{
            backgroundColor: t.cardBg,
            borderColor: t.border,
            borderWidth: "1px",
            borderStyle: "solid",
          }}
        >
          <span
            className="text-[10px] font-bold tracking-[0.14em] uppercase block"
            style={{ color: t.textExtraMuted }}
          >
            PAYMENT DETAILS
          </span>
          <p className="text-xs leading-relaxed" style={{ color: t.textBody }}>
            {bankDetails}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: t.textMuted }}>
            Reference: <span style={{ color: t.textPrimary }}>{activeRef}</span>
          </p>
        </div>

        {/* 8. Footer */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]"
          style={{
            borderTopColor: t.border,
            borderTopWidth: "1px",
            borderTopStyle: "solid",
            color: t.textMuted,
          }}
        >
          <div className="flex items-center gap-4">
            <a
              href={BRAND.contact.website}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              style={{ color: t.textMuted }}
            >
              nafeesaali.com
            </a>
            <a
              href={BRAND.contact.linkedin}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              style={{ color: t.textMuted }}
            >
              Connect on LinkedIn
            </a>
          </div>
          <div style={{ color: t.textExtraMuted }}>
            Thank you for your business.
          </div>
        </div>
      </div>
    </div>
  );
}
