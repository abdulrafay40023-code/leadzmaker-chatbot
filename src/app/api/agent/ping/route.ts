import { NextRequest, NextResponse } from 'next/server';
import { granularStore, ADMIN_EMAILS } from '@/lib/store';

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

    return NextResponse.json({ success: true, agent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
