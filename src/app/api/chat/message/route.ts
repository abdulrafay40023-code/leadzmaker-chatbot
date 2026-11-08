import { NextRequest, NextResponse } from 'next/server';
import { granularStore, StoreMessage, StoreConversation, StoreVisitorSession, isStaffOrAdminAsync } from '@/lib/store';
import { broadcastRealtimeEvent } from '@/lib/realtime';
import { isHumanHandoffRequested, generateAIChatResponse } from '@/lib/gemini';
import { getWebsiteConfig, detectWebsiteSlugFromUrl } from '@/lib/websites-config';
import { lookupGeoAsync } from '@/lib/geo';
import { parseUserAgent } from '@/lib/device';

function normalizePagePath(rawPage?: string | null): string {
  if (!rawPage) return '/';
  const trimmed = rawPage.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed);
      return (u.pathname || '/') + (u.search || '');
    } catch {
      return '/';
    }
  }
  return trimmed.startsWith('/') ? trimmed : '/' + trimmed;
}

function normalizeReferrer(rawRef?: string | null): string {
  if (!rawRef) return 'Direct Visit';
  const r = rawRef.trim();
  if (!r || r.toLowerCase() === 'direct' || r.toLowerCase() === 'direct visit') return 'Direct Visit';
  try {
    const u = new URL(r);
    const h = u.hostname.toLowerCase().replace(/^www\./, '');
    if (h.includes('leadzmaker.com') || h.includes('leadzmaker-chatbot') || h === 'localhost') {
      return 'Direct Visit';
    }
    if (h.includes('google.')) return 'Google Search';
    if (h.includes('bing.')) return 'Bing Search';
    if (h.includes('facebook.') || h.includes('fb.')) return 'Facebook';
    if (h.includes('instagram.')) return 'Instagram';
    if (h.includes('linkedin.')) return 'LinkedIn';
    if (h.includes('youtube.') || h.includes('youtu.be')) return 'YouTube';
    return h;
  } catch {
    if (r.toLowerCase().includes('leadzmaker')) return 'Direct Visit';
    return r;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');
  const visitorToken = searchParams.get('visitorToken');
  const email = searchParams.get('email');

  if (visitorToken || email) {
    const list = await granularStore.getConversationsByVisitor(visitorToken || '', email || undefined);
    return NextResponse.json({
      conversations: list,
      count: list.length
    });
  }

  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId or visitorToken' }, { status: 400 });
  }

  const conv = await granularStore.getConversation(conversationId);
  return NextResponse.json({
    conversation: conv,
    messages: conv?.messages || []
  });
}

export async function POST(req: NextRequest) {
  try {
    const {
      id: clientMsgId,
      conversationId,
      visitorToken,
      propertySlug,
      pageUrl,
      referrerUrl,
      senderType,
      senderName,
      senderEmail,
      senderPhone,
      content,
      isWhisper = false,
      isHumanConnected = false,
      assignedAgentName
    } = await req.json();

    if (!content || !senderType) {
      return NextResponse.json({ error: 'Missing content or senderType' }, { status: 400 });
    }

    // Strict block: Agents and Admins cannot enter/chat as a client/visitor
    if (senderType === 'visitor' && await isStaffOrAdminAsync(senderEmail, senderName)) {
      return NextResponse.json({
        error: 'Agents and Admins cannot initiate chats as clients. Please use a visitor session to test.',
        isStaffBlocked: true
      }, { status: 403 });
    }

    const refererHeader = req.headers.get('referer');
    const effectiveSlug = (propertySlug && propertySlug !== 'leadzmaker')
      ? propertySlug
      : detectWebsiteSlugFromUrl(pageUrl || refererHeader);
    const siteConfig = getWebsiteConfig(effectiveSlug);

    const convId = conversationId || visitorToken || ('conv_' + Math.random().toString(36).substring(2, 9));
    const now = new Date().toISOString();

    // Resolve visitor's real IP, Geolocation, and Device when visitor sends a message or initializes chat
    let visitorSessionInfo: StoreVisitorSession | undefined;
    let visitorIp: string | undefined;

    if (senderType === 'visitor' || senderType === 'system') {
      let ip =
        req.headers.get('cf-connecting-ip') ||
        req.headers.get('x-real-ip') ||
        req.headers.get('x-client-ip') ||
        req.headers.get('x-forwarded-for') ||
        req.headers.get('fastly-client-ip') ||
        req.headers.get('true-client-ip') ||
        '';
      if (ip.includes(',')) ip = ip.split(',')[0].trim();
      ip = ip.trim();

      const edgeCountryCode = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || undefined;
      const rawEdgeCity = req.headers.get('x-vercel-ip-city');
      const edgeCity = rawEdgeCity ? decodeURIComponent(rawEdgeCity) : undefined;
      const edgeRegion = req.headers.get('x-vercel-ip-country-region') || undefined;

      const geo = await lookupGeoAsync(ip, {
        countryCode: edgeCountryCode,
        city: edgeCity,
        region: edgeRegion
      });
      const dev = parseUserAgent(req.headers.get('user-agent') || '');
      const cleanPath = normalizePagePath(pageUrl || refererHeader || '/');
      const cleanRef = normalizeReferrer(referrerUrl);

      const existingSess = visitorToken ? await granularStore.getSession(visitorToken) : null;
      visitorIp = ip || existingSess?.ip_address;

      visitorSessionInfo = {
        id: existingSess?.id || visitorToken || convId,
        visitor_token: visitorToken || convId,
        property_slug: effectiveSlug,
        ip_address: visitorIp || 'Unknown',
        country: geo.countryCode !== 'UN' ? geo.country : (existingSess?.country || geo.country),
        country_code: geo.countryCode !== 'UN' ? geo.countryCode : (existingSess?.country_code || geo.countryCode),
        city: (geo.city && geo.city !== 'Unknown') ? geo.city : (existingSess?.city || geo.city),
        flag: geo.countryCode !== 'UN' ? geo.flag : (existingSess?.flag || geo.flag),
        referrer: (cleanRef !== 'Direct Visit') ? cleanRef : (existingSess?.referrer || 'Direct Visit'),
        current_page: cleanPath || existingSess?.current_page || '/',
        browser: dev.browser || existingSess?.browser || 'Chrome',
        os: dev.os || existingSess?.os || 'Windows',
        device: dev.device || existingSess?.device || 'Desktop',
        is_online: true,
        visit_count: existingSess?.visit_count || 1,
        last_active_at: now,
        created_at: existingSess?.created_at || now
      };

      try {
        await granularStore.saveSession(visitorSessionInfo);
      } catch {}
    }

    let conv = await granularStore.getConversation(convId);

    // STRICT HUMAN CONVERSATION CHECK: If claimed, has agent, or agent ever replied, it is 100% HUMAN!
    const hasAgentAssigned = !!(conv?.assigned_agent_id || conv?.assigned_agent_name || assignedAgentName);
    const hasAgentMessages = (conv?.messages || []).some(m => m.sender_type === 'agent');
    const hasClaimSystemMsg = (conv?.messages || []).some(m => m.sender_type === 'system' && m.content.includes('claimed and joined'));
    const isHumanMode = conv?.mode === 'human' || isHumanConnected || hasAgentAssigned || hasAgentMessages || hasClaimSystemMsg;

    if (senderType === 'visitor' && senderEmail) {
      const cleanEmail = senderEmail.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
      }
    }

    if (!conv) {
      // Strict 2-chat limit per visitor to prevent spam & abuse
      if (senderEmail || visitorToken) {
        const existingList = await granularStore.getConversationsByVisitor(visitorToken || '', senderEmail || undefined);
        if (existingList.length >= 2) {
          return NextResponse.json({
            error: 'Maximum 2 conversations allowed per visitor.',
            limitReached: true
          }, { status: 400 });
        }
      }

      const initialVisitorName = (senderType === 'visitor' && senderName && senderName !== 'You')
        ? senderName
        : 'Visitor';

      conv = {
        id: convId,
        property_slug: effectiveSlug,
        visitor_id: visitorToken || convId,
        visitor_name: initialVisitorName,
        visitor_email: senderEmail || undefined,
        visitor_phone: senderPhone || undefined,
        visitor_ip: visitorIp,
        visitor: visitorSessionInfo,
        mode: isHumanMode ? 'human' : 'ai',
        status: isHumanMode ? (hasAgentAssigned ? 'active' : 'pending_agent') : 'active',
        assigned_agent_name: assignedAgentName || undefined,
        created_at: now,
        updated_at: now,
        messages: [
          {
            id: 'init-greet',
            conversation_id: convId,
            sender_type: 'ai',
            sender_name: `${siteConfig.shortName} AI Assistant`,
            content: 'Hey how can i help you ?',
            is_whisper: false,
            seq: 1,
            created_at: '1970-01-01T00:00:00.000Z'
          }
        ]
      };
    } else {
      if (!conv.property_slug || conv.property_slug === 'leadzmaker') {
        if (effectiveSlug && effectiveSlug !== 'leadzmaker') {
          conv.property_slug = effectiveSlug;
        }
      }
      if (isHumanMode) {
        conv.mode = 'human';
        if (assignedAgentName && !conv.assigned_agent_name) conv.assigned_agent_name = assignedAgentName;
        if (!conv.status) conv.status = hasAgentAssigned ? 'active' : 'pending_agent';
      }
      if (senderType === 'visitor' || senderType === 'system') {
        if (senderName && senderName !== 'Visitor' && senderName !== 'You' && senderName !== 'System') {
          conv.visitor_name = senderName;
        }
        if (senderEmail) conv.visitor_email = senderEmail;
        if (senderPhone) conv.visitor_phone = senderPhone;
        if (visitorIp) conv.visitor_ip = visitorIp;
        if (visitorSessionInfo) {
          conv.visitor = {
            ...(conv.visitor || {}),
            ...visitorSessionInfo
          };
        }
      }
    }

    const isFirstVisitorMsg = senderType === 'visitor' && (!conv.messages || conv.messages.filter(m => m.sender_type === 'visitor').length === 0);

    const maxSeq = (conv.messages || []).reduce((max, m) => Math.max(max, m.seq || 0), 0);
    const newMsg: StoreMessage = {
      id: clientMsgId || ('msg_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36)),
      conversation_id: conv.id,
      sender_type: senderType,
      sender_name: senderName || (senderType === 'visitor' ? 'Visitor' : 'Agent'),
      content: content,
      is_whisper: isWhisper,
      seq: maxSeq + 1,
      created_at: now
    };

    if (!conv.messages) conv.messages = [];
    const exists = conv.messages.some(m => m.id === newMsg.id);
    if (!exists) {
      conv.messages.push(newMsg);
    }
    conv.updated_at = now;
    conv.typing_preview = '';

    const isAlreadyHandledByHuman = isHumanMode || hasAgentAssigned || hasAgentMessages || hasClaimSystemMsg;
    const humanRequested = senderType === 'visitor' && isHumanHandoffRequested(content) && !isAlreadyHandledByHuman;

    // CASE 1: Visitor requested fresh human handoff (AI -> Human transition)
    if (humanRequested && !isAlreadyHandledByHuman) {
      conv.mode = 'human';
      conv.status = 'pending_agent';
      conv.last_visitor_message_at = now;

      const handoffSystemMsg: StoreMessage = {
        id: 'msg_sys_handoff_' + conv.id,
        conversation_id: conv.id,
        sender_type: 'system',
        sender_name: 'System',
        content: 'Transferring to a live support agent. Please hold on...',
        is_whisper: false,
        seq: newMsg.seq! + 1,
        created_at: new Date().toISOString()
      };
      
      conv.messages = conv.messages.filter(m => !(m.sender_type === 'system' && m.content.includes('Transferring to a live support agent')));
      conv.messages.push(handoffSystemMsg);

      await Promise.all([
        broadcastRealtimeEvent('chat_message', {
          conversationId: conv.id,
          message: newMsg,
          systemMessage: handoffSystemMsg,
          conversation: conv,
          isHandoffRequested: true
        }),
        broadcastRealtimeEvent('new_conversation', {
          conversationId: conv.id,
          conversation: conv
        }),
        granularStore.saveConversation(conv)
      ]);

      return NextResponse.json({
        success: true,
        message: newMsg,
        conversation: conv,
        conversationId: conv.id
      });
    }

    // CASE 2: AI Mode with Visitor message - Answer whenever no real human agent has claimed/replied!
    const isClaimedByRealAgent = hasAgentAssigned || hasAgentMessages || hasClaimSystemMsg;
    const shouldAiAnswer = !isClaimedByRealAgent && !humanRequested && senderType === 'visitor';

    if (shouldAiAnswer) {
      conv.mode = 'ai';
      conv.status = 'active';
      conv.last_visitor_message_at = now;

      // 1. Broadcast visitor message instantly in parallel with storage
      await Promise.all([
        broadcastRealtimeEvent('chat_message', {
          conversationId: conv.id,
          message: newMsg,
          conversation: conv,
          isHandoffRequested: false
        }),
        isFirstVisitorMsg ? broadcastRealtimeEvent('new_conversation', {
          conversationId: conv.id,
          conversation: conv
        }) : Promise.resolve(),
        granularStore.saveConversation(conv)
      ]);

      // 2. Generate AI response with visitor's country & currency eligibility context
      const historyForAI = conv.messages
        .filter(m => m.sender_type === 'visitor' || m.sender_type === 'ai')
        .map(m => ({
          role: (m.sender_type === 'visitor' ? 'user' : 'model') as 'user' | 'model',
          content: m.content
        }));

      const activeSlug = conv.property_slug || effectiveSlug || 'leadzmaker';
      const activeSiteConfig = getWebsiteConfig(activeSlug);

      const aiRes = await generateAIChatResponse({
        messages: historyForAI,
        visitorName: conv.visitor_name,
        visitorCountry: conv.visitor?.country,
        visitorCountryCode: conv.visitor?.country_code,
        property: activeSlug
      });

      // Reload fresh conversation state from store and ensure visitor message & metadata are preserved
      const freshConv = await granularStore.getConversation(conv.id) || conv;
      freshConv.visitor = conv.visitor || freshConv.visitor;
      freshConv.visitor_ip = conv.visitor_ip || freshConv.visitor_ip;
      freshConv.visitor_name = conv.visitor_name || freshConv.visitor_name;
      freshConv.visitor_email = conv.visitor_email || freshConv.visitor_email;
      if (!freshConv.messages) freshConv.messages = [];
      if (!freshConv.messages.some(m => m.id === newMsg.id)) {
        freshConv.messages.push(newMsg);
      }

      // If a real human agent claimed the chat while AI was computing, discard stale AI message
      if (freshConv.assigned_agent_id || freshConv.assigned_agent_name) {
        return NextResponse.json({
          success: true,
          message: newMsg,
          conversation: freshConv,
          conversationId: freshConv.id
        });
      }

      const aiMsgId = 'msg_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      const aiMsg: StoreMessage = {
        id: aiMsgId,
        conversation_id: freshConv.id,
        sender_type: 'ai',
        sender_name: `${activeSiteConfig.shortName} AI Assistant`,
        content: aiRes.text,
        is_whisper: false,
        seq: (freshConv.messages.length || 0) + 1,
        created_at: new Date().toISOString()
      };

      freshConv.messages.push(aiMsg);
      freshConv.updated_at = new Date().toISOString();
      if (aiRes.handoffRequired) {
        freshConv.mode = 'human';
        freshConv.status = 'pending_agent';
      }

      await Promise.all([
        broadcastRealtimeEvent('chat_message', {
          conversationId: freshConv.id,
          message: aiMsg,
          conversation: freshConv,
          isHandoffRequested: aiRes.handoffRequired
        }),
        granularStore.saveConversation(freshConv)
      ]);

      return NextResponse.json({
        success: true,
        message: newMsg,
        aiMessage: aiMsg,
        conversation: freshConv,
        conversationId: freshConv.id
      });
    }

    // CASE 3: Agent message or human mode visitor message
    let systemJoinMsg: StoreMessage | null = null;
    if (senderType === 'agent') {
      conv.last_agent_reply_at = now;
      conv.mode = 'human';
      conv.status = 'active';
      if (!conv.assigned_agent_name) {
        conv.assigned_agent_name = senderName || 'Real Agent';
      }

      // If transitioning to human or first agent reply, inject system notice
      const hasJoinMsg = (conv.messages || []).some(m => m.sender_type === 'system' && (
        m.content.includes('joined the conversation') || m.content.includes('claimed') || m.content.includes('Real Agent')
      ));
      if (!hasJoinMsg) {
        systemJoinMsg = {
          id: 'msg_sys_join_' + conv.id + '_' + Date.now(),
          conversation_id: conv.id,
          sender_type: 'system',
          sender_name: 'System',
          content: 'Real Agent has joined the conversation.',
          is_whisper: false,
          seq: maxSeq + 1,
          created_at: now
        };
        conv.messages.push(systemJoinMsg);
        newMsg.seq = maxSeq + 2;
      }
    } else {
      conv.last_visitor_message_at = now;
    }

    await Promise.all([
      broadcastRealtimeEvent('chat_message', {
        conversationId: conv.id,
        message: newMsg,
        systemMessage: systemJoinMsg,
        conversation: conv,
        isHandoffRequested: false
      }),
      isFirstVisitorMsg ? broadcastRealtimeEvent('new_conversation', {
        conversationId: conv.id,
        conversation: conv
      }) : Promise.resolve(),
      granularStore.saveConversation(conv)
    ]);

    return NextResponse.json({
      success: true,
      message: newMsg,
      conversation: conv,
      conversationId: conv.id
    });
  } catch (err: unknown) {
    console.error('[CHAT_DEBUG] Error in /api/chat/message:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    await granularStore.deleteConversation(conversationId);
    await broadcastRealtimeEvent('chat_deleted', { conversationId });

    return NextResponse.json({ success: true, conversationId });
  } catch (err: unknown) {
    console.error('[CHAT_DEBUG] Error in DELETE /api/chat/message:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
