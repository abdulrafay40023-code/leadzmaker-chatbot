import { NextRequest, NextResponse } from 'next/server';
import { granularStore, StoreAgent, ADMIN_EMAILS } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isAllowedAdmin = ADMIN_EMAILS.includes(cleanEmail) || cleanEmail === 'abdulrafay40023@gmail.com' || cleanEmail === 'support@leadzmaker.com';

    if (!isAllowedAdmin) {
      return NextResponse.json({
        error: 'Access Denied: Only Abdul Rafay is authorized.',
        status: 'rejected'
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

    granularStore.agents.clear();
    granularStore.agents.set(adminAgent.email.toLowerCase(), adminAgent);

    return NextResponse.json({ success: true, agent: adminAgent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
