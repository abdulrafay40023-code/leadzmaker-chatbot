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
    <div className="w-full space-y-4 overflow-y-auto h-full pr-1">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Live Website Monitoring</h1>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time WebSockets</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time multi-website session tracking, geolocation flags &amp; active IP analytics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs text-gray-300 bg-[#0d1424] border border-dark-border px-3.5 py-2 rounded-xl">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>leadzmaker.com</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-300 bg-[#0d1424] border border-dark-border px-3.5 py-2 rounded-xl">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Live Online: <strong className="text-emerald-400 font-bold ml-1">{liveVisitors.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Live Visitor Table */}
      <LiveVisitorTable
        visitors={liveVisitors}
        selectedWebsiteName="All Websites"
        onInitiateChat={(visitor) => {
          router.push(`/dashboard/chats?visitor=${encodeURIComponent(visitor.visitor_token || visitor.id)}`);
        }}
      />
    </div>
  );
}
