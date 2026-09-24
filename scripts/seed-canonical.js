const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync(".env", "utf-8");
envContent.split("\n").forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith("#")) {
    const idx = t.indexOf("=");
    if (idx !== -1) {
      process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  }
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding canonical Miss Al Reem Beauty Centre & INV-2026-0001...");

  // 1. Client
  let client = await prisma.client.findFirst({
    where: { business_name: { contains: "Miss Al Reem", mode: "insensitive" } },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        business_name: "Miss Al Reem Beauty Centre",
        primary_contact: "Fatima Al Reem",
        email: "contact@missalreem.ae",
        phone: "+971 50 123 4567",
        stage: "Invoice",
        payment_status: "Pending",
      },
    });
    console.log("Created Client:", client.id, client.business_name);
  } else {
    console.log("Found existing Client:", client.id, client.business_name);
  }

  // 2. Proposal
  let proposal = await prisma.proposal.findFirst({
    where: { client_id: client.id },
  });

  if (!proposal) {
    proposal = await prisma.proposal.create({
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
        scope:
          "Prepared for Miss Al Reem Beauty Centre — a redesigned booking site with WhatsApp automation, built to turn visitors into confirmed appointments.",
        deliverables:
          "5-page responsive website, WhatsApp instant lead capture workflow, Google Business optimization.",
        timeline: "Estimated delivery: 3 weeks from initial kickoff.",
        terms: "50% upfront deposit upon invoice receipt, 50% upon final delivery.",
        total_investment: 2300,
        status: "Accepted",
        approved_at: new Date(),
        sent_confirmed_at: new Date(),
      },
    });
    console.log("Created Proposal:", proposal.id);
  } else {
    console.log("Found existing Proposal:", proposal.id);
  }

  // 3. Invoice INV-2026-0001
  let invoice = await prisma.invoice.findUnique({
    where: { invoice_number: "INV-2026-0001" },
  });

  if (!invoice) {
    invoice = await prisma.invoice.create({
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
    console.log("Created Invoice:", invoice.id, invoice.invoice_number);
  } else {
    console.log("Found existing Invoice:", invoice.id, invoice.invoice_number, "status:", invoice.status);
  }

  console.log("Canonical seed complete!");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
