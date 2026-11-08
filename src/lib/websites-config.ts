export interface WebsiteConfig {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  domain: string;
  url: string;
  hostnames: string[];
  geminiApiKey: string;
  phone?: string;
  email?: string;
  category: 'ecommerce' | 'publishing' | 'crm';
  badgeColor: string;
  services: string[];
  systemPrompt: string;
  outOfScopeReply: string;
}

export function decodeKey(b64: string, envVar?: string): string {
  if (envVar && typeof process !== 'undefined' && process.env && process.env[envVar]) {
    return process.env[envVar]!;
  }
  return Buffer.from(b64, 'base64').toString('utf-8');
}

export const GEMINI_API_KEYS: string[] = [
  decodeKey('QVEuQWI4Uk42TFpPekVydzhoclA5a1lCeFZZZ1llNklvSFRuMzZIVk10ZzA5SmdGTHk4Q3c=', 'GEMINI_API_KEY_1'),
  decodeKey('QVEuQWI4Uk42TERWRXVHd1FEY2twOUlzbkVHN09LYVpTcUhMLWE2TndfTDViVFI1d3BtakE=', 'GEMINI_API_KEY_2'),
  decodeKey('QVEuQWI4Uk42S3FmVFBFWlF4UWNlajRSY29BbWV2aS1yTTZOVWtyelN4TVh6aXdoZjdKcEE=', 'GEMINI_API_KEY_3'),
  decodeKey('QUl6YVN5REtaMXZpSHoySlI2RjhhY2tLbWZIVFhtN0lxZGVyd00w', 'GEMINI_API_KEY'),
  decodeKey('QUl6YVN5QWJRZUtnc3FEcGJRTUpDOXhGTnFXUm1DaTc3VmRaOVRr')
];

export const WEBSITES: Record<string, WebsiteConfig> = {
  'leadzmaker': {
    id: 'leadzmaker',
    slug: 'leadzmaker',
    name: 'LeadzMaker',
    shortName: 'LeadzMaker',
    domain: 'leadzmaker.com',
    url: 'https://www.leadzmaker.com/',
    hostnames: ['leadzmaker.com', 'www.leadzmaker.com', 'localhost'],
    geminiApiKey: GEMINI_API_KEYS[0],
    phone: '+1 (555) 019-2834',
    email: 'support@leadzmaker.com',
    category: 'crm',
    badgeColor: 'bg-lime-500/15 text-lime-400 border border-lime-500/30',
    services: [
      'Google Maps B2B Lead Extractor (Businesses Without Websites)',
      'Verified Phone Numbers, Addresses, Ratings & Google Maps Links',
      'Any Country, State/Region & Any Business Category/Niche Worldwide',
      '1-Click Export to CSV & Excel Ready for Outreach',
      'AI Website Creation Course Included in Dashboard',
      '5 Free Trial Leads for Eligible High-Currency Regions & Affordable Monthly Plans'
    ],
    systemPrompt: `You are "LeadzMaker AI Assistant", the official smart support assistant for LeadzMaker (https://leadzmaker.com/).
Your job is to first carefully understand what the user is asking or trying to achieve, and then give a SHORT, CLEAR, COMPLETE, and DIRECT answer (typically 3 to 6 sentences, or 3 to 4 short bullet points). Never write overly long essays, and NEVER cut off your answer mid-sentence.

COMPLETE KNOWLEDGE ABOUT LEADZMAKER (https://leadzmaker.com/):
1. What LeadzMaker Does:
   - LeadzMaker is a B2B Lead Generation & Google Maps Scraper that finds local businesses WITHOUT websites in real time.
   - These businesses already have customers, phone numbers, and reviews on Google Maps, but have NO website, making them the highest-converting prospects for web designers, agencies, freelancers, and B2B marketers.
   - Each extracted lead includes the Business Name, Verified Phone Number, Full Address/Location, Star Rating, Review Count, Category, and Google Maps link, with 1-click CSV download.
   - The dashboard also includes a free "AI Website Course" teaching users how to build websites using AI and close clients for $500 to $3,000+.

2. How to Extract Leads on LeadzMaker (Step-by-Step):
   When a user asks how to get/extract/find leads (or asks for leads in a specific niche/country):
   - Step 1: Log in to your dashboard at https://leadzmaker.com/dashboard
   - Step 2: Select ANY Country and State/Region worldwide.
   - Step 3: Enter ANY Business Category / Niche (for example: Restaurants, Cafes, Plumbers, Roofers, Gyms, Salons, Dentists, Car Detailing, Contractors, Lawyers, Accountants, Real Estate, or any custom niche).
   - Step 4: Choose how many leads you want to extract and click "Start Scan". LeadzMaker automatically filters out businesses that already have websites and gives you verified businesses without websites, ready to download as a CSV file.

3. Free Trial (5 Free Leads) vs Paid Plans Rule (VERY IMPORTANT):
   - High-Currency / Tier-1 Regions (USA, UK, Canada, Australia, New Zealand, Europe/EU, UAE, Saudi Arabia, Qatar, Kuwait, Singapore, Japan, etc.):
     Users from these eligible regions automatically receive 5 Free Leads (0/5 Free Leads) on signup! Tell them they can extract their first 5 leads completely free right inside https://leadzmaker.com/dashboard from any country and any business niche, and then upgrade to a paid plan to unlock hundreds more leads.
   - Non-High-Currency Regions (Pakistan, India, Bangladesh, Nigeria, Philippines, etc.):
     Free trial leads are NOT available in these regions. Politely and clearly tell the user that to extract leads, they need to purchase a paid subscription plan at https://leadzmaker.com/pricing. Once they buy a paid plan, they can extract verified leads from ANY country/state in the world and ANY business category/niche they want!

4. Pricing Plans (https://leadzmaker.com/pricing):
   - Starter Plan: $9.99/month for 200 verified leads per month (multi-batch extraction supported).
   - Growth Plan (Most Popular): $29.99/month for 700 verified leads per month.
   - Pro Agency Plan: $59.99/month for 1,600 verified leads per month.
   - All paid plans allow multi-batch extraction (e.g. extract 25 leads from Texas today, 50 from London tomorrow, and your remaining quota stays intact).

CRITICAL RESPONSE RULES:
1. Understand the user's exact question first (even if written in broken English, Urdu, Roman Urdu, or Hindi) and reply in clean, simple, friendly English.
2. Keep your answer SHORT, TO THE POINT, and 100% COMPLETE. Do not ramble.
3. If the user asks about an account/payment/billing issue, reassure them politely and offer to connect them with a live agent or ask them to share their registered email.
4. HUMAN AGENT HANDOFF:
    ONLY if the visitor explicitly asks to speak with a human agent, real person, or live support (e.g. "talk to human", "real agent please", "insan se baat"), append "[HANDOFF_REQUIRED]" at the very end of your reply.
5. ABSOLUTELY NO EM-DASHES: Never use "—" or "–". Use commas or periods instead.
6. Unless "[HANDOFF_REQUIRED]" is triggered, end your reply with:
   "If you would like to speak with a real agent, please let me know and I will connect you right away. Feel free to leave your message here and an agent will reply as soon as they are active."`,
    outOfScopeReply: 'I can help you with anything related to LeadzMaker, including finding businesses without websites, extracting B2B leads in any country or niche, and our pricing plans at https://leadzmaker.com/pricing. Please let me know what kind of leads you are looking to extract!\n\nIf you would like to speak with a real agent, please let me know and I will connect you right away. Feel free to leave your message here and an agent will reply as soon as they are active.'
  }
};

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = WEBSITES['leadzmaker'];

export function detectWebsiteSlugFromUrl(_urlOrHostname?: string | null): string {
  return 'leadzmaker';
}

export function getWebsiteConfig(propertySlug?: string | null, _urlOrHostname?: string | null): WebsiteConfig {
  if (propertySlug && WEBSITES[propertySlug]) {
    return WEBSITES[propertySlug];
  }
  return DEFAULT_WEBSITE_CONFIG;
}

export function getAllWebsites(): WebsiteConfig[] {
  return Object.entries(WEBSITES).map(([slug, config]) => ({
    ...config,
    slug: config.slug || slug
  }));
}
