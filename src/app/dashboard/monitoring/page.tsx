'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Globe } from 'lucide-react';
import { LiveVisitorTable } from '@/components/LiveVisitorTable';
import { useLiveSync } from '@/context/LiveSyncContext';

export default function MonitoringPage() {
  const router = useRouter();
  const { liveVisitors } = useLiveSync();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">LeadzMaker Live Visitor & IP Monitoring</h1>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-lime-500/15 text-lime-400 border border-lime-500/30 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping" />
              <span>Real-Time WebSockets</span>
            </span>
          </div>
          <p className="text-xs text-dark-muted mt-1">
            Real-time visitor tracking, geolocation flags & active IP analytics for <span className="text-white font-semibold">leadzmaker.com</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs text-dark-muted bg-dark-card border border-dark-border px-3.5 py-2 rounded-xl">
            <Globe className="w-4 h-4 text-lime-400" />
            <span>leadzmaker.com</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-dark-muted bg-dark-card border border-dark-border px-3.5 py-2 rounded-xl">
            <Users className="w-4 h-4 text-brand-secondary" />
            <span>Live Online: <strong className="text-lime-400 font-bold ml-1">{liveVisitors.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Live Visitor Table strictly for LeadzMaker */}
      <LiveVisitorTable
        visitors={liveVisitors}
        selectedWebsiteName="LeadzMaker"
        onInitiateChat={(visitor) => {
          router.push(`/dashboard/chats?visitor=${encodeURIComponent(visitor.id)}`);
        }}
      />
    </div>
  );
}
