'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, MessageSquare, Shield, Archive } from 'lucide-react';

interface SidebarProps {
  liveCount: number;
  chatCount: number;
  pendingAgentsCount: number;
  isAdmin?: boolean;
  unreadCount?: number;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  liveCount,
  chatCount,
  pendingAgentsCount,
  isAdmin = false,
  unreadCount = 0,
}) => {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Monitoring',
      href: '/dashboard/monitoring',
      icon: Radio,
      badge: liveCount > 0 ? liveCount : null,
      badgeColor: 'bg-emerald-500 text-[#070b14] font-black shadow-md shadow-emerald-500/40',
      adminOnly: false
    },
    {
      name: 'Active Chats',
      href: '/dashboard/chats',
      icon: MessageSquare,
      badge: (unreadCount > 0 ? unreadCount : (chatCount > 0 ? chatCount : null)),
      badgeColor: 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 font-black animate-pulse',
      adminOnly: false
    },
    {
      name: 'All Chats Save Page',
      href: '/dashboard/saved-chats',
      icon: Archive,
      badge: null,
      badgeColor: '',
      adminOnly: false
    },
    {
      name: 'Administration',
      href: '/dashboard/admin',
      icon: Shield,
      badge: pendingAgentsCount > 0 ? pendingAgentsCount : null,
      badgeColor: 'bg-brand-amber text-dark-bg animate-pulse',
      adminOnly: true
    }
  ];

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-60 bg-[#080d1a] border-r border-dark-border flex flex-col justify-between select-none shrink-0 h-full overflow-y-auto transition-all duration-200">
      <div>
        {/* Brand */}
        <div className="h-14 flex items-center space-x-3 px-5 border-b border-dark-border">
          <div className="w-8 h-8 rounded-full bg-black border border-lime-500/40 flex items-center justify-center overflow-hidden shadow-lg shadow-lime-500/20 shrink-0">
            <img src="/lm-logo.png" alt="LeadzMaker" className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">LeadzMaker</h2>
            <p className="text-[10px] text-lime-400 font-semibold tracking-wide truncate">LiveChat & Support Hub</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-2 mt-2">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-[#5850ec] to-[#6c63ff] text-white border border-white/60 shadow-[0_0_20px_rgba(99,102,241,0.45)] font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-[#11192e] border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-dark-border/80">
        <div className="bg-[#0e1526] border border-dark-border/80 rounded-2xl p-3.5 flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <div>
            <div className="text-xs font-bold text-white">System 100% Live</div>
            <div className="text-[11px] text-gray-400">Real-Time WebSockets</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
