// Test Anti-Fabrication Rule: Force Quota-Exceeded Condition and verify zero database mutation
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("=== VERIFYING ANTI-FABRICATION & STRICT QUOTA HANDLING ===");

  // Step 0: Authenticate
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@clientpulse.io", password: "SoloAdmin2026!" }),
  });
  const cookie = loginRes.headers.get("set-cookie");
  const sessionCookie = cookie ? cookie.split(";")[0] : "";
  const authHeaders = { "Content-Type": "application/json", Cookie: sessionCookie };

  // Step 1: Create a pristine test lead with website = null, research_data = null
  const testLead = await prisma.lead.create({
    data: {
      business_name: "Unverified Business With No Footprint",
      city_country: "Abu Dhabi, UAE",
      niche_industry: "Consulting",
      website: null,
      status: "New",
      source_csv_row: { manual: true, initial_import: true },
    },
  });

  console.log(`\nCreated Test Lead: ${testLead.business_name} (ID: ${testLead.id})`);
  console.log(`- Pre-test website: ${testLead.website}`);
  console.log(`- Pre-test research_data: ${testLead.research_data}`);
  console.log(`- Pre-test source_csv_row:`, JSON.stringify(testLead.source_csv_row));

  // Step 2: Trigger Deep Research
  console.log("\nTriggering Deep Research POST request...");
  const res = await fetch(`${BASE_URL}/api/leads/${testLead.id}/deep-research`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ force_refresh: true }),
  });

  const statusCode = res.status;
  const json = await res.json();
  console.log(`HTTP Status: ${statusCode}`);
  console.log(`Response Payload:`, JSON.stringify(json, null, 2));

  // Step 3: Query Database directly to verify state
  const leadAfter = await prisma.lead.findUnique({
    where: { id: testLead.id },
  });

  console.log("\nDatabase Direct Verification:");
  console.log(`- website in DB: ${leadAfter?.website}`);
  console.log(`- research_data in DB: ${leadAfter?.research_data ? "Populated" : "null"}`);
  console.log(`- source_csv_row in DB:`, JSON.stringify(leadAfter?.source_csv_row));

  if (statusCode === 429) {
    // Quota was exceeded
    const isErrorCorrect = json.error === "Research could not be completed — search quota limit reached, try again later";
    const isDbUntouched = leadAfter?.website === null && leadAfter?.research_data === null;
    console.log(`\nVerification Result (Quota Exceeded):`);
    console.log(`- Correct Error Message Returned: ${isErrorCorrect}`);
    console.log(`- Database Remained 100% Untouched (No Fake Domain / No Fake Sources): ${isDbUntouched}`);
    if (isErrorCorrect && isDbUntouched) {
      console.log(">>> SUCCESS: Anti-fabrication rule strictly enforced. Zero data fabricated or persisted!");
    } else {
      console.log(">>> FAILED: Data was mutated or incorrect error returned!");
    }
  } else if (statusCode === 200) {
    // Real search succeeded
    console.log("\nReal Google Search Grounding succeeded without quota error.");
    console.log("Sources count:", json.research?.sources?.length || 0);
    if (json.research?.sources?.length > 0) {
      console.log("Sample real source:", json.research.sources[0]);
    }
  } else {
    console.log(`Returned HTTP ${statusCode}: ${json.error}`);
    const isDbUntouched = leadAfter?.website === null && leadAfter?.research_data === null;
    console.log(`- Database Remained 100% Untouched: ${isDbUntouched}`);
  }

  // Step 4: Verify buildDemoResearch is completely gone from codebase
  console.log("\nChecking for any remaining 'buildDemoResearch' in codebase...");
  const routeContent = fs.readFileSync("app/api/leads/[id]/deep-research/route.ts", "utf8");
  const hasDemoFunction = routeContent.includes("buildDemoResearch");
  const hasSynthesizedDomain = routeContent.includes(".com`");
  console.log(`- 'buildDemoResearch' present: ${hasDemoFunction} (Expected: false)`);
  console.log(`- Synthesized '.com' string generation present: ${hasSynthesizedDomain} (Expected: false)`);

  // Cleanup
  await prisma.lead.delete({ where: { id: testLead.id } });
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Test error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
