"use client";

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Github, Layers, Menu, MessageCircle, Sparkles } from 'lucide-react';
import { useAI } from '../_components/ai-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WhatsAppConnectModal } from '@/components/whatsapp/whatsapp-connect-modal';
import { getWhatsAppStatusTone, useWhatsAppSession } from '@/lib/whatsapp/client';

export default function IntegrationsPage() {
  const { setMobileSidebarOpen } = useAI();
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const { status, chats, isConnected } = useWhatsAppSession();

  const activeIntegrations = useMemo(
    () => [
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'Linked-device messaging, QR login, persistent sessions, and realtime sync.',
        icon: <MessageCircle className="size-6 text-emerald-300" />,
        badge: status.status.replace('_', ' '),
        tone: getWhatsAppStatusTone(status.status),
        actionLabel: isConnected ? 'Open Workspace' : 'Connect Device',
        href: isConnected ? '/ai/integrations/whatsapp' : null,
        onClick: !isConnected ? () => setWhatsAppModalOpen(true) : undefined,
        meta: `${chats.length} synced chats`,
      },
      {
        id: 'github',
        name: 'GitHub',
        description: 'Existing code and repository workflows already available in the platform.',
        icon: <Github className="size-6 text-white" />,
        badge: 'connected',
        tone: 'text-white/75 border-white/10 bg-white/5',
        actionLabel: 'Active',
        href: null,
        meta: 'Ready',
      },
      {
        id: 'calendar',
        name: 'Google Calendar / Meet',
        description: 'Scheduling and meeting support already represented in the current workspace.',
        icon: <Calendar className="size-6 text-sky-300" />,
        badge: 'connected',
        tone: 'text-white/75 border-white/10 bg-white/5',
        actionLabel: 'Active',
        href: null,
        meta: 'Ready',
      },
    ],
    [chats.length, isConnected, status.status]
  );

  const pendingIntegrations = [
    'Slack',
    'Notion',
    'Airtable',
    'Trello',
    'Zoom',
    'Spotify',
    'Jira',
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-8xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Layers className="size-4 text-white/70" />
              </div>
              <h1 className="text-lg font-medium tracking-tight">Integrations</h1>
            </div>
          </div>

          <Button onClick={() => setWhatsAppModalOpen(true)} className="bg-emerald-500 text-black hover:bg-emerald-400">
            <MessageCircle className="size-4" />
            Connect WhatsApp
          </Button>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8">
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200">
              WhatsApp linked-device rollout
            </Badge>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight">Bring personal WhatsApp messaging into the existing AI workspace without rebuilding the platform.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Users can generate a QR, link their account, keep auth persisted across refreshes and restarts, and work with synced conversations inside a dedicated in-app workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/45">
              <span className="rounded-full border border-white/10 px-3 py-1">Baileys websocket session</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Per-user auth isolation</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Realtime status + chat sync</span>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Sparkles className="size-5 text-white/70" />
              </div>
              <div>
                <p className="text-sm font-semibold">Live WhatsApp state</p>
                <p className="text-xs text-white/45">Streaming from the server session.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Status</p>
                <Badge variant="outline" className={`mt-3 ${getWhatsAppStatusTone(status.status)}`}>
                  {status.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Phone</p>
                <p className="mt-3 text-sm text-white">{status.phoneNumber || 'Awaiting linked device'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Chats synced</p>
                <p className="mt-3 text-sm text-white">{chats.length}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {activeIntegrations.map((item) => {
            const card = (
              <div className="group flex h-full flex-col justify-between rounded-[28px] border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.05]">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                      {item.icon}
                    </div>
                    <Badge variant="outline" className={item.tone}>
                      {item.badge}
                    </Badge>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{item.description}</p>
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-white/55">
                  <span>{item.meta}</span>
                  <span className="inline-flex items-center gap-2 font-medium text-white">
                    {item.actionLabel}
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            );

            if (item.href) {
              return (
                <Link key={item.id} href={item.href}>
                  {card}
                </Link>
              );
            }

            return (
              <button key={item.id} type="button" onClick={item.onClick} className="text-left">
                {card}
              </button>
            );
          })}

          {pendingIntegrations.map((name) => (
            <div key={name} className="rounded-[28px] border border-white/8 bg-white/[0.02] p-6 opacity-45 grayscale transition hover:opacity-90 hover:grayscale-0">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                <Layers className="size-6 text-white/45" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{name}</h3>
              <p className="mt-2 text-sm text-white/45">Queued behind the WhatsApp rollout.</p>
            </div>
          ))}
        </div>
      </main>

      <WhatsAppConnectModal open={whatsAppModalOpen} onOpenChange={setWhatsAppModalOpen} />
    </div>
  );
}
