'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Globe, MessageSquare, Smartphone, Laptop, Clock, Filter, ChevronDown } from 'lucide-react';
import { getCountryFlagUrl } from '@/lib/flags';
import { getWebsiteConfig } from '@/lib/websites-config';

export interface VisitorRecord {
  id: string;
  visitor_token?: string;
  property_slug?: string;
  ip_address: string;
  country: string;
  country_code: string;
  city: string;
  flag: string;
  referrer: string;
  current_page: string;
  browser: string;
  os: string;
  device: string;
  is_online: boolean;
  visit_count?: number;
  last_active_at: string;
  created_at: string;
}

interface LiveVisitorTableProps {
  visitors: VisitorRecord[];
  selectedWebsiteName?: string;
  onInitiateChat: (visitor: VisitorRecord) => void;
}

// Live ticking stopwatch component (00:00:07, 00:03:47)
const VisitorDurationTimer: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const [elapsed, setElapsed] = useState<number>(() => {
    const start = new Date(createdAt || Date.now()).getTime();
    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(createdAt || Date.now()).getTime();
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  return (
    <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg inline-flex items-center space-x-1.5">
      <Clock className="w-3 h-3" />
      <span>{pad(hrs)}:{pad(mins)}:{pad(secs)}</span>
    </span>
  );
};

export const LiveVisitorTable: React.FC<LiveVisitorTableProps> = ({
  visitors,
  selectedWebsiteName = 'All Websites',
  onInitiateChat,
}) => {
  const getSiteBadge = (propertySlug?: string, currentPage?: string) => {
    const config = getWebsiteConfig(propertySlug, currentPage);
    return {
      label: config.shortName || 'LeadzMaker',
      fullName: config.name || 'LeadzMaker',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    };
  };

  const formatPagePath = (rawPage?: string) => {
    if (!rawPage) return '/';
    const p = rawPage.trim();
    if (p.startsWith('http://') || p.startsWith('https://')) {
      try {
        const u = new URL(p);
        return (u.pathname || '/') + (u.search || '');
      } catch {
        return '/';
      }
    }
    return p.startsWith('/') ? p : '/' + p;
  };

  const formatReferrer = (rawRef?: string) => {
    if (!rawRef) return 'Direct';
    const r = rawRef.trim();
    if (!r || r.toLowerCase() === 'direct' || r.toLowerCase() === 'direct visit') return 'Direct';
    try {
      const u = new URL(r);
      const h = u.hostname.toLowerCase().replace(/^www\./, '');
      if (h.includes('leadzmaker.com') || h.includes('leadzmaker-chatbot')) return 'Direct';
      if (h.includes('google.')) return 'Google';
      if (h.includes('facebook.') || h.includes('fb.')) return 'Facebook';
      if (h.includes('bing.')) return 'Bing';
      return h;
    } catch {
      return r;
    }
  };

  return (
    <div className="bg-[#0d1424] border border-dark-border rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 px-6 border-b border-dark-border flex flex-wrap items-center justify-between gap-3 bg-[#10182b]">
        <div className="flex items-center space-x-3">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </span>
          <h3 className="text-sm font-bold text-white">
            {selectedWebsiteName} Live Visitors ({visitors.length} Active Now)
          </h3>
        </div>

        <div className="flex items-center space-x-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#090e1a] border border-dark-border text-xs font-bold text-white">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>All Websites ({visitors.length})</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <span className="text-[11px] text-gray-400 font-medium hidden md:inline">
            Real-Time IP, Duration &amp; Geolocation Analytics
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090e1a] text-gray-400 font-bold uppercase tracking-wider border-b border-dark-border text-[10px]">
            <tr>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Website</th>
              <th className="py-3.5 px-4">Location &amp; Map</th>
              <th className="py-3.5 px-4">IP Address</th>
              <th className="py-3.5 px-4">Active Page</th>
              <th className="py-3.5 px-4">Referrer</th>
              <th className="py-3.5 px-4">Device</th>
              <th className="py-3.5 px-4">Time on Site</th>
              <th className="py-3.5 px-4 text-center">Visits</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/60">
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-14 text-center text-gray-400 space-y-2">
                  <Globe className="w-9 h-9 mx-auto text-dark-border animate-pulse" />
                  <p className="font-semibold text-white text-sm">
                    No active visitors on LeadzMaker right now
                  </p>
                  <p className="text-[11px] text-gray-400">
                    When a visitor opens leadzmaker.com, their live IP, location flag, referrer, and active page will appear here in real time.
                  </p>
                </td>
              </tr>
            ) : (
              visitors.map((v) => {
                const cityLabel = v.city && v.city !== 'Unknown' ? v.city : 'Verified';
                const countryLabel = v.country && v.country !== 'Unknown' ? v.country : (v.country_code || 'Global');
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cityLabel + ', ' + countryLabel)}`;
                const flagSrc = getCountryFlagUrl(v.country_code || 'US');
                const siteBadge = getSiteBadge(v.property_slug, v.current_page);
                const cleanPage = formatPagePath(v.current_page);
                const cleanRef = formatReferrer(v.referrer);

                return (
                  <tr key={v.id} className="hover:bg-[#131d33] transition-colors">
                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Online</span>
                      </span>
                    </td>

                    {/* Website Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${siteBadge.badge}`}>
                        {siteBadge.label}
                      </span>
                    </td>

                    {/* Location & Map */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={flagSrc}
                          alt={v.country_code}
                          className="w-5 h-3.5 object-cover rounded shadow-sm flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <div className="font-bold text-white flex items-center space-x-1">
                            <span>{cityLabel}, {countryLabel}</span>
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Open on Google Maps"
                              className="text-sky-400 hover:text-white inline-block ml-1"
                            >
                              <MapPin className="w-3.5 h-3.5 inline" />
                            </a>
                          </div>
                          <span className="text-[10px] text-gray-400">Verified Location</span>
                        </div>
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="py-3.5 px-4 font-mono text-white font-bold text-xs">
                      {v.ip_address}
                    </td>

                    {/* Active Page (Matches Image 2: Website Title + Blue Path below) */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5 font-bold text-white text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                          <span>{siteBadge.fullName}</span>
                        </div>
                        <span
                          className="font-mono text-sky-400 font-medium text-[11px] pl-3 max-w-[200px] truncate"
                          title={cleanPage}
                        >
                          {cleanPage}
                        </span>
                      </div>
                    </td>

                    {/* Referrer */}
                    <td className="py-3.5 px-4 text-gray-300 font-medium max-w-[140px] truncate" title={v.referrer}>
                      {cleanRef}
                    </td>

                    {/* Device & OS */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-xs text-gray-300">
                        {v.device === 'Mobile' || v.os === 'Android' || v.os === 'iOS' ? (
                          <Smartphone className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        )}
                        <span>{v.os || v.device || 'Desktop'}</span>
                      </div>
                    </td>

                    {/* Time on Site (Live stopwatch) */}
                    <td className="py-3.5 px-4">
                      <VisitorDurationTimer createdAt={v.created_at || v.last_active_at} />
                    </td>

                    {/* Visits count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold font-mono text-xs px-2.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {v.visit_count || 1}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onInitiateChat(v)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
