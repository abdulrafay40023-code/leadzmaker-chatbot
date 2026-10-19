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

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

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
        if (adminEmails.includes(cleanEmail)) {
          const ssoAgent = {
            id: 'agent_abdulrafay_admin',
            email: cleanEmail,
            full_name: ssoName || 'Abdul Rafay',
            role: 'admin',
            status: 'approved'
          };
          localStorage.setItem('lm_agent_session', JSON.stringify(ssoAgent));
          setCurrentAgent(ssoAgent);
          return;
        }
      }
    } catch {}

    // Always start on clean Active Chats page with no chat auto-opened
    setSelectedChatId(null);
    try {
      localStorage.removeItem('lm_selected_chat_id');
      const rawSession = localStorage.getItem('lm_agent_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.email) {
          localStorage.removeItem(`lm_selected_chat_${parsed.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
        }
      }
    } catch {}
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
    <div className="h-full flex flex-col space-y-2 min-h-0">
      {/* Clean Single-Website Header */}
      <div className="flex items-center justify-between gap-2 shrink-0 py-1">
        <div className="flex items-center space-x-2">
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Active Live Chats</h1>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-lime-500/15 text-lime-400 border border-lime-500/30 flex items-center space-x-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
            <span>leadzmaker.com</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-dark-muted bg-dark-card border border-dark-border px-2.5 py-1 rounded-lg">
          <MessageSquare className="w-3.5 h-3.5 text-lime-400" />
          <span>Active: <strong className="text-white font-bold ml-0.5">{activeCount}</strong></span>
        </div>
      </div>

      {/* LiveChatConsole cleanly filling 100% of remaining space */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
