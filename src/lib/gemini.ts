import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWebsiteConfig, decodeKey } from './websites-config';

const defaultApiKey = decodeKey('QUl6YVN5QWJRZUtnc3FEcGJRTUpDOXhGTnFXUm1DaTc3VmRaOVRr', 'GEMINI_API_KEY');

export function isHumanHandoffRequested(text: string): boolean {
  const clean = (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Direct explicit phrases (English, Urdu, Roman Urdu)
  const directPhrases = [
    'real person', 'real human', 'live agent', 'human agent', 'real agent',
    'not ai', 'stop ai', 'human please', 'agent please',
    'talk to human', 'talk to agent', 'speak to agent', 'connect to agent',
    'connect with real agent', 'connect with agent', 'speak to human',
    'talk to a person', 'talk to the real person', 'talk to a real person',
    'can i talk to the real person', 'can i talk to a real person', 'can i speak to a person',
    'real support', 'insan se baat', 'bande se baat', 'bndey sy baat', 'bnde se baat', 'bndy se baat',
    'real banda', 'real bndey', 'actual person', 'actual human', 'agent chahiye', 'insan chahiye',
    'human support', 'transfer to agent', 'transfer to human', 'connect with human',
    'agent se baat', 'live representative', 'customer service agent', 'representative'
  ];

  if (directPhrases.some(p => clean.includes(p))) return true;

  // 2. Action + Target keywords combination
  const humanKeywords = ['human', 'real agent', 'live agent', 'agent', 'person', 'someone', 'representative', 'rep', 'insan', 'banda', 'bnda', 'bndey'];
  const actionKeywords = ['talk', 'speak', 'connect', 'transfer', 'switch', 'reach', 'chat with', 'baat'];

  const hasAction = actionKeywords.some(a => clean.includes(a));
  const hasHuman = humanKeywords.some(h => clean.includes(h));
  return hasAction && hasHuman;
}

export function isGibberish(text: string): boolean {
  const clean = (text || '').trim().toLowerCase();
  if (clean.length < 4) return false;

  // 1. Repeated same character 4+ times in a row (e.g. "aaaaa", "zzzzzz")
  if (/(.)\1{4,}/.test(clean)) return true;

  // 2. Keyboard smash patterns
  const smashPatterns = ['asdfgh', 'sdfghj', 'dfghjk', 'qwerty', 'wertyu', 'ertyui', 'zxcvbn', 'xcvbnm', 'lkjhgf'];
  if (smashPatterns.some(p => clean.includes(p))) return true;

  // 3. Single long word >= 10 characters with very low vowel ratio or consecutive consonant clusters
  const words = clean.split(/\s+/);
  for (const w of words) {
    if (w.length >= 10 && !w.startsWith('http') && !w.includes('@')) {
      const lettersOnly = w.replace(/[^a-z]/g, '');
      if (lettersOnly.length >= 10) {
        const vowels = lettersOnly.match(/[aeiou]/g) || [];
        const vowelRatio = vowels.length / lettersOnly.length;
        if (vowelRatio < 0.22) return true;
        if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(lettersOnly)) return true;
      }
    }
  }

  return false;
}

function appendAgentHandoffNotice(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('real agent connect') || lower.includes('speak with a real agent') || lower.includes('real agent')) {
    return text;
  }

  const notice = '\n\nIf you would like to speak with a real agent, please let me know and I will connect you right away. Feel free to leave your message here and an agent will reply as soon as they are active.';

  return text.trim() + notice;
}

function sanitizeEmDashes(text: string): string {
  return text
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/,\s*,/g, ', ')
    .replace(/\s+,/g, ',');
}

export async function generateAIChatResponse({
  messages,
  visitorName,
  property = 'leadzmaker',
  hostname
}: {
  messages: { role: 'user' | 'model'; content: string }[];
  visitorName?: string;
  property?: string;
  hostname?: string;
}): Promise<{ text: string; handoffRequired: boolean }> {
  const siteConfig = getWebsiteConfig(property, hostname);
  const lastMsg = (messages[messages.length - 1]?.content || '').trim();
  const lower = lastMsg.toLowerCase();

  // 1. Check Strict Human Handoff Intent
  if (isHumanHandoffRequested(lastMsg)) {
    return {
      text: `Sure! I am connecting you with a live support agent from ${siteConfig.shortName || siteConfig.name} right now. Please hold on for a moment while an agent joins the chat!`,
      handoffRequired: true
    };
  }

  const rawName = (visitorName || '').trim();
  const cleanName = rawName && rawName.toLowerCase() !== 'visitor' && rawName.toLowerCase() !== 'you' ? rawName : null;

  // 2. Check for Gibberish / Keyboard Smashing (e.g. "aaaaa", "lkladjaldlawdhwlahd")
  if (isGibberish(lastMsg)) {
    const rawReply = cleanName
      ? `Hey ${cleanName}, I didn't quite catch that! Could you please let me know what questions you have about our services?`
      : `I didn't quite catch that! Could you please let me know what questions you have about our services?`;
    return {
      text: appendAgentHandoffNotice(rawReply),
      handoffRequired: false
    };
  }

  // 2. Greetings (expanded — catch "hey bro", "hello there", "salam", etc.)
  if (/^(hey|hi|hello|heyy|salam|aoa|hola|good morning|good afternoon|good evening|hey bro|hi there|hello there|heyy bro|what'?s up|sup|yo)(\s.*)?$/i.test(lower)) {
    return {
      text: cleanName ? `Hey ${cleanName}, how can i help you today ?` : 'Hey, how can i help you today ?',
      handoffRequired: false
    };
  }

  // 3. Status checks & quick acknowledgements
  if (/^(fine|good|great|doing good|doing well|i am good|i am fine|all good|thk|theek|alright|ok|okay)$/i.test(lower)) {
    return {
      text: appendAgentHandoffNotice(`Glad to hear that! How can I help you regarding our ${siteConfig.shortName} services or packages today?`),
      handoffRequired: false
    };
  }

  // 4. Quick appreciations / short affirmations
  if (/^(thanks|thank you|shukriya|thx|cool|nice|ok bro|alright bro|done|got it)$/i.test(lower)) {
    return {
      text: appendAgentHandoffNotice(`You're very welcome! Feel free to ask any other questions about ${siteConfig.name} or our live support.`),
      handoffRequired: false
    };
  }

  const systemPrompt = siteConfig.systemPrompt + (cleanName ? `\nThe visitor's name is "${cleanName}". Address them warmly by name when appropriate.` : '');
  
  // Valid active fast Gemini model names (verified 200 OK)
  const modelsToTry = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
  const keysToTry = [siteConfig.geminiApiKey, defaultApiKey].filter(Boolean);

  for (const key of keysToTry) {
    const aiClient = new GoogleGenerativeAI(key);

    for (const modelName of modelsToTry) {
      try {
        const model = aiClient.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.5
          }
        });

        // Slice to recent messages excluding the current prompt
        const conversationHistory = messages.slice(-7, -1).map(m => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }]
        }));

        // STRICT GEMINI REQUIREMENT: First content in history MUST be with role 'user'!
        while (conversationHistory.length > 0 && conversationHistory[0].role !== 'user') {
          conversationHistory.shift();
        }

        // STRICT GEMINI REQUIREMENT: Roles must alternate (user -> model -> user -> model)
        const cleanHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
        for (const item of conversationHistory) {
          if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === item.role) {
            cleanHistory[cleanHistory.length - 1].parts[0].text += '\n' + item.parts[0].text;
          } else {
            cleanHistory.push(item);
          }
        }

        const chat = model.startChat({
          history: cleanHistory
        });

        const result = await chat.sendMessage(lastMsg);
        const candidate = result.response.candidates?.[0];
        const parts = ((candidate?.content?.parts || []) as Array<{ text?: string; thought?: boolean }>);
        const nonThoughtParts = parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text);
        let rawText = (nonThoughtParts.length > 0 ? nonThoughtParts.join('') : result.response.text()).trim();

        // Strip any accidental checklist or self-check prefixes
        if (/^(2-3 sentences|Checklist|Self-check|\*|\-)\s+/i.test(rawText)) {
          const lines = rawText.split('\n');
          rawText = lines.filter(l => !/^(2-3 sentences|Checklist|Self-check|\*\s+Appended|\*\s+Yes|\-\s+Yes)/i.test(l.trim())).join('\n').trim();
        }

        const handoffRequired = rawText.includes('[HANDOFF_REQUIRED]') || isHumanHandoffRequested(lastMsg);
        let cleanText = rawText.replace('[HANDOFF_REQUIRED]', '').trim();
        cleanText = sanitizeEmDashes(cleanText);

        if (cleanText) {
          if (!handoffRequired) {
            cleanText = appendAgentHandoffNotice(cleanText);
          }
          return {
            text: cleanText,
            handoffRequired
          };
        }
      } catch (err: unknown) {
        const errMsg = (err as Error)?.message || '';
        console.warn(`Model ${modelName} with key ${key?.substring(0, 8)}... failed:`, errMsg);
        if (errMsg.includes('API_KEY_INVALID')) {
          break; // Try next key
        }
      }
    }
  }

  // Fallback: grounded answer without forcing handoff
  const fallback = sanitizeEmDashes(siteConfig.outOfScopeReply || 'I am here to assist specifically with the LeadzMaker lead generation platform. For other inquiries or further details, please reach out to our team at support@leadzmaker.com.');
  return {
    text: appendAgentHandoffNotice(fallback),
    handoffRequired: false
  };
}
