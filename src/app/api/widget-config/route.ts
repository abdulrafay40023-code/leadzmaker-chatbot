import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertySlug = searchParams.get('property') || 'leadzmaker';

    // Fetch property settings from DB or default
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('slug', propertySlug)
      .maybeSingle();

    const config = property || {
      name: 'LeadzMaker',
      slug: 'leadzmaker',
      widget_color: '#84cc16',
      greeting_message: 'Hey how can i help you ?'
    };

    return NextResponse.json({ config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
