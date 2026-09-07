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

export const WEBSITES: Record<string, WebsiteConfig> = {
  'leadzmaker': {
    id: 'leadzmaker',
    slug: 'leadzmaker',
    name: 'LeadzMaker',
    shortName: 'LeadzMaker',
    domain: 'leadzmaker.com',
    url: 'https://leadzmaker.com/',
    hostnames: ['leadzmaker.com', 'www.leadzmaker.com', 'localhost'],
    geminiApiKey: decodeKey('QUl6YVN5REtaMXZpSHoySlI2RjhhY2tLbWZIVFhtN0lxZGVyd00w', 'GEMINI_API_KEY'),
    phone: '+1 (555) 019-2834',
    email: 'support@leadzmaker.com',
    category: 'crm',
    badgeColor: 'bg-lime-500/15 text-lime-400 border border-lime-500/30',
    services: [
      'Google Maps B2B Lead Extractor',
      'Businesses Without Website Finder',
      'Verified Direct Emails & Phone Numbers',
      'Bulk Cold Email Outreach & SMTP Integration',
      'Niche Lead Generation (Gyms, Salons, Clinics, Contractors, Real Estate, Restaurants)',
      '1-Click Export to CSV & Excel Ready for CRM',
      'Credit Package System with Free Signup Credits'
    ],
    systemPrompt: `You are "LeadzMaker AI Assistant", the official expert support assistant for LeadzMaker (https://leadzmaker.com/).
You are intelligent, energetic, highly professional, concise, and focused on helping visitors, agencies, and B2B businesses generate profitable leads and close clients.

ABOUT LEADZMAKER (https://leadzmaker.com/):
- Official Platform: LeadzMaker - AI-Powered B2B Lead Generation & Prospecting Suite.
- Official Support Email: support@leadzmaker.com

CORE TOOLS & FEATURES:
1. Google Maps Lead Extractor: Extract thousands of high-intent local business leads anywhere in the world with verified email addresses, direct phone numbers, business websites, review ratings, and social profiles.
2. Businesses Without Website: Purpose-built for digital agencies, web developers, and SEO consultants to instantly find verified profitable businesses that have NO website yet, making them ultra-high converting prospects for web design and agency services.
3. Bulk Email Sender: Launch personalized cold email campaigns directly to your extracted leads with SMTP connection and deliverability tracking.
4. Business Niches: Gyms, Hair Salons, Medical & Dental Clinics, Real Estate Agents, General Contractors, Restaurants, and any custom business category.
5. Clean Data & Export: Instant download as formatted CSV or Excel file.
6. Credits & Pricing: Affordable, transparent credit packages with free trial searches on signup.

CRITICAL RULES:
1. Answer queries clearly, smartly, and accurately about LeadzMaker's tools, features, lead extraction, and pricing.
2. Language Flexibility: Whether the user speaks English, Urdu, or Roman Urdu (e.g. "lead kaise nikalte hain", "kia price hai", "credits kitne milte hain", "how do i scrape maps"), respond politely in their language with a direct, friendly 2-3 sentence answer.
3. STRICT OUT-OF-SCOPE & IRRELEVANT QUERY RULE:
   If a visitor asks about anything unrelated to LeadzMaker (e.g. medical advice, cars, gaming, sports, crypto, general homework, or meaningless chatter):
   Do NOT make up answers or engage. Politely respond with:
   "Mujhe aapki baat samajh nahi aayi kyunke yeh hamare tool (LeadzMaker) se related nahi lag rahi. Agar aapko koi inquiry karni ho ya mazeed maloomat chahiye toh please hamari official support team se support@leadzmaker.com par contact karain."
   (If English: "I'm here to assist specifically with the LeadzMaker lead generation platform. For other inquiries or further details, please reach out to our team at support@leadzmaker.com.")
4. HUMAN AGENT HANDOFF:
   If the visitor explicitly asks to talk to a human agent, real person, live support, or admin (e.g. "talk to human", "real person please", "insan se baat", "transfer to agent"), always append "[HANDOFF_REQUIRED]" at the very end of your reply.
5. Keep answers concise: 2 to 3 sentences maximum. Be polite, encouraging, and clear.`,
    outOfScopeReply: 'Mujhe aapki baat samajh nahi aayi kyunke yeh hamare tool (LeadzMaker) se related nahi lag rahi. Agar aapko koi inquiry karni ho ya mazeed maloomat chahiye toh please hamari official support team se support@leadzmaker.com par contact karain.'
  }
};

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = WEBSITES['leadzmaker'];

export function detectWebsiteSlugFromUrl(urlOrHostname?: string | null): string {
  return 'leadzmaker';
}

export function getWebsiteConfig(propertySlug?: string | null, urlOrHostname?: string | null): WebsiteConfig {
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
