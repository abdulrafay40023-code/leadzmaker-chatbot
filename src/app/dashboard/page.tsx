'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, MessageSquare, Eye, Radio, ArrowRight, RotateCcw,
  ExternalLink, Globe, Activity, Shield, Archive, Sparkles, CheckCircle2
} from 'lucide-react';
import { useLiveSync } from '@/context/LiveSyncContext';

export default function OverviewDashboard() {
  const router = useRouter();
  const {
    liveVisitors,
    conversations,
    liveCount,
    todayCount,
    totalUniqueCount,
    chatCount,
    resetAll
  } = useLiveSync();

  const [resetting, setResetting] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<{
    id: string;
    email: string;
    full_name: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    try {
      const rawSession = localStorage.getItem('lm_agent_session') || localStorage.getItem('teals_agent_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        setCurrentAgent(parsed);
        const adminEmails = ['abdulrafay40023@gmail.com', 'support@leadzmaker.com'];
        const isAdm = parsed.role === 'admin' || (parsed.email && adminEmails.includes(parsed.email.toLowerCase()));
        if (!isAdm) {
          router.push('/dashboard/chats');
        }
      }
    } catch {}
  }, [router]);

  const adminEmails = ['abdulrafay40023@gmail.com', 'support@leadzmaker.com'];
  const isAdmin = !currentAgent || currentAgent.role === 'admin' || (currentAgent.email && adminEmails.includes(currentAgent.email.toLowerCase()));

  const getTodayDayName = () => {
    try {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' }).format(new Date());
    } catch {
      return 'Today';
    }
  };

  const dayName = getTodayDayName();

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetAll();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">LeadzMaker Live Support Hub</h2>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-lime-500/15 text-lime-400 border border-lime-500/30 flex items-center space-x-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              <span>leadzmaker.com</span>
            </span>
          </div>
          <p className="text-xs text-dark-muted mt-1">
            Real-time visitor tracking, active chat inquiries, audio claim beeps & Gemini AI statistics
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleReset}
            disabled={resetting}
            title="Reset all counters to 0"
            className="px-3.5 py-2 rounded-xl bg-dark-card hover:bg-dark-cardHover border border-dark-border text-dark-muted hover:text-white text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-lime-400' : ''}`} />
            <span>Reset to 0</span>
          </button>
          <Link
            href="/dashboard/monitoring"
            className="px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-black text-xs font-bold transition-all flex items-center space-x-2 w-fit shadow-[0_0_15px_rgba(132,204,22,0.3)]"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Open Live Monitoring</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Live Visitors */}
        <div className="bg-[#0e1628] border border-lime-500/30 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-lime-500/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-dark-muted uppercase tracking-wider">Live Traffic</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500" />
            </span>
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {liveCount}
          </div>
          <p className="text-[11px] text-lime-400 font-medium mt-1 flex items-center gap-1">
            <span>●</span> Active on leadzmaker.com
          </p>
        </div>

        {/* Metric 2: Today's Visitors */}
        <div className="bg-[#0e1628] border border-dark-border rounded-2xl p-5 shadow-sm hover:border-dark-border/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-dark-muted uppercase tracking-wider">Today&apos;s Visitors</span>
            <Users className="w-4 h-4 text-dark-muted" />
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {todayCount}
          </div>
          <p className="text-[11px] text-dark-muted font-medium mt-1">
            Unique visits today ({dayName})
          </p>
        </div>

        {/* Metric 3: Total Unique */}
        <div className="bg-[#0e1628] border border-dark-border rounded-2xl p-5 shadow-sm hover:border-dark-border/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-dark-muted uppercase tracking-wider">Total Unique</span>
            <Eye className="w-4 h-4 text-dark-muted" />
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {totalUniqueCount}
          </div>
          <p className="text-[11px] text-dark-muted font-medium mt-1">
            Unique browser sessions
          </p>
        </div>

        {/* Metric 4: Active Inquiries & Chats */}
        <div className="bg-[#0e1628] border border-dark-border rounded-2xl p-5 shadow-sm hover:border-dark-border/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-dark-muted uppercase tracking-wider">Active Inquiries</span>
            <MessageSquare className="w-4 h-4 text-lime-400" />
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {chatCount}
          </div>
          <p className="text-[11px] text-lime-400 font-medium mt-1">
            Live conversations
          </p>
        </div>
      </div>

      {/* Main Console Hub & Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: LeadzMaker Platform Hub (2 cols) */}
        <div className="lg:col-span-2 bg-[#0e1628] border border-dark-border rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-black border border-lime-500/40 flex items-center justify-center overflow-hidden shadow-lg shadow-lime-500/20 shrink-0">
                <img src="/lm-logo.png" alt="LeadzMaker" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>LeadzMaker AI Live Support Console</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/15 text-lime-400 border border-lime-500/30 font-bold uppercase tracking-wider">
                    Dedicated Suite
                  </span>
                </h3>
                <a
                  href="https://leadzmaker.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-lime-400 hover:text-lime-300 hover:underline flex items-center space-x-1 mt-0.5 transition-colors"
                >
                  <span>leadzmaker.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <Link
              href="/dashboard/chats"
              className="px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-black text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
            >
              <span>Open Chats</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-[#0a0f1d] border border-dark-border/80 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Sparkles className="w-4 h-4 text-lime-400" />
                <span>Gemini 1.5 Flash AI Assistant</span>
              </div>
              <p className="text-[11px] text-dark-muted leading-relaxed">
                Trained specifically on Google Maps scraper, businesses without website, bulk emails, and pricing.
              </p>
            </div>

            <div className="bg-[#0a0f1d] border border-dark-border/80 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-lime-400" />
                <span>Out-Of-Scope Guardrail</span>
              </div>
              <p className="text-[11px] text-dark-muted leading-relaxed">
                Automatically redirects irrelevant queries to <span className="text-lime-400">support@leadzmaker.com</span>.
              </p>
            </div>

            <div className="bg-[#0a0f1d] border border-dark-border/80 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Radio className="w-4 h-4 text-lime-400" />
                <span>Continuous Audio Claim Beep</span>
              </div>
              <p className="text-[11px] text-dark-muted leading-relaxed">
                Repeats audio notification whenever a visitor requests human support until an agent claims.
              </p>
            </div>

            <div className="bg-[#0a0f1d] border border-dark-border/80 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Archive className="w-4 h-4 text-lime-400" />
                <span>Dedicated Supabase Storage</span>
              </div>
              <p className="text-[11px] text-dark-muted leading-relaxed">
                Secure bucket <span className="text-lime-400">leadzmaker-live-store</span> stores all transcripts.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Fast Navigation Actions */}
        <div className="bg-[#0e1628] border border-dark-border rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-lime-400" />
              <span>Quick Navigation</span>
            </h4>
            <p className="text-xs text-dark-muted mt-1">
              Direct access to live operator consoles
            </p>

            <div className="space-y-2.5 mt-4">
              <Link
                href="/dashboard/monitoring"
                className="w-full p-3 rounded-xl bg-[#0a0f1d] hover:bg-[#111a30] border border-dark-border hover:border-lime-500/40 text-xs font-semibold text-white flex items-center justify-between transition-all group"
              >
                <div className="flex items-center space-x-2.5">
                  <Radio className="w-4 h-4 text-lime-400 group-hover:scale-110 transition-transform" />
                  <span>Real-Time Visitor Monitor</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-dark-muted group-hover:translate-x-1 group-hover:text-lime-400 transition-all" />
              </Link>

              <Link
                href="/dashboard/chats"
                className="w-full p-3 rounded-xl bg-[#0a0f1d] hover:bg-[#111a30] border border-dark-border hover:border-lime-500/40 text-xs font-semibold text-white flex items-center justify-between transition-all group"
              >
                <div className="flex items-center space-x-2.5">
                  <MessageSquare className="w-4 h-4 text-lime-400 group-hover:scale-110 transition-transform" />
                  <span>Live Chats & Agent Claim</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-dark-muted group-hover:translate-x-1 group-hover:text-lime-400 transition-all" />
              </Link>

              <Link
                href="/dashboard/saved-chats"
                className="w-full p-3 rounded-xl bg-[#0a0f1d] hover:bg-[#111a30] border border-dark-border hover:border-lime-500/40 text-xs font-semibold text-white flex items-center justify-between transition-all group"
              >
                <div className="flex items-center space-x-2.5">
                  <Archive className="w-4 h-4 text-lime-400 group-hover:scale-110 transition-transform" />
                  <span>All Saved Chat Transcripts</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-dark-muted group-hover:translate-x-1 group-hover:text-lime-400 transition-all" />
              </Link>

              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className="w-full p-3 rounded-xl bg-[#0a0f1d] hover:bg-[#111a30] border border-dark-border hover:border-lime-500/40 text-xs font-semibold text-white flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Shield className="w-4 h-4 text-lime-400 group-hover:scale-110 transition-transform" />
                    <span>Support Agents & Access</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-dark-muted group-hover:translate-x-1 group-hover:text-lime-400 transition-all" />
                </Link>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-dark-border/60 flex items-center justify-between text-[11px] text-dark-muted">
            <span>Operator: <strong className="text-white">{currentAgent?.full_name || 'Admin'}</strong></span>
            <span className="text-lime-400 font-semibold">{isAdmin ? 'Administrator' : 'Agent'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
