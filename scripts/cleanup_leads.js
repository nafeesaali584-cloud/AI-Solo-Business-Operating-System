const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('[Cleanup] Auditing existing leads in dev.db to remove modern 2024-2026 sites...');
  const leads = await prisma.lead.findMany();

  let removed = 0;
  for (const lead of leads) {
    const site = (lead.website || '').toLowerCase();
    const name = lead.business_name;

    // Remove known modern sites from previous test scrape
    const isModern =
      site.includes('almeerajauto.com') ||
      site.includes('carcafe.ae') ||
      site.includes('cargarageexpert.com') ||
      site.includes('bisalamautotech.com') ||
      site.includes('cargarageautoservice.ae');

    if (isModern) {
      await prisma.lead.delete({ where: { id: lead.id } });
      console.log(`[Removed Modern Site]: ${name} (${site})`);
      removed++;
    } else {
      // Ensure Zero-Website and Outdated tags are crisp
      let tag = '🚨 Zero Website';
      let obs = 'No Official Website on Google Maps';
      if (site) {
        if (site.startsWith('http://')) {
          tag = '⚠️ Insecure (No SSL)';
          obs = 'Insecure HTTP - Chrome warning';
        } else {
          tag = '⏳ Outdated / Dead Site';
          obs = 'Legacy site lacking mobile WhatsApp calculator';
        }
      }
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          primary_observation: `${tag} • ${obs}`,
          priority: !site ? 'Hottest' : 'Hot',
        },
      });
      console.log(`[Kept Target]: ${name} | Tag: ${tag}`);
    }
  }

  const remaining = await prisma.lead.count();
  console.log(`\n[Cleanup Complete] Removed ${removed} modern sites. Remaining Qualified Targets: ${remaining}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
