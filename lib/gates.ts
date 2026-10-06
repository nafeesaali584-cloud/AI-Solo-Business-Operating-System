import { db } from "./db";

export class InvalidStateTransitionError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = "InvalidStateTransitionError";
    this.statusCode = 409;
  }
}

/**
 * DEFAULT ONBOARDING CHECKLIST ITEMS
 * Auto-generated exclusively when Gate 5 (Invoice Payment Confirmation) is passed.
 */
export const DEFAULT_ONBOARDING_CHECKLIST = [
  { id: "1", item: "Client brief & requirements document", status: "pending" },
  { id: "2", item: "Access credentials required (Logins/Keys)", status: "pending" },
  { id: "3", item: "Logo and brand assets provided", status: "pending" },
  { id: "4", item: "Website CMS / Admin access", status: "pending" },
  { id: "5", item: "Hosting server configuration access", status: "pending" },
  { id: "6", item: "Domain registrar / DNS management access", status: "pending" },
  { id: "7", item: "Content copy, copywriting and media files", status: "pending" },
  { id: "8", item: "Brand guide (colors, typography, style)", status: "pending" },
  { id: "9", item: "Primary communication channel set (WhatsApp/Slack)", status: "pending" },
  { id: "10", item: "Project kick-off scheduled & start status active", status: "pending" },
];

/**
 * GATE 1: Interaction manual confirmation
 * Ensures outbound message cannot be marked 'sent' by AI or automated background jobs.
 * State Precondition: Interaction must exist and confirmed_sent must be false.
 */
export async function executeGate1ConfirmSent(interactionId: string, updatedContent?: string) {
  const interaction = await db.interaction.findUnique({
    where: { id: interactionId },
  });

  if (!interaction) {
    throw new Error("Interaction not found.");
  }

  if (interaction.confirmed_sent) {
    throw new InvalidStateTransitionError(
      "Invalid state transition for Gate 1: Interaction has already been confirmed sent."
    );
  }

  const updateData: any = { confirmed_sent: true, sent_confirmed_at: new Date() };
  if (updatedContent && updatedContent.trim()) {
    updateData.content = updatedContent.trim();
  }

  const updated = await db.interaction.update({
    where: { id: interactionId },
    data: updateData,
  });

  // If tied to a lead, update status from Target Today or Qualified to Contacted if needed
  if (interaction.lead_id) {
    const lead = await db.lead.findUnique({ where: { id: interaction.lead_id } });
    if (lead) {
      const updateLeadData: any = {};
      if (["Imported", "Qualified", "Target Today"].includes(lead.status)) {
        updateLeadData.status = "Contacted";
      } else if (interaction.direction === "Outgoing") {
        // Increment follow_up_count ONLY when Gate 1 is cleared for an outgoing follow-up interaction (FIX 4)
        updateLeadData.follow_up_count = Math.min((lead.follow_up_count || 0) + 1, 4);
      }
      if (Object.keys(updateLeadData).length > 0) {
        await db.lead.update({
          where: { id: lead.id },
          data: updateLeadData,
        });
      }
    }
  }

  return updated;
}

/**
 * GATE 2: Approve Proposal
 * Changes Proposal status to Approved and stamps approved_at timestamp.
 * State Precondition: Proposal must exist and status must be "Draft".
 */
export async function executeGate2ApproveProposal(proposalId: string) {
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  if (proposal.status !== "Draft") {
    throw new InvalidStateTransitionError(
      `Invalid state transition for Gate 2: Proposal must be in Draft status (currently "${proposal.status}").`
    );
  }

  const updated = await db.proposal.update({
    where: { id: proposalId },
    data: {
      status: "Approved",
      approved_at: new Date(),
    },
  });

  return updated;
}

/**
 * GATE 3: Mark Proposal as Sent
 * Blocked unless Proposal has been formally approved (Gate 2 timestamp exists).
 * State Precondition: Proposal must exist and status must be "Approved".
 */
export async function executeGate3MarkProposalSent(proposalId: string) {
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  if (proposal.status !== "Approved" || !proposal.approved_at) {
    throw new InvalidStateTransitionError(
      `Invalid state transition for Gate 3: Proposal must be in Approved status (currently "${proposal.status}").`
    );
  }

  const updated = await db.proposal.update({
    where: { id: proposalId },
    data: {
      status: "Sent",
      sent_confirmed_at: new Date(),
    },
  });

  // If tied to lead, ensure deal stage is Proposal
  if (proposal.lead_id) {
    await db.deal.updateMany({
      where: { lead_id: proposal.lead_id },
      data: { stage: "Proposal" },
    });
  }

  return updated;
}

/**
 * GATE 4: Mark Invoice as Sent
 * User manually confirms the invoice has been dispatched to the client.
 * State Precondition: Invoice must exist and status must be "Draft".
 */
export async function executeGate4MarkInvoiceSent(invoiceId: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  if (invoice.status !== "Draft") {
    throw new InvalidStateTransitionError(
      `Invalid state transition for Gate 4: Invoice must be in Draft status (currently "${invoice.status}").`
    );
  }

  const updated = await db.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "Sent",
      sent_confirmed_at: new Date(),
    },
  });

  return updated;
}

/**
 * GATE 5: Confirm Payment Received
 * Strictly manual user confirmation. NEVER auto-set.
 * The ONLY allowed automated side effect: triggers Onboarding record creation.
 * State Precondition: Invoice must exist and status must be "Sent".
 */
export async function executeGate5ConfirmPaymentReceived(invoiceId: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  if (invoice.status !== "Sent") {
    throw new InvalidStateTransitionError(
      `Invalid state transition for Gate 5: Invoice must be in Sent status (currently "${invoice.status}").`
    );
  }

  const now = new Date();

  // 1. Update Invoice status to Paid with confirmed timestamp
  const updatedInvoice = await db.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "Paid",
      paid_confirmed_at: now,
    },
  });

  // 2. Update Client payment status and stage
  await db.client.update({
    where: { id: invoice.client_id },
    data: {
      payment_status: "Paid",
      stage: "Onboarding",
      last_activity: now,
    },
  });

  // 3. Automated Side Effect: Check if Onboarding record already exists; if not, create it
  let onboarding = await db.onboarding.findUnique({
    where: { client_id: invoice.client_id },
  });

  if (!onboarding) {
    onboarding = await db.onboarding.create({
      data: {
        client_id: invoice.client_id,
        checklist: DEFAULT_ONBOARDING_CHECKLIST,
        status: "In Progress",
        started_at: now,
      },
    });
  }

  // 4. Create an automatic Task for Onboarding Kickoff
  await db.task.create({
    data: {
      related_type: "Onboarding",
      related_id: onboarding.id,
      type: "Onboarding Step",
      title: `Onboarding Kickoff for ${invoice.client.business_name}`,
      bucket: "Action Required",
      status: "Open",
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
    },
  });

  return { invoice: updatedInvoice, onboarding };
}
