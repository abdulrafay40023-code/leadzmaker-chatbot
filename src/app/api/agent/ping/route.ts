import { NextRequest, NextResponse } from 'next/server';
import { granularStore, ADMIN_EMAILS } from '@/lib/store';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.includes(cleanEmail) || cleanEmail === 'abdulrafay40023@gmail.com' || cleanEmail === 'support@leadzmaker.com';

    if (isAdmin) {
      const admin = await granularStore.getAgent(cleanEmail);
      if (admin) {
        admin.is_online = true;
        admin.last_seen_at = new Date().toISOString();
        await granularStore.saveAgent(admin);
      }
      return NextResponse.json({ success: true, isOnline: true });
    }

    const agent = await granularStore.getAgent(cleanEmail);
    if (!agent || agent.status !== 'approved') {
      return NextResponse.json({
        error: 'Access revoked or pending approval',
        status: agent?.status || 'pending'
      }, { status: 403 });
    }

    agent.is_online = true;
    agent.last_seen_at = new Date().toISOString();
    await granularStore.saveAgent(agent);

    try {
      const country = req.headers.get('x-vercel-ip-country');
      const ipAddr = req.headers.get('x-forwarded-for')?.split(',')[0].trim();
      const updates: Record<string, any> = { last_seen: new Date().toISOString() };
      if (country) updates.country_code = country;
      if (ipAddr) updates.ip_address = ipAddr;
      await supabaseAdmin.from('profiles').update(updates).eq('email', cleanEmail);
    } catch {}

    return NextResponse.json({ success: true, agent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
