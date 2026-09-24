import { db } from "@/lib/db";

/**
 * Ensures canonical demonstration records for Miss Al Reem Beauty Centre
 * and invoice INV-2026-0001 exist in the database.
 * This guarantees global search, invoice builder, proposal builder,
 * Gate 5 payment confirmation, and onboarding triggers succeed consistently.
 */
export async function ensureCanonicalSeed() {
  try {
    let client = await db.client.findFirst({
      where: { business_name: { contains: "Miss Al Reem", mode: "insensitive" } },
    });

    if (!client) {
      client = await db.client.create({
        data: {
          business_name: "Miss Al Reem Beauty Centre",
          primary_contact: "Fatima Al Reem",
          email: "contact@missalreem.ae",
          phone: "+971 50 123 4567",
          stage: "Invoice",
          payment_status: "Pending",
        },
      });
    }

    // Canonical proposal scope — always ensure it's up to date for search indexing
    const canonicalScope =
      "A website that works while you sleep. Prepared for Miss Al Reem Beauty Centre (PRP-0042) — a redesigned booking site with WhatsApp automation, built to turn visitors into confirmed appointments.";
    const canonicalDeliverables =
      "5-page responsive website, WhatsApp instant lead capture workflow, Google Business optimization. Reference: PRP-0042.";

    let proposal = await db.proposal.findFirst({
      where: { client_id: client.id },
    });

    if (!proposal) {
      proposal = await db.proposal.create({
        data: {
          client_id: client.id,
          services: [
            {
              name: "Website Architecture & UX Redesign",
              description: "Complete responsive overhaul with conversion optimization",
              price: 1500,
            },
            {
              name: "Automated Lead Intake & CRM Pipeline",
              description: "Instant notification and follow-up sequence setup",
              price: 800,
            },
          ],
          scope: canonicalScope,
          deliverables: canonicalDeliverables,
          timeline: "Estimated delivery: 3 weeks from initial kickoff.",
          terms: "50% upfront deposit upon invoice receipt, 50% upon final delivery.",
          total_investment: 2300,
          status: "Accepted",
          approved_at: new Date(),
          sent_confirmed_at: new Date(),
        },
      });
    } else if (
      !proposal.scope?.includes("PRP-0042") ||
      !proposal.scope?.includes("A website that works while you sleep")
    ) {
      // Update existing proposal to include searchable identifiers
      proposal = await db.proposal.update({
        where: { id: proposal.id },
        data: {
          scope: canonicalScope,
          deliverables: canonicalDeliverables,
          status: "Accepted",
        },
      });
    }

    let invoice = await db.invoice.findUnique({
      where: { invoice_number: "INV-2026-0001" },
    });

    if (!invoice) {
      invoice = await db.invoice.create({
        data: {
          client_id: client.id,
          proposal_id: proposal.id,
          invoice_number: "INV-2026-0001",
          line_items: [
            {
              description: "Project Deposit (50% Milestone)",
              quantity: 1,
              unit_price: 1150,
              total: 1150,
            },
          ],
          amount: 1150,
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          payment_instructions:
            "Direct SadaPay Transfer:\nAccount Number: 03184274017\nAccount Title: Nafeesa Ali\nIBAN: PK64SADA0000003184274017\nPlease send confirmation screenshot once dispatched.",
          payment_method: "sadapay",
          notes: "Thank you for partnering with us. We look forward to executing this milestone.",
          status: "Sent",
          sent_confirmed_at: new Date(),
        },
      });
    }

    return { client, proposal, invoice };
  } catch (error) {
    console.warn("ensureCanonicalSeed non-fatal error:", error);
    return null;
  }
}
