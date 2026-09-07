import { NextRequest, NextResponse } from 'next/server';
import { granularStore, StoreAgent } from '@/lib/store';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export async function GET() {
  try {
    const allAgents = await granularStore.getAllAgents();
    const pendingAgents = allAgents.filter(a => a.status === 'pending');
    const approvedAgents = allAgents.filter(a => a.status === 'approved');
    const onlineAgents = approvedAgents.filter(a => a.is_online);

    return NextResponse.json({
      pendingAgents,
      approvedAgents,
      onlineAgents,
      totalAgents: allAgents.length
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, action } = await req.json();

    const allAgents = await granularStore.getAllAgents();
    const targetAgent = allAgents.find(a => a.id === agentId || a.email.toLowerCase() === (agentId || '').toLowerCase());
    if (!targetAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (targetAgent.email.toLowerCase() === 'abdulrafay40023@gmail.com') {
      return NextResponse.json({ error: 'Master Admin (Abdul Rafay) cannot be removed or modified' }, { status: 400 });
    }

    if (action === 'approve') {
      targetAgent.status = 'approved';
      targetAgent.is_online = true;
      targetAgent.role = 'agent';
      await granularStore.saveAgent(targetAgent);

      broadcastRealtimeEvent('agent_approved', {
        agentId: targetAgent.id,
        agentEmail: targetAgent.email,
        agent: targetAgent
      }).catch(() => {});

      return NextResponse.json({ success: true, agent: targetAgent });
    }

    if (action === 'remove' || action === 'reject') {
      targetAgent.status = 'rejected';
      targetAgent.is_online = false;
      await granularStore.saveAgent(targetAgent);

      broadcastRealtimeEvent('agent_removed', {
        agentId: targetAgent.id,
        agentEmail: targetAgent.email
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `${targetAgent.full_name} removed from support team.`,
        agent: targetAgent
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
