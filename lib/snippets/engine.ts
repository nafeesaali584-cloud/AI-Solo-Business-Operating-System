import { db } from "@/lib/db";

export interface LeadMergeContext {
  business_name?: string | null;
  contact_name?: string | null;
  primary_offer?: string | null;
  primary_observation?: string | null;
  city_country?: string | null;
  niche_industry?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  [key: string]: any;
}

/**
 * Replaces {{field}} style merge tags in snippet text using lead attributes.
 * Handles casing variations and aliases cleanly.
 */
export function mergeSnippet(template: string, context: LeadMergeContext): string {
  if (!template) return "";

  const businessName = context.business_name || "your company";
  const contactName = context.contact_name || "there";
  const offer = context.primary_offer || context.offer || "our services";
  const observation = context.primary_observation || context.observation || "your current setup";
  const city = context.city_country || context.city || "";
  const industry = context.niche_industry || context.industry || "your industry";
  const phone = context.phone || "";
  const email = context.email || "";
  const website = context.website || "";

  let result = template;

  const replacements: Record<string, string> = {
    business_name: businessName,
    businessname: businessName,
    business: businessName,
    company: businessName,
    contact_name: contactName,
    contactname: contactName,
    name: contactName,
    offer: offer,
    primary_offer: offer,
    observation: observation,
    primary_observation: observation,
    city: city,
    city_country: city,
    location: city,
    industry: industry,
    niche_industry: industry,
    phone: phone,
    email: email,
    website: website,
  };

  // Replace each tag case-insensitively
  for (const [tag, val] of Object.entries(replacements)) {
    const regex = new RegExp(`{{\\s*${tag}\\s*}}`, "gi");
    result = result.replace(regex, val);
  }

  return result;
}

export const STARTER_SNIPPETS = [
  {
    title: "Cold WhatsApp Intro (Observation Hook)",
    category: "WhatsApp",
    body: "Hi {{contact_name}}, saw your work at {{business_name}} here in {{city}}. {{observation}} — we specialize in {{offer}} to solve that without operational overhead. Would you be open to a 5-minute chat this week?",
  },
  {
    title: "Audit Teardown Pitch",
    category: "Audit Pitch",
    body: "Hey {{contact_name}}, I put together a quick observation for {{business_name}}: {{observation}}. We recently implemented {{offer}} for similar businesses to streamline this. Let me know if you'd like me to send over the teardown!",
  },
  {
    title: "Direct WhatsApp Follow-up #1",
    category: "Follow-up",
    body: "Hi {{contact_name}}, following up on my previous note regarding {{business_name}}. We're currently taking on two clients for {{offer}} this month. Let me know if you have 5 minutes to connect.",
  },
  {
    title: "Short & Direct Email Pitch",
    category: "Email",
    body: "Subject: Quick question regarding {{business_name}}\n\nHi {{contact_name}},\n\nI was reviewing {{business_name}} and noticed {{observation}}.\n\nWe provide {{offer}} specifically built to eliminate that bottleneck.\n\nWould you be open to a brief 5-min intro this week?",
  },
  {
    title: "Breakup / Final Touchpoint",
    category: "Follow-up",
    body: "Hi {{contact_name}}, I know you're super busy. I won't follow up again regarding {{offer}} for {{business_name}}, but feel free to reach out whenever you want to streamline this. Wishing you the best!",
  },
];

/**
 * Ensures starter snippets exist in the database so the library is never blank.
 */
export async function ensureStarterSnippets() {
  const count = await db.snippet.count();
  if (count === 0) {
    for (const s of STARTER_SNIPPETS) {
      await db.snippet.create({ data: s });
    }
  }
}
