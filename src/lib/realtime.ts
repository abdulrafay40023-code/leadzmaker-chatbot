const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hunccoihplbtitqdldjf.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bmNjb2locGxidGl0cWRsZGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgzNzk0OSwiZXhwIjoyMDg3NDEzOTQ5fQ.DoPjhpNUmGldBUH48jQCi9t2ndrmIuG46kOrpgc1u5g';

export const REALTIME_CHANNEL = 'leadzmaker-live-stream';

export async function broadcastRealtimeEvent(event: string, payload: unknown): Promise<void> {
  try {
    const res = await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            topic: REALTIME_CHANNEL,
            event,
            payload
          }
        ]
      })
    });
    if (!res.ok) {
      console.error('Supabase broadcast returned status:', res.status);
    }
  } catch (err) {
    console.error('Realtime broadcast error:', err);
  }
}
