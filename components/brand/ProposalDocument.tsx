"use client";

import React from "react";
import { COLOR_TOKENS, ThemeMode } from "@/lib/brand/tokens";
import { BRAND } from "@/lib/brand/config";

export interface ProposalDocumentProps {
  mode?: ThemeMode;
  clientName?: string;
  proposalNumber?: string;
  date?: string;
  validUntil?: string;
  headline?: string;
  subtitle?: string;
  whatWeFound?: string;
  findingTags?: string[];
  services?: Array<{ name: string; description: string; price: number }>;
  timelineSteps?: Array<{ step: number; title: string; desc: string }>;
  terms?: string[];
  totalInvestment?: number;
  currency?: string;
  onAccept?: () => void;
  onWhatsApp?: () => void;
}

export function ProposalDocument({
  mode = "dark",
  clientName = "Miss Al Reem Beauty Centre",
  proposalNumber = "#PRP-0042",
  date = "18 September 2026",
  validUntil = "2 October 2026",
  headline = "A website that works while you sleep.",
  subtitle = "Prepared for Miss Al Reem Beauty Centre — a redesigned booking site with WhatsApp automation, built to turn visitors into confirmed appointments.",
  whatWeFound = "Your current site has no online booking and no way to capture a visitor before they leave. Most inquiries currently come through Instagram DMs, which are easy to miss during busy salon hours.",
  findingTags = ["No booking system", "Mobile load: 6.2s", "Instagram-only contact"],
  services = [
    {
      name: "Website redesign",
      description: "5-page responsive site — Home, Services, Gallery, Reviews, Contact — built for mobile-first browsing.",
      price: 2800,
    },
    {
      name: "WhatsApp booking automation",
      description: "Every enquiry is captured, qualified and handed to you on WhatsApp within minutes — no missed messages.",
      price: 1400,
    },
    {
      name: "Local SEO setup",
      description: 'Google Business optimization and on-page SEO so you rank for "salon near me" searches in Ajman.',
      price: 900,
    },
  ],
  timelineSteps = [
    { step: 1, title: "Discovery", desc: "Days 1–2 — content & brand collection" },
    { step: 2, title: "Design", desc: "Days 3–6 — layout & visual direction" },
    { step: 3, title: "Build", desc: "Days 7–11 — development & automation" },
    { step: 4, title: "Launch", desc: "Day 12 — go live & handover" },
  ],
  terms = [
    "50% deposit to begin, 50% due on launch.",
    "Two rounds of design revisions included.",
    "Optional footer design credit — confirmed separately during onboarding, never assumed.",
  ],
  totalInvestment,
  currency = "AED",
  onAccept,
  onWhatsApp,
}: ProposalDocumentProps) {
  const t = COLOR_TOKENS[mode];
  const calculatedTotal = totalInvestment ?? services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

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
      <div className="p-6 sm:p-10 md:p-[56px] space-y-9">
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

          {/* Right: Proposal Meta */}
          <div className="text-left sm:text-right text-xs space-y-0.5">
            <p style={{ color: t.textMuted }}>
              Proposal{" "}
              <span className="font-bold" style={{ color: t.textPrimary }}>
                {proposalNumber}
              </span>
            </p>
            <p style={{ color: t.textMuted }}>{date}</p>
            <p style={{ color: t.textExtraMuted }}>Valid until {validUntil}</p>
          </div>
        </div>

        {/* 2. Large Headline & Subtitle */}
        <div className="space-y-3">
          <h1
            className="text-3xl sm:text-4xl md:text-[2.4rem] font-bold tracking-tight leading-[1.15]"
            style={{
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              color: t.textPrimary,
            }}
          >
            {headline}
          </h1>
          <p
            className="text-sm sm:text-[15px] leading-relaxed"
            style={{ color: t.textMuted }}
          >
            Prepared for{" "}
            <strong style={{ color: t.textPrimary }}>{clientName}</strong> — a
            redesigned booking site with WhatsApp automation, built to turn
            visitors into confirmed appointments.
          </p>
        </div>

        {/* 3. Section: What we found */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="w-[3px] h-[18px] rounded-full inline-block"
              style={{ backgroundColor: t.accent }}
            />
            <h3
              className="text-[15px] font-bold"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              What we found
            </h3>
          </div>
          <p
            className="text-xs sm:text-[13px] leading-relaxed pl-3"
            style={{ color: t.textBody }}
          >
            {whatWeFound}
          </p>
          <div className="flex flex-wrap gap-2 pl-3 pt-1">
            {findingTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: t.cardBg,
                  borderColor: t.border,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  color: t.textMuted,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 4. Section: Scope of work */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="w-[3px] h-[18px] rounded-full inline-block"
              style={{ backgroundColor: t.accent }}
            />
            <h3
              className="text-[15px] font-bold"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              Scope of work
            </h3>
          </div>

          <div className="space-y-0 pl-3">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                style={{
                  borderBottomColor: t.border,
                  borderBottomWidth: idx === services.length - 1 ? "0px" : "1px",
                  borderBottomStyle: "solid",
                }}
              >
                <div className="space-y-1 max-w-xl">
                  <h4 className="text-[13px] font-bold" style={{ color: t.textPrimary }}>
                    {service.name}
                  </h4>
                  <p className="text-[12px] leading-relaxed" style={{ color: t.textMuted }}>
                    {service.description}
                  </p>
                </div>
                <div
                  className="text-right sm:text-right text-[13px] font-bold whitespace-nowrap pt-0.5"
                  style={{
                    fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                    color: t.textPrimary,
                  }}
                >
                  {currency} {Number(service.price).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Section: Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="w-[3px] h-[18px] rounded-full inline-block"
              style={{ backgroundColor: t.accent }}
            />
            <h3
              className="text-[15px] font-bold"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              Timeline
            </h3>
          </div>

          {/* Stepper with connecting line */}
          <div className="pl-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
              {timelineSteps.map((step) => (
                <div key={step.step} className="space-y-2 relative">
                  {/* Step circle */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: t.accentSoftBg,
                        border: `1.5px solid ${t.accent}`,
                        color: t.accent,
                        fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                      }}
                    >
                      {step.step}
                    </div>
                    <div
                      className="h-[1.5px] flex-1 hidden md:block"
                      style={{
                        backgroundColor: step.step === 4 ? "transparent" : t.border,
                      }}
                    />
                  </div>

                  {/* Step title & description */}
                  <div className="space-y-0.5 pr-2">
                    <h5
                      className="text-[12px] font-bold leading-tight"
                      style={{ color: t.textPrimary }}
                    >
                      {step.title}
                    </h5>
                    <p
                      className="text-[11px] leading-snug"
                      style={{ color: t.textMuted }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Section: Investment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="w-[3px] h-[18px] rounded-full inline-block"
              style={{ backgroundColor: t.accent }}
            />
            <h3
              className="text-[15px] font-bold"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              Investment
            </h3>
          </div>

          <div
            className="rounded-xl p-5 space-y-3"
            style={{
              backgroundColor: t.cardBg,
              borderColor: t.border,
              borderWidth: "1px",
              borderStyle: "solid",
            }}
          >
            {/* Items list */}
            <div className="space-y-2 text-xs">
              {services.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between" style={{ color: t.textBody }}>
                  <span>{s.name}</span>
                  <span className="font-semibold" style={{ color: t.textPrimary }}>
                    {currency} {Number(s.price).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Row */}
            <div
              className="pt-3 flex items-baseline justify-between"
              style={{
                borderTopColor: t.border,
                borderTopWidth: "1px",
                borderTopStyle: "solid",
              }}
            >
              <span className="text-xs" style={{ color: t.textMuted }}>
                Total investment
              </span>
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                  color: t.accent,
                }}
              >
                {currency} {calculatedTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 7. Section: Terms */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="w-[3px] h-[18px] rounded-full inline-block"
              style={{ backgroundColor: t.accent }}
            />
            <h3
              className="text-[15px] font-bold"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              Terms
            </h3>
          </div>

          <ul className="space-y-1.5 pl-5 list-disc text-xs" style={{ color: t.textBody }}>
            {terms.map((term, idx) => (
              <li key={idx} className="leading-relaxed">
                {term}
              </li>
            ))}
          </ul>
        </div>

        {/* 8. Signed by block */}
        <div
          className="pt-6 flex items-center gap-3.5"
          style={{
            borderTopColor: t.border,
            borderTopWidth: "1px",
            borderTopStyle: "solid",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND.profileImage}
            alt={BRAND.ownerName}
            className="w-[52px] h-[52px] rounded-full object-cover"
            style={{
              border: `2px solid ${t.accent}`,
            }}
          />
          <div>
            <h4
              className="text-sm font-bold leading-tight"
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                color: t.textPrimary,
              }}
            >
              {BRAND.ownerName}
            </h4>
            <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>
              Founder — AI, Web &amp; Automation
            </p>
          </div>
        </div>

        {/* 9. Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onAccept}
            className="px-6 py-2.5 rounded-full text-xs font-semibold text-white transition-all shadow-md active:scale-95"
            style={{
              backgroundColor: t.accent,
            }}
          >
            Accept this proposal →
          </button>
          <a
            href={BRAND.contact.whatsapp}
            target="_blank"
            rel="noreferrer"
            onClick={onWhatsApp}
            className="px-6 py-2.5 rounded-full text-xs font-medium transition-all active:scale-95 inline-flex items-center gap-1.5"
            style={{
              borderColor: t.border,
              borderWidth: "1px",
              borderStyle: "solid",
              color: t.textPrimary,
              backgroundColor: "transparent",
            }}
          >
            Ask a question on WhatsApp
          </a>
        </div>

        {/* 10. Footer */}
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
            {BRAND.ownerName} · AI, Web &amp; Automation
          </div>
        </div>
      </div>
    </div>
  );
}
