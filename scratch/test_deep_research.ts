import { determineSingleOffer, calculateQualification } from "../lib/ai/research";
import { generateBehaviorFollowUp } from "../lib/ai/follow-up";

async function runTests() {
  console.log("=========================================");
  console.log("1. TESTING DYNAMIC SINGLE-OFFER HIERARCHY");
  console.log("=========================================");

  // 1. No website at all -> Website Build
  const offer1 = determineSingleOffer(
    { is_biolink_only: false },
    { website: null }
  );
  console.log("Offer 1 (No website):", offer1);
  if (offer1.primary_offer !== "Website Build") throw new Error("Offer 1 failed!");

  // 2. Slow/broken/outdated -> Website Redesign
  const offer2 = determineSingleOffer(
    { tech_debt_flag: "Outdated table-based mobile layout" },
    { website: "https://apexclinic.ae" }
  );
  console.log("Offer 2 (Outdated site):", offer2);
  if (offer2.primary_offer !== "Website Redesign") throw new Error("Offer 2 failed!");

  // 3. Weak SEO -> SEO
  const offer3 = determineSingleOffer(
    { is_weak_seo: true, indexed_pages_note: "Few pages indexed (3 found)" },
    { website: "https://apexclinic.ae" }
  );
  console.log("Offer 3 (Weak SEO):", offer3);
  if (offer3.primary_offer !== "SEO") throw new Error("Offer 3 failed!");

  // 4. Unanswered questions on social -> WhatsApp Automation
  const offer4 = determineSingleOffer(
    { signals: [{ type: "urgency", detail: "Unanswered comments on Instagram profile" }] },
    { website: "https://apexclinic.ae" }
  );
  console.log("Offer 4 (Unanswered social):", offer4);
  if (offer4.primary_offer !== "WhatsApp Automation") throw new Error("Offer 4 failed!");

  // 5. Running ads but manual reply -> WhatsApp Automation
  const offer5 = determineSingleOffer(
    { signals: [{ type: "no_chatbot", detail: "Manual WhatsApp reply during business hours" }] },
    { website: "https://apexclinic.ae", source_csv_row: { "Marketing": "Running Meta Ads" } }
  );
  console.log("Offer 5 (Running Ads + Manual Reply):", offer5);
  if (offer5.primary_offer !== "WhatsApp Automation") throw new Error("Offer 5 failed!");

  // 6. Built on legacy builder (Wix/Weebly) -> Website Redesign
  const offer6 = determineSingleOffer(
    { indexed_pages_note: "Powered by Wix site builder" },
    { website: "https://apexclinic.ae", source_csv_row: { "CMS": "Wix" } }
  );
  console.log("Offer 6 (Legacy builder):", offer6);
  if (offer6.primary_offer !== "Website Redesign") throw new Error("Offer 6 failed!");

  console.log("\n=========================================");
  console.log("2. TESTING QUALIFICATION TIERING (HOT / WARM / COLD)");
  console.log("=========================================");
  const hotResult = calculateQualification(
    {
      signals: [
        { type: "hiring", detail: "Hiring 2 full-time specialists" },
        { type: "urgency", detail: "Immediate patient overflow" },
        { type: "tech_debt", detail: "Legacy layout with zero mobile booking" },
      ],
    },
    [{ competitor_name: "Dubai Smile", price_range: "AED 4,000 - 8,000", source_url: "https://dubaismile.com/pricing" }],
    { review_count: 55 }
  );
  console.log("Qualification calculation for high-signal lead:", hotResult);
  if (hotResult.tier !== "Hot") throw new Error("Expected Hot tier!");

  const coldResult = calculateQualification(
    { signals: [] },
    [],
    { review_count: 0 }
  );
  console.log("Qualification calculation for zero-signal lead:", coldResult);
  if (coldResult.tier !== "Cold" && coldResult.tier !== "Warm") throw new Error("Expected Cold or baseline Warm tier!");

  console.log("\n=========================================");
  console.log("3. TESTING 4-STAGE SALES PSYCHOLOGY FOLLOW-UPS");
  console.log("=========================================");

  // Stage 1: Value-Add Nudge
  const stage1 = await generateBehaviorFollowUp({
    business_name: "Apex Dental Clinic",
    contact_name: "Dr. Tariq",
    channel: "WhatsApp",
    behavior: "no_reply_not_seen",
    current_follow_up_count: 0,
    primary_offer: "WhatsApp Automation",
  });
  console.log("Stage 1 Output:", stage1.strategy_name);
  console.log("Stage 1 Draft:", stage1.draft.body.slice(0, 110) + "...\n");

  // Stage 2: Social Proof
  const stage2 = await generateBehaviorFollowUp({
    business_name: "Apex Dental Clinic",
    contact_name: "Dr. Tariq",
    channel: "WhatsApp",
    behavior: "seen_no_reply",
    current_follow_up_count: 1,
    primary_offer: "WhatsApp Automation",
  });
  console.log("Stage 2 Output:", stage2.strategy_name);
  console.log("Stage 2 Draft:", stage2.draft.body.slice(0, 110) + "...\n");

  // Stage 3: Objection Handle
  const stage3 = await generateBehaviorFollowUp({
    business_name: "Apex Dental Clinic",
    contact_name: "Dr. Tariq",
    channel: "WhatsApp",
    behavior: "replied_hesitant",
    current_follow_up_count: 2,
    primary_offer: "WhatsApp Automation",
    custom_hesitation_notes: "We are swamped with patients right now",
  });
  console.log("Stage 3 Output:", stage3.strategy_name);
  console.log("Stage 3 Draft:", stage3.draft.body.slice(0, 110) + "...\n");

  // Stage 4: Graceful Exit
  const stage4 = await generateBehaviorFollowUp({
    business_name: "Apex Dental Clinic",
    contact_name: "Dr. Tariq",
    channel: "WhatsApp",
    behavior: "final_follow_up",
    current_follow_up_count: 3,
    primary_offer: "WhatsApp Automation",
  });
  console.log("Stage 4 Output:", stage4.strategy_name);
  console.log("Stage 4 Draft:", stage4.draft.body.slice(0, 110) + "...\n");

  // Warm Fast-Path: Call booking prompt
  const warm = await generateBehaviorFollowUp({
    business_name: "Apex Dental Clinic",
    contact_name: "Dr. Tariq",
    channel: "WhatsApp",
    behavior: "warm_interested",
    current_follow_up_count: 2,
    primary_offer: "WhatsApp Automation",
  });
  console.log("Warm Fast-Path Output:", warm.strategy_name);
  console.log("Warm Draft:", warm.draft.body.slice(0, 110) + "...\n");

  console.log("=========================================");
  console.log("ALL VERIFICATION CHECKS PASSED! ✅");
  console.log("=========================================");
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
