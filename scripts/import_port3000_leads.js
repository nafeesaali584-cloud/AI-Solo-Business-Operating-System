const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LEADS_SRC = path.join('C:', 'Users', 'HomePC', 'Downloads', 'sales discussion', 'data', 'leads.json');

async function main() {
  console.log('Reading leads from:', LEADS_SRC);
  const leads = JSON.parse(fs.readFileSync(LEADS_SRC, 'utf8'));
  console.log(`Found ${leads.length} leads to import.`);

  let imported = 0;
  let updated = 0;

  for (const lead of leads) {
    const businessName = lead.businessName.trim();

    // Map status
    let mappedStatus = 'Contacted';
    if (lead.status === 'replied') mappedStatus = 'In Discussion';
    else if (lead.status === 'objection') mappedStatus = 'Objection Handled';
    else if (lead.status === 'active') mappedStatus = 'Target Today';
    else if (lead.status === 'awaiting_reply') mappedStatus = 'Contacted';

    // Check if lead already exists by business_name or phone
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [
          { business_name: { equals: businessName } },
          ...(lead.phone ? [{ phone: { contains: lead.phone.replace(/[^0-9]/g, '') } }] : [])
        ]
      }
    });

    const leadData = {
      business_name: businessName,
      website: lead.currentWebsite || null,
      phone: lead.phone || null,
      email: lead.email || null,
      city_country: lead.location || 'Dubai, UAE',
      address: lead.location || 'Dubai, UAE',
      niche_industry: 'Auto Repair & Garage',
      demo_link: lead.demoLink || null,
      pitch_type: lead.pitchType || 'redesign',
      pipeline_stage: lead.stage || 1,
      status: mappedStatus,
      priority: lead.status === 'replied' ? 'Hottest' : (lead.stage >= 3 ? 'Hot' : 'Warm'),
      primary_observation: lead.notes || `${lead.pitchType === 'fresh_website' ? 'Zero Website' : 'Outdated Mobile Website'} • Sourced for WhatsApp Outreach`,
      primary_offer: lead.pitchType === 'fresh_website' ? 'Fresh Turnkey Website + WhatsApp Booking' : 'Mobile Redesign + 1-Tap WhatsApp Lead Converter',
      is_today_target: lead.status === 'replied' || lead.status === 'active',
      source_csv_row: JSON.stringify({
        originalId: lead.id,
        ownerName: lead.ownerName,
        pitchType: lead.pitchType,
        stage: lead.stage,
        demoLink: lead.demoLink,
        notes: lead.notes,
        rawStatus: lead.status
      })
    };

    let targetLeadId;

    if (existing) {
      const up = await prisma.lead.update({
        where: { id: existing.id },
        data: leadData
      });
      targetLeadId = up.id;
      updated++;
    } else {
      const created = await prisma.lead.create({
        data: leadData
      });
      targetLeadId = created.id;
      imported++;
    }

    // Import interactions/history
    if (lead.history && Array.isArray(lead.history)) {
      for (const h of lead.history) {
        const histDate = h.date ? new Date(h.date) : new Date();
        const isInbound = (h.action && h.action.toLowerCase().includes('replied')) || 
                          (h.message && (h.message.includes('? 1:24 PM') || h.message.includes('replied "Hi"')));

        // Check if interaction already exists for this lead
        const existingInteraction = await prisma.interaction.findFirst({
          where: {
            lead_id: targetLeadId,
            content: h.message || h.action
          }
        });

        if (!existingInteraction) {
          await prisma.interaction.create({
            data: {
              lead_id: targetLeadId,
              channel: h.channel || 'WhatsApp',
              direction: isInbound ? 'inbound' : 'outbound',
              content: h.message || h.action,
              confirmed_sent: true,
              sent_confirmed_at: histDate,
              created_at: histDate
            }
          });
        }
      }
    }
  }

  console.log(`\nImport Summary:`);
  console.log(`- Created new leads: ${imported}`);
  console.log(`- Updated existing leads: ${updated}`);
  const total = await prisma.lead.count();
  console.log(`- Total leads in SQLite dev.db now: ${total}`);
}

main()
  .catch(e => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
