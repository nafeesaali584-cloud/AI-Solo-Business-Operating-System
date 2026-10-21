const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding local SQLite database...');

  // 1. Ensure default settings exist
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      daily_target_quota: 5,
      follow_up_cadence_days: 4,
      tone_preference: 'Professional, concise, and value-oriented',
      theme_preference: 'dark',
    },
  });
  console.log('[Seed] Default settings created.');

  // 2. Load existing leads from client onborading system if available
  const dataStorePath = path.resolve('..', 'client onborading system', 'server', 'data_store.json');
  if (fs.existsSync(dataStorePath)) {
    try {
      const raw = fs.readFileSync(dataStorePath, 'utf8');
      const db = JSON.parse(raw);
      if (Array.isArray(db.leads)) {
        for (const l of db.leads) {
          const name = l.company || l.business_name || 'Business';
          const existing = await prisma.lead.findFirst({ where: { business_name: name } });
          if (!existing) {
            await prisma.lead.create({
              data: {
                id: l.id || undefined,
                business_name: name,
                website: l.website || null,
                phone: l.phone || l.whatsapp || null,
                email: l.email || null,
                city_country: l.location || 'Dubai, UAE',
                niche_industry: l.niche || 'Automotive Repair',
                priority: l.tier || 'Hot',
                status: l.status === 'Closed' ? 'Won' : l.status === 'Interested' ? 'Qualified' : 'Target Today',
                is_today_target: true,
                rating: l.google_rating ? parseFloat(l.google_rating) : 4.8,
                review_count: l.google_reviews ? parseInt(l.google_reviews) : 45,
                primary_observation: l.notes || 'High conversion opportunity in UAE',
                primary_offer: 'Mobile Redesign + 1-Tap WhatsApp Lead Converter',
                source_csv_row: JSON.stringify({
                  source: 'Initial Data Store',
                  pitch_message: l.pitch_message || null,
                }),
              },
            });
          }
        }
        console.log(`[Seed] Imported ${db.leads.length} leads from data_store.json.`);
      }
    } catch (e) {
      console.warn('[Seed] Warning importing leads:', e.message);
    }
  }

  // 3. Ensure Al Qusais Garage is present as active hot target
  const alQusais = await prisma.lead.findFirst({
    where: { business_name: { contains: 'Al Qusais' } },
  });
  if (!alQusais) {
    await prisma.lead.create({
      data: {
        business_name: 'Al Qusais Garage',
        phone: '+971 50 468 9607',
        city_country: 'Al Qusais, Dubai',
        niche_industry: 'Automotive Repair',
        priority: 'Hottest',
        status: 'Contacted',
        is_today_target: true,
        rating: 4.8,
        review_count: 84,
        primary_observation: 'Sent demo video, awaiting recovery reply on WhatsApp',
        primary_offer: 'Mobile Redesign + WhatsApp Quote Calculator',
        source_csv_row: JSON.stringify({
          demo_url: 'https://qusais-garage-pro.base44.app/',
        }),
      },
    });
    console.log('[Seed] Created Al Qusais Garage priority target.');
  }

  const count = await prisma.lead.count();
  console.log(`[Seed] SUCCESS! Total leads in SQLite dev.db: ${count}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
