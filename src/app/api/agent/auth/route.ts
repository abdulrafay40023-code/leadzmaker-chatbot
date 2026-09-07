import { NextRequest, NextResponse } from 'next/server';
import { memoryStore, granularStore, StoreAgent, ADMIN_EMAILS } from '@/lib/store';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, phone, action } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.includes(cleanEmail) || cleanEmail === 'abdulrafay40023@gmail.com' || cleanEmail === 'support@leadzmaker.com';

    // Blacklisted legacy users
    const BLOCKED_EMAILS = [
      'garryamelia6265@gmail.com',
      'tzafar04@gmail.com',
      'annusraees@gmail.com',
      'hsalon680@gmail.com',
      'hsalon580@gmail.com'
    ];
    if (BLOCKED_EMAILS.includes(cleanEmail)) {
      return NextResponse.json({
        error: 'Access denied: Account permanently removed.',
        isBlocked: true
      }, { status: 403 });
    }

    // 1. Sole Master Admin: Abdul Rafay is always instant approved as Admin
    if (isAdmin) {
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

      memoryStore.agents.set(cleanEmail, adminAgent);
      await granularStore.saveAgent(adminAgent);

      return NextResponse.json({
        agent: adminAgent,
        status: 'approved',
        isAdmin: true
      });
    }

    // 2. Invited Agents: must submit profile and require Admin approval
    let agent = await granularStore.getAgent(cleanEmail);

    if (action === 'complete_profile') {
      if (!fullName || !phone) {
        return NextResponse.json({ error: 'Full name and phone required' }, { status: 400 });
      }

      const newAgent: StoreAgent = {
        id: 'agent_' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: 'agent', // Strictly agent!
        status: 'pending', // Awaiting Abdul Rafay's approval!
        is_online: false,
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      memoryStore.agents.set(cleanEmail, newAgent);
      await granularStore.saveAgent(newAgent);

      // Notify Abdul Rafay in Realtime
      broadcastRealtimeEvent('agent_pending_approval', {
        agentName: newAgent.full_name,
        agentEmail: newAgent.email,
        agentPhone: newAgent.phone
      }).catch(() => {});

      return NextResponse.json({
        agent: newAgent,
        status: 'pending',
        isAdmin: false
      });
    }

    if (!agent) {
      return NextResponse.json({
        status: 'needs_profile',
        email: cleanEmail
      });
    }

    // If agent is pending or rejected, they cannot enter
    if (agent.status !== 'approved') {
      return NextResponse.json({
        agent,
        status: agent.status,
        isAdmin: false
      });
    }

    // Approved by Abdul Rafay: allow entry as Working Agent
    agent.is_online = true;
    agent.last_seen_at = new Date().toISOString();
    await granularStore.saveAgent(agent);

    return NextResponse.json({
      agent,
      status: 'approved',
      isAdmin: false
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
