import { NextRequest, NextResponse } from 'next/server';
import { memoryStore, granularStore, StoreAgent, ADMIN_EMAILS } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isAllowedAdmin = ADMIN_EMAILS.includes(cleanEmail) || cleanEmail === 'abdulrafay40023@gmail.com' || cleanEmail === 'support@leadzmaker.com';

    if (!isAllowedAdmin) {
      return NextResponse.json({
        error: 'Access restricted: Only Abdul Rafay (Administrator) is authorized to access LeadzMaker Support.',
        isBlocked: true
      }, { status: 403 });
    }

    const adminAgent: StoreAgent = {
      id: 'agent_abdulrafay_admin',
      email: 'abdulrafay40023@gmail.com',
      full_name: 'Abdul Rafay',
      phone: '+92 300 1234567',
      role: 'admin',
      status: 'approved',
      is_online: true,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    memoryStore.agents.clear();
    memoryStore.agents.set(adminAgent.email.toLowerCase(), adminAgent);
    await granularStore.saveAgent(adminAgent);

    return NextResponse.json({
      agent: adminAgent,
      status: 'approved',
      isAdmin: true
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
