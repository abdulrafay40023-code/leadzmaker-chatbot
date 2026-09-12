'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { EmbedCodeModal } from '@/components/EmbedCodeModal';
import { ApprovalBanner, PendingAgent } from '@/components/ApprovalBanner';
import { supabase } from '@/lib/supabase';
import { LiveSyncProvider, useLiveSync } from '@/context/LiveSyncContext';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentAgent, setCurrentAgent] = useState<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    phone?: string;
  } | null>(null);

  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [pendingAgentsCount, setPendingAgentsCount] = useState(0);
  const prevPendingCountRef = React.useRef<number | null>(null);

  const { liveCount, chatCount, unreadConversationsCount, conversations, soundEnabled, toggleSound, unreadCount, resetUnreadCount } = useLiveSync();

  useEffect(() => {
    // 1. Auto Single Sign-On (SSO) when embedded inside CRM
    if (typeof window !== 'undefined') {
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
        } else {
          router.push('/login');
          return;
        }
      }
    }

    const rawSession = localStorage.getItem('lm_agent_session');
    if (!rawSession) {
      router.push('/login');
      return;
    }
    try {
      const agent = JSON.parse(rawSession);
      const adminEmails = ['abdulrafay40023@gmail.com', 'support@leadzmaker.com'];
      const isAdm = agent.role === 'admin' || (agent.email && adminEmails.includes(agent.email.toLowerCase()));

      if (agent.status !== 'approved' && !isAdm) {
        localStorage.removeItem('lm_agent_session');
        router.push('/login');
        return;
      }
      setCurrentAgent(agent);

      const verifyAndPing = () => {
        fetch('/api/agent/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: agent.email,
            status: 'online'
          })
        }).then(res => {
          if (res.status === 403) {
            localStorage.removeItem('lm_agent_session');
            router.push('/login');
          }
        }).catch(() => {});
      };

      verifyAndPing();
      const pingTimer = setInterval(verifyAndPing, 10000);

      // Realtime listener: if admin removes this agent, immediately evict
      const channel = supabase.channel('leadzmaker-agent-auth-monitor', {
        config: { broadcast: { self: true } }
      });
      channel.on('broadcast', { event: 'agent_removed' }, (payload: { payload?: { agentEmail?: string }; agentEmail?: string }) => {
        const raw = payload?.payload || payload;
        const removedEmail = raw?.agentEmail;
        if (removedEmail && agent.email && removedEmail.toLowerCase() === agent.email.toLowerCase()) {
          localStorage.removeItem('lm_agent_session');
          router.push('/login');
        }
      }).subscribe();

      return () => {
        clearInterval(pingTimer);
        supabase.removeChannel(channel);
      };
    } catch {
      localStorage.removeItem('lm_agent_session');
      router.push('/login');
    }
  }, [router]);

  const adminEmails = ['abdulrafay40023@gmail.com', 'support@leadzmaker.com'];
  const isAdmin = currentAgent?.role === 'admin' || (currentAgent?.email && adminEmails.includes(currentAgent.email.toLowerCase()));

  useEffect(() => {
    if (!isAdmin || pathname === '/dashboard/admin') return;

    const fetchApprovals = async () => {
      try {
        const appRes = await fetch('/api/agent/approvals');
        if (appRes.ok) {
          const appData = await appRes.json();
          const list: PendingAgent[] = Array.isArray(appData.pendingAgents) ? appData.pendingAgents : [];
          setPendingAgents(list);
          setPendingAgentsCount(list.length);

          if (prevPendingCountRef.current !== null && list.length > prevPendingCountRef.current) {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('New Agent Approval Request', {
                body: `You have ${list.length} pending agent registration(s) waiting for approval!`,
                icon: '/favicon.ico'
              });
            }
          }
          prevPendingCountRef.current = list.length;
        }
      } catch {}
    };
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 2000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleApproveAgent = async (agentId: string) => {
    setPendingAgents(prev => prev.filter(a => a.id !== agentId));
    setPendingAgentsCount(prev => Math.max(0, prev - 1));
    try {
      const res = await fetch('/api/agent/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action: 'approve' })
      });
      if (!res.ok) {
        const appRes = await fetch('/api/agent/approvals');
        if (appRes.ok) {
          const appData = await appRes.json();
          const list: PendingAgent[] = Array.isArray(appData.pendingAgents) ? appData.pendingAgents : [];
          setPendingAgents(list);
          setPendingAgentsCount(list.length);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectAgent = async (agentId: string) => {
    setPendingAgents(prev => prev.filter(a => a.id !== agentId));
    setPendingAgentsCount(prev => Math.max(0, prev - 1));
    try {
      const res = await fetch('/api/agent/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action: 'reject' })
      });
      if (!res.ok) {
        const appRes = await fetch('/api/agent/approvals');
        if (appRes.ok) {
          const appData = await appRes.json();
          const list: PendingAgent[] = Array.isArray(appData.pendingAgents) ? appData.pendingAgents : [];
          setPendingAgents(list);
          setPendingAgentsCount(list.length);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('lm_agent_session');
    router.push('/login');
  };

  if (!currentAgent) return null;

  return (
    <div className="flex h-screen bg-[#070b14] text-dark-text overflow-hidden">
      <Sidebar
        liveCount={liveCount}
        chatCount={unreadConversationsCount}
        pendingAgentsCount={pendingAgentsCount}
        isAdmin={isAdmin}
        unreadCount={isAdmin ? unreadCount : 0}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentAgent={currentAgent}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onOpenEmbedModal={() => setIsEmbedModalOpen(true)}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {isAdmin && pendingAgents.length > 0 && pathname !== '/dashboard/admin' && (
            <ApprovalBanner
              pendingAgents={pendingAgents}
              onApprove={handleApproveAgent}
              onReject={handleRejectAgent}
            />
          )}
          {children}
        </main>
      </div>

      <EmbedCodeModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        propertySlug="leadzmaker"
      />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LiveSyncProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </LiveSyncProvider>
  );
}
