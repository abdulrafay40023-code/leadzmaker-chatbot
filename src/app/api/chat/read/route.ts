import { NextRequest, NextResponse } from 'next/server';
import { granularStore } from '@/lib/store';
import { broadcastRealtimeEvent } from '@/lib/realtime';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, agentName } = await req.json();
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    const conv = await granularStore.getConversation(conversationId);
    if (conv) {
      const now = new Date().toISOString();
      conv.last_read_by_agent_at = now;
      await granularStore.saveConversation(conv);

      // Broadcast chat_read event across Realtime stream
      await broadcastRealtimeEvent('chat_read', {
        conversationId: conv.id,
        readAt: now,
        readerName: agentName || 'Agent'
      });
    }

    return NextResponse.json({ success: true, conversationId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
