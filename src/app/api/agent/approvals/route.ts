import { NextRequest, NextResponse } from 'next/server';
import { granularStore, StoreAgent } from '@/lib/store';

export async function GET() {
  try {
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

    return NextResponse.json({
      pendingAgents: [],
      approvedAgents: [adminAgent],
      onlineAgents: [adminAgent],
      totalAgents: 1
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'System is restricted strictly to Abdul Rafay (Sole Administrator).'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
