import { NextRequest, NextResponse } from 'next/server';
import { granularStore, StoreVisitorSession } from '@/lib/store';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import { lookupGeoAsync } from '@/lib/geo';
import { parseUserAgent } from '@/lib/device';

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
    const { sessionId, visitorToken, currentPage, referrer, isNewPageView, propertySlug = 'leadzmaker' } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const cleanPath = normalizePagePath(currentPage);
    if (
      cleanPath.startsWith('/admin/livechat') ||
      cleanPath.startsWith('/admin') ||
      cleanPath.startsWith('/dashboard/chats') ||
      cleanPath.startsWith('/dashboard/monitoring')
    ) {
      return NextResponse.json({ success: true, isOnline: false }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    let session = await granularStore.getSession(sessionId);
    const nowIso = new Date().toISOString();

    if (session) {
      session.is_online = true;
      session.last_active_at = nowIso;
      if (cleanPath && cleanPath !== session.current_page) {
        session.current_page = cleanPath;
        await broadcastRealtimeEvent('visitor_navigation', { sessionId, currentPage: cleanPath });
      }
      if (isNewPageView) {
        granularStore.incrementPageView();
      }
      await granularStore.saveSession(session);
      return NextResponse.json({ success: true, isOnline: true, session }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Auto-recover session on cold start or expired session so live visitors immediately appear in Monitoring!
    let ip =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-client-ip') ||
      req.headers.get('x-forwarded-for') ||
      req.headers.get('fastly-client-ip') ||
      req.headers.get('true-client-ip') ||
      '';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    ip = ip.trim() || '127.0.0.1';

    const edgeCountryCode = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || undefined;
    const rawEdgeCity = req.headers.get('x-vercel-ip-city');
    const edgeCity = rawEdgeCity ? decodeURIComponent(rawEdgeCity) : undefined;
    const edgeRegion = req.headers.get('x-vercel-ip-country-region') || undefined;

    const geo = await lookupGeoAsync(ip, {
      countryCode: edgeCountryCode,
      city: edgeCity,
      region: edgeRegion
    });
    const dev = parseUserAgent(req.headers.get('user-agent') || '');

    const recoveredSession: StoreVisitorSession = {
      id: sessionId,
      visitor_token: visitorToken || sessionId,
      property_slug: propertySlug || 'leadzmaker',
      ip_address: ip,
      country: geo.country,
      country_code: geo.countryCode,
      city: geo.city,
      flag: geo.flag,
      referrer: referrer || 'Direct',
      current_page: cleanPath || '/',
      browser: dev.browser,
      os: dev.os,
      device: dev.device,
      is_online: true,
      visit_count: 1,
      last_active_at: nowIso,
      created_at: nowIso
    };

    await granularStore.saveSession(recoveredSession);
    await broadcastRealtimeEvent('visitor_arrival', {
      session: recoveredSession,
      propertySlug: propertySlug || 'leadzmaker',
      isNew: false,
      currentPage: cleanPath || '/'
    });

    return NextResponse.json({ success: true, isOnline: true, session: recoveredSession }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
