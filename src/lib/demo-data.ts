/**
 * Static demo data used when the backend API is unreachable (e.g. Vercel static deploy).
 */

import type { StandupData, QueueItem, ActivityEntry, ApiContact } from "@/services/api";

export const DEMO_ORG_ID = "demo-org-00000000";

export const demoStandup: StandupData = {
  date: new Date().toISOString().split("T")[0],
  touches_sent: 14,
  replies_received: 6,
  positive_replies: 3,
  conversions: 1,
  needs_you: 4,
  planned_today: 8,
  recent_activity: [],
};

export const demoQueue: QueueItem[] = [
  {
    id: "demo-q-1",
    contact_name: "Adaeze Okonkwo",
    contact_email: "adaeze@finova.ng",
    contact_company: "Finova Technologies",
    contact_metadata: "",
    sequence_name: "warm_inbound",
    touch_index: 0,
    channel: "email",
    angle: "first_touch",
    drafted_content: "Subject: Congrats on the raise, Adaeze 🎉\n\nHi Adaeze,\n\nSaw that Finova just closed a seed round — huge congrats! That's exciting.\n\nI'm reaching out because when teams grow from 5 to 15 quickly (which it looks like you're doing), lead follow-up is usually the first thing that breaks. Prospects slip through the cracks, warm leads go cold, and nobody notices until the pipeline dries up.\n\nWe built something that fixes exactly that — an AI teammate that follows up with every lead in your pipeline, in your voice, until they convert or say no.\n\nWould 10 minutes this week work to show you how it could help Finova? No pressure either way.\n\nBest,\nSammy",
    research_context: "Finova Technologies — Lagos-based fintech startup. Recently closed seed round (announced on LinkedIn). Adaeze Okonkwo is co-founder & CEO. Team growing from 5 to ~15 employees. Likely experiencing scaling pains with customer acquisition and follow-up processes.",
    status: "pending_approval",
    scheduled_for: new Date().toISOString(),
  },
  {
    id: "demo-q-2",
    contact_name: "Emeka Nwosu",
    contact_email: "emeka@cloudpark.io",
    contact_company: "CloudPark",
    contact_metadata: "",
    sequence_name: "cold_outbound",
    touch_index: 2,
    channel: "whatsapp",
    angle: "follow_up_3",
    drafted_content: "Hey Emeka 👋\n\nJust a quick follow-up — I know things move fast at CloudPark so no worries if the timing wasn't right before.\n\nQuick question: are you currently tracking how many leads go quiet after the first conversation? Most SaaS companies we work with were losing 40-60% of warm leads to poor follow-up before they started using us.\n\nHappy to share a 2-min breakdown of what we've done for similar companies. Or if it's not a fit, just let me know and I'll stop bugging you 😄",
    research_context: "CloudPark — B2B SaaS company based in Abuja, ~20 employees. Emeka Nwosu is Head of Growth, responsible for pipeline and conversions. No response to first two outreach touches (email + WhatsApp). Company recently launched a new product tier — likely focused on growth metrics.",
    status: "pending_approval",
    scheduled_for: new Date().toISOString(),
  },
  {
    id: "demo-q-3",
    contact_name: "Funke Balogun",
    contact_email: "funke@greenmartng.com",
    contact_company: "GreenMart Nigeria",
    contact_metadata: "",
    sequence_name: "warm_inbound",
    touch_index: 1,
    channel: "email",
    angle: "follow_up_1",
    drafted_content: "Subject: Re: Following up — GreenMart expansion\n\nHi Funke,\n\nFollowing up on my last note. I noticed GreenMart is expanding to Port Harcourt and Kano — that's a big move. Congrats!\n\nWith two new cities comes a lot more customer conversations to manage. Our retail clients typically see a 35% jump in conversions just from making sure every interested buyer hears back within minutes (instead of hours or days).\n\nI'd love to share a quick case study from a similar Nigerian e-commerce brand. Would Wednesday or Thursday work for a 10-minute call?\n\nCheers,\nSammy",
    research_context: "GreenMart Nigeria — e-commerce/retail company. Currently operating in Lagos, expanding operations to Port Harcourt and Kano. Funke Balogun is CMO. First touch was sent 4 days ago (email) — opened but no reply. Company likely dealing with increased customer volume from expansion.",
    status: "pending_approval",
    scheduled_for: new Date().toISOString(),
  },
  {
    id: "demo-q-4",
    contact_name: "Tunde Adeyemi",
    contact_email: "tunde@logixfreight.com",
    contact_company: "Logix Freight",
    contact_metadata: "",
    sequence_name: "cold_outbound",
    touch_index: 0,
    channel: "linkedin",
    angle: "first_touch",
    drafted_content: "Tunde — saw your post about scaling ops across West Africa. Impressive growth.\n\nQuick thought: when logistics companies scale that fast, customer follow-up usually gets dropped first. Not because anyone's lazy — there's just too many conversations to track manually.\n\nWe help companies like yours make sure every lead gets consistent, personalized follow-up without hiring more people. One of our logistics clients went from 15% reply rate to 40% in the first month.\n\nWorth a quick chat to see if it could work for Logix?",
    research_context: "Logix Freight — logistics and freight forwarding company, HQ in Lagos. Tunde Adeyemi is founder and CEO. Very active on LinkedIn — recently posted about challenges of scaling operations across West Africa. Company appears to be in rapid growth phase, expanding to Ghana and Côte d'Ivoire.",
    status: "pending_approval",
    scheduled_for: new Date().toISOString(),
  },
];

export const demoActivity: ActivityEntry[] = [
  { id: "demo-a-1", action: "Sent follow-up email to Chidi Eze", detail: "Touch 3 of warm_inbound sequence", status: "success", contact_name: "Chidi Eze", created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: "demo-a-2", action: "Received reply from Ngozi Obi", detail: "Interested in scheduling a demo call", status: "success", contact_name: "Ngozi Obi", created_at: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: "demo-a-3", action: "Drafted first touch for Adaeze Okonkwo", detail: "Waiting for your approval", status: "pending", contact_name: "Adaeze Okonkwo", created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: "demo-a-4", action: "Researched lead: Emeka Nwosu", detail: "Found company info, recent funding, team size", status: "info", contact_name: "Emeka Nwosu", created_at: new Date(Date.now() - 90 * 60000).toISOString() },
  { id: "demo-a-5", action: "Conversion: Bola Fashola booked a demo", detail: "After 4 touches over 2 weeks", status: "success", contact_name: "Bola Fashola", created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "demo-a-6", action: "WhatsApp follow-up sent to Yusuf Musa", detail: "Touch 2 of cold_outbound sequence", status: "success", contact_name: "Yusuf Musa", created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "demo-a-7", action: "Email bounced for info@oldcompany.com", detail: "Marked contact as invalid", status: "warning", contact_name: null, created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: "demo-a-8", action: "Sent LinkedIn DM to Kemi Adesanya", detail: "First touch — personalized intro", status: "success", contact_name: "Kemi Adesanya", created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
];

const makeContact = (i: number, name: string, email: string, company: string, role: string, status: string, touchIndex: number, source: string, score: number): ApiContact => ({
  id: `demo-c-${i}`,
  name, email, phone: null, company, role, linkedin: null, website: null,
  industry: null, company_size: null, tags: "", notes: "",
  lead_score: score, source, source_detail: null, status, touch_index: touchIndex,
  last_touch_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
  next_touch_at: new Date(Date.now() + Math.random() * 3 * 86400000).toISOString(),
  sequence_name: touchIndex === 0 ? "warm_inbound" : "cold_outbound",
  available_channels: "email,whatsapp",
  metadata: "{}",
  created_at: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
  updated_at: new Date(Date.now() - Math.random() * 3 * 86400000).toISOString(),
});

export const demoContacts: ApiContact[] = [
  makeContact(1, "Adaeze Okonkwo", "adaeze@finova.ng", "Finova Technologies", "CEO", "active", 0, "referral", 85),
  makeContact(2, "Emeka Nwosu", "emeka@cloudpark.io", "CloudPark", "Head of Growth", "active", 2, "linkedin", 72),
  makeContact(3, "Funke Balogun", "funke@greenmartng.com", "GreenMart Nigeria", "CMO", "active", 1, "website", 78),
  makeContact(4, "Tunde Adeyemi", "tunde@logixfreight.com", "Logix Freight", "Founder", "queued", 0, "csv_import", 65),
  makeContact(5, "Ngozi Obi", "ngozi@healthplus.ng", "HealthPlus Pharmacy", "Procurement Lead", "replied", 3, "website", 90),
  makeContact(6, "Chidi Eze", "chidi@paystack-merchant.com", "QuickServe Payments", "CTO", "active", 3, "referral", 68),
  makeContact(7, "Bola Fashola", "bola@fashola-consulting.com", "Fashola Consulting", "Managing Partner", "converted", 4, "cold_email", 95),
  makeContact(8, "Yusuf Musa", "yusuf@kanotextiles.com", "Kano Textiles Ltd", "Sales Director", "active", 2, "csv_import", 60),
  makeContact(9, "Kemi Adesanya", "kemi@edutechng.com", "EduTech Nigeria", "COO", "active", 1, "linkedin", 74),
  makeContact(10, "Olu Bakare", "olu@swiftlogistics.ng", "Swift Logistics", "Operations Manager", "paused", 1, "website", 55),
  makeContact(11, "Amina Suleiman", "amina@sahelpharma.com", "Sahel Pharma", "Head of Sales", "replied", 2, "referral", 82),
  makeContact(12, "Dayo Ogunbiyi", "dayo@lagosfoods.com", "Lagos Foods Co", "Founder", "active", 1, "csv_import", 70),
];
