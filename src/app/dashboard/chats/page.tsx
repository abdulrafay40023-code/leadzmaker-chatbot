'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LiveChatConsole, ChatSession } from '@/components/LiveChatConsole';
import { useLiveSync } from '@/context/LiveSyncContext';
import { MessageSquare } from 'lucide-react';

export default function ActiveChatsPage() {
  const [currentAgent, setCurrentAgent] = useState<{
    id: string;
    email: string;
    full_name: string;
    role: string;
  } | null>(null);

  const getSelectedKey = (email?: string) => {
    if (!email) return 'lm_selected_chat_id';
    return `lm_selected_chat_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  };

  const [selectedChatId, setSelectedChatId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('lm_agent_session');
        const email = raw ? JSON.parse(raw)?.email : undefined;
        const key = getSelectedKey(email);
        return localStorage.getItem(key) || localStorage.getItem('lm_selected_chat_id') || null;
      } catch {}
    }
    return null;
  });

  const { conversations, refreshSync, markConversationAsRead } = useLiveSync();

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ssoEmail = urlParams.get('sso_email');
      const ssoName = urlParams.get('sso_name');
      const ssoRole = urlParams.get('sso_role');
      if (ssoEmail) {
        const adminEmails = ['abdulrafay40023@gmail.com', 'support@leadzmaker.com'];
        const cleanEmail = ssoEmail.toLowerCase().trim();
        const isAdm = ssoRole === 'admin' || adminEmails.includes(cleanEmail);
        const ssoAgent = {
          id: `agent_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
          email: cleanEmail,
          full_name: ssoName || cleanEmail.split('@')[0],
          role: isAdm ? 'admin' : (ssoRole || 'agent'),
          status: 'approved'
        };
        localStorage.setItem('lm_agent_session', JSON.stringify(ssoAgent));
        setCurrentAgent(ssoAgent);
        const key = getSelectedKey(cleanEmail);
        const saved = localStorage.getItem(key);
        if (saved) setSelectedChatId(saved);
        return;
      }
    } catch {}

    const rawSession = localStorage.getItem('lm_agent_session');
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession);
        setCurrentAgent(parsed);
        const key = getSelectedKey(parsed.email);
        const saved = localStorage.getItem(key);
        if (saved) setSelectedChatId(saved);
      } catch {}
    }
  }, []);

  const handleClaimSuccess = async () => {
    await refreshSync();
  };

  // Strictly LeadzMaker conversations with real visitor interaction
  const leadzmakerConversations = useMemo(() => {
    return conversations.filter(c => {
      const p = (c.property_slug || '').toLowerCase();
      return !p || p === 'leadzmaker' || p.includes('leadzmaker');
    });
  }, [conversations]);

  const activeCount = leadzmakerConversations.length;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Clean Single-Website Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">Active Live Chats</h1>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-lime-500/15 text-lime-400 border border-lime-500/30 flex items-center space-x-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
              <span>leadzmaker.com</span>
            </span>
          </div>
          <p className="text-xs text-dark-muted mt-1">
            Incoming visitor conversations & real-time human support operator console
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-dark-muted bg-dark-card border border-dark-border px-3.5 py-1.5 rounded-xl">
          <MessageSquare className="w-4 h-4 text-lime-400" />
          <span>Active Sessions: <strong className="text-white font-bold ml-1">{activeCount}</strong></span>
        </div>
      </div>

      {/* LiveChatConsole cleanly at the top */}
      <div className="flex-1 min-h-0">
        <LiveChatConsole
          currentAgent={currentAgent || { id: 'agent_abdulrafay_admin', full_name: 'Abdul Rafay', email: 'abdulrafay40023@gmail.com', role: 'admin' }}
          selectedChatId={selectedChatId}
          conversations={leadzmakerConversations as unknown as ChatSession[]}
          onSelectChat={(id) => {
            setSelectedChatId(id || null);
            const key = getSelectedKey(currentAgent?.email);
            if (id) {
              try {
                localStorage.setItem(key, id);
                localStorage.setItem('lm_selected_chat_id', id);
              } catch {}
              markConversationAsRead(id);
            } else {
              try {
                localStorage.removeItem(key);
                localStorage.removeItem('lm_selected_chat_id');
              } catch {}
            }
          }}
          onClaimSuccess={handleClaimSuccess}
          onMarkRead={markConversationAsRead}
        />
      </div>
    </div>
  );
}
