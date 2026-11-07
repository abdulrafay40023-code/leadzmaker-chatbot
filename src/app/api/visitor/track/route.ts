import { NextRequest, NextResponse } from 'next/server';
import { granularStore, StoreVisitorSession, isStaffOrAdminAsync } from '@/lib/store';
import { lookupGeoAsync } from '@/lib/geo';
import { parseUserAgent } from '@/lib/device';
import { broadcastRealtimeEvent } from '@/lib/realtime';

function normalizePagePath(rawPage?: string | null): string {
  if (!rawPage) return '/';
  const trimmed = rawPage.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed);
      return (u.pathname || '/') + (u.search || '');
    } catch {
      return '/';
    }
  }
  return trimmed.startsWith('/') ? trimmed : '/' + trimmed;
}

function normalizeReferrer(rawRef?: string | null): string {
  if (!rawRef) return 'Direct';
  const r = rawRef.trim();
  if (!r || r.toLowerCase() === 'direct' || r.toLowerCase() === 'direct visit') return 'Direct';
  try {
    const u = new URL(r);
    const h = u.hostname.toLowerCase().replace(/^www\./, '');
    if (h.includes('leadzmaker.com') || h.includes('leadzmaker-chatbot') || h === 'localhost') {
      return 'Direct';
    }
    if (h.includes('google.')) return 'Google';
    if (h.includes('bing.')) return 'Bing';
    if (h.includes('yahoo.')) return 'Yahoo';
    if (h.includes('facebook.') || h.includes('fb.')) return 'Facebook';
    if (h.includes('instagram.')) return 'Instagram';
    if (h.includes('linkedin.')) return 'LinkedIn';
    if (h.includes('youtube.') || h.includes('youtu.be')) return 'YouTube';
    if (h.includes('tiktok.')) return 'TikTok';
    if (h.includes('twitter.') || h.includes('x.com') || h === 't.co') return 'X (Twitter)';
    return h;
  } catch {
    if (r.toLowerCase().includes('leadzmaker')) return 'Direct';
    return r;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      visitorToken,
      propertySlug = 'leadzmaker',
      currentPage = '/',
      referrer = 'Direct',
      isNewPageView = false,
      visitorName,
      visitorEmail,
      visitorPhone
    } = body;

    // Strict block: Agents and Admins cannot enter/chat as a client/visitor
    if (await isStaffOrAdminAsync(visitorEmail, visitorName)) {
      return NextResponse.json({
        success: false,
        error: 'Agents and Admins cannot initiate chats as clients. Aapko as a client aana hoga.',
        isStaffBlocked: true
      }, { status: 403 });
    }

    const refererHeader = req.headers.get('referer') || '';
    const cleanPath = normalizePagePath(currentPage || refererHeader);

    // Ignore admin livechat console / dashboard self-traffic only
    const isAdminConsoleTraffic =
      cleanPath.startsWith('/admin/livechat') ||
      cleanPath.startsWith('/admin') ||
      cleanPath.startsWith('/dashboard/chats') ||
      cleanPath.startsWith('/dashboard/monitoring') ||
      cleanPath.startsWith('/dashboard/saved-chats') ||
      cleanPath.startsWith('/dashboard/admin') ||
      (currentPage && (currentPage.includes('salesflow-ai') || currentPage.includes('teals-livechat') || currentPage.includes('/admin/livechat')));

    if (isAdminConsoleTraffic) {
      return NextResponse.json({
        success: true,
        tracked: false,
        message: 'Admin console traffic ignored'
      }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const effectiveSlug = propertySlug || 'leadzmaker';
    const sid = sessionId || visitorToken || ('tab_' + Math.random().toString(36).substring(2, 10));
    const token = visitorToken || sid;

    // 1. Resolve real client IP with full CDN / Proxy header priority
    let ip =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-client-ip') ||
      req.headers.get('x-forwarded-for') ||
      req.headers.get('fastly-client-ip') ||
      req.headers.get('true-client-ip') ||
      '';

    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    ip = ip.trim();

    if (!ip || ip === '::1' || ip === '127.0.0.1') {
      ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      if (ip.includes(',')) ip = ip.split(',')[0].trim();
    }

    // 2. Extract edge geolocation hints provided directly by Vercel Edge / Cloudflare
    const edgeCountryCode = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || undefined;
    const rawEdgeCity = req.headers.get('x-vercel-ip-city');
    const edgeCity = rawEdgeCity ? decodeURIComponent(rawEdgeCity) : undefined;
    const edgeRegion = req.headers.get('x-vercel-ip-country-region') || undefined;

    // 3. Multi-tier Geo IP lookup
    const geo = await lookupGeoAsync(ip, {
      countryCode: edgeCountryCode,
      city: edgeCity,
      region: edgeRegion
    });

    const userAgent = req.headers.get('user-agent') || '';
    const dev = parseUserAgent(userAgent);
    const nowIso = new Date().toISOString();

    // Preserve original created_at and external referrer if session already exists
    const existingSession = await granularStore.getSession(sid);
    const cleanRef = normalizeReferrer(referrer);
    const finalRef = (cleanRef === 'Direct' && existingSession?.referrer && existingSession.referrer !== 'Direct')
      ? existingSession.referrer
      : cleanRef;

    const session: StoreVisitorSession = {
      id: sid,
      visitor_token: token,
      property_slug: effectiveSlug,
      ip_address: ip,
      country: geo.country,
      country_code: geo.countryCode,
      city: geo.city,
      flag: geo.flag,
      referrer: finalRef,
      current_page: cleanPath,
      browser: dev.browser,
      os: dev.os,
      device: dev.device,
      is_online: true,
      visit_count: existingSession?.visit_count || 1,
      last_active_at: nowIso,
      created_at: existingSession?.created_at || nowIso
    };

    if (isNewPageView) {
      granularStore.incrementPageView();
    }

    // Save session in memory/cloud
    await granularStore.saveSession(session);

    // Also attach visitor details to any existing conversation for this visitor
    let conv = await granularStore.getConversation(token);
    if (conv) {
      if (visitorName) conv.visitor_name = visitorName;
      if (visitorEmail) conv.visitor_email = visitorEmail;
      if (visitorPhone) (conv as any).visitor_phone = visitorPhone;
      conv.property_slug = effectiveSlug;
      conv.visitor_ip = ip;
      conv.visitor = session;
      conv.updated_at = nowIso;
      await granularStore.saveConversation(conv);
    }

    // Fetch authoritative unique analytics
    const activeData = await granularStore.getAllActiveData(effectiveSlug);

    // Broadcast instant arrival with authoritative counts
    await broadcastRealtimeEvent('visitor_arrival', {
      session,
      propertySlug: effectiveSlug,
      todayCount: activeData.todayVisitorsCount,
      totalUniqueCount: activeData.totalUniqueCount,
      isNew: !existingSession,
      currentPage: cleanPath
    });

    return new NextResponse(JSON.stringify({
      success: true,
      tracked: true,
      session,
      conversation: conv
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
