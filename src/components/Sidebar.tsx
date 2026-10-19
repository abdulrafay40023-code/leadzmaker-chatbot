'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Shield, Archive } from 'lucide-react';

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
  collapsed = false,
}) => {
  const pathname = usePathname();

  const hasUnread = unreadCount > 0;

  const navItems = [
    {
      name: 'Active Chats',
      href: '/dashboard/chats',
      icon: MessageSquare,
      badge: (unreadCount > 0 ? unreadCount : (chatCount > 0 ? chatCount : null)),
      badgeColor: 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 font-black animate-pulse',
      adminOnly: false
    },
    {
      name: 'Administration',
      href: '/dashboard/admin',
      icon: Shield,
      badge: pendingAgentsCount > 0 ? pendingAgentsCount : null,
      badgeColor: 'bg-brand-amber text-dark-bg animate-pulse',
      adminOnly: true
    },
    {
      name: 'All Chats Save Page',
      href: '/dashboard/saved-chats',
      icon: Archive,
      badge: null,
      adminOnly: false
    }
  ];

  // Working Agent Access: Working agents ONLY see Active Chats & All Chats Save Page
  const visibleItems = isAdmin 
    ? navItems 
    : [
        {
          name: 'Active Chats',
          href: '/dashboard/chats',
          icon: MessageSquare,
          badge: chatCount > 0 ? chatCount : null,
          badgeColor: 'bg-rose-500 text-white shadow-md shadow-rose-500/30 font-bold animate-pulse',
          adminOnly: false
        },
        {
          name: 'All Chats Save Page',
          href: '/dashboard/saved-chats',
          icon: Archive,
          badge: null,
          adminOnly: false
        }
      ];

  return (
    <aside className={`${collapsed ? 'w-14' : 'w-60'} bg-[#0a0f1d] border-r border-dark-border flex flex-col justify-between select-none shrink-0 h-full overflow-y-auto transition-all duration-200`}>
      <div>
        {/* Brand */}
        <div className={`h-14 flex items-center ${collapsed ? 'justify-center px-1' : 'space-x-3 px-5'} border-b border-dark-border`}>
          <div className="w-8 h-8 rounded-full bg-black border border-lime-500/40 flex items-center justify-center overflow-hidden shadow-lg shadow-lime-500/20 shrink-0">
            <img src="/lm-logo.png" alt="LeadzMaker" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-white tracking-tight truncate">LeadzMaker</h2>
              <p className="text-[10px] text-lime-400 font-semibold tracking-wide truncate">LiveChat & Support Hub</p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className={`p-2 space-y-1.5 ${collapsed ? 'flex flex-col items-center' : ''} mt-2`}>
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`flex items-center ${collapsed ? 'justify-center w-10 h-10 p-0' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-lime-500/15 text-lime-400 border border-lime-500/30 shadow-[0_0_15px_rgba(132,204,22,0.15)] font-bold'
                    : 'text-dark-muted hover:text-white hover:bg-dark-cardHover border border-transparent'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-lime-400' : 'text-dark-muted'}`} />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                {item.badge !== null && (
                  collapsed ? (
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${item.badgeColor}`} />
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className={`border-t border-dark-border/80 ${collapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
        {collapsed ? (
          <div title="System 100% Live: Real-Time WebSockets" className="p-2 flex justify-center items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-ping" />
          </div>
        ) : (
          <div className="bg-dark-card/60 border border-dark-border/60 rounded-xl p-3 flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
            <div>
              <div className="text-[11px] font-bold text-white">System 100% Live</div>
              <div className="text-[10px] text-dark-muted">Real-Time WebSockets</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
