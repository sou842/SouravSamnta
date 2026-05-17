"use client";

import React from "react";
import {
  Layers,
  Menu,
  Calendar,
  MessageSquare,
  FileText,
  Database,
  ChevronRight,
  Columns,
  MessageCircle,
  Video,
  Music,
  Plus
} from "lucide-react";
import { useAI } from "../_components/ai-provider";

export default function IntegrationsPage() {
  const { setMobileSidebarOpen } = useAI();

  const activeIntegrations = [
    {
      id: 'github',
      name: 'GitHub',
      icon: (
        <svg className="size-6 text-white" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
      ),
      connected: true,
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: (
        <svg className="size-6 text-[#ea4335]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 4.5v15c0 .85-.65 1.5-1.5 1.5H21V7.39l-9 6.58-9-6.58V21H1.5C.65 21 0 20.35 0 19.5v-15c0-.42.17-.8.45-1.07.27-.28.65-.43 1.05-.43h.5l10 7.3 10-7.3h.5c.4 0 .78.15 1.05.43.28.27.45.65.45 1.07z" />
        </svg>
      ),
      connected: true,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: (
        <svg className="size-6 text-[#25d366]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
      connected: true,
    }
  ];

  const pendingIntegrations = [
    { name: 'Google Calendar', icon: <Calendar className="size-6 text-blue-400" /> },
    { name: 'Slack', icon: <MessageSquare className="size-6 text-purple-400" /> },
    { name: 'Notion', icon: <FileText className="size-6 text-white" /> },
    { name: 'Airtable', icon: <Database className="size-6 text-red-400" /> },
    { name: 'Linear', icon: <ChevronRight className="size-6 text-indigo-400" /> },
    { name: 'Trello', icon: <Columns className="size-6 text-blue-500" /> },
    { name: 'Discord', icon: <MessageCircle className="size-6 text-indigo-500" /> },
    { name: 'Zoom', icon: <Video className="size-6 text-blue-400" /> },
    { name: 'Spotify', icon: <Music className="size-6 text-green-500" /> },
    { name: 'Teams', icon: <Video className="size-6 text-blue-600" /> },
    { name: 'Asana', icon: <Plus className="size-6 text-red-500" /> },
    { name: 'Jira', icon: <Plus className="size-6 text-blue-500" /> },
  ];

  return (
    <div className="min-h-screen bg-black">
      <header className="w-full h-16 sticky top-0 z-30 border-b border-white/5 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto max-w-8xl px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden size-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Layers className="size-4 text-white/70" />
              </div>
              <h1 className="text-lg font-medium text-white tracking-tight">Integrations</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full overflow-y-auto">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-white/5">
          {/* Active Integrations */}
          {activeIntegrations.map((item) => (
            <div
              key={item.id}
              className="group p-8 border-r border-b border-white/5 hover:bg-white/3 transition-all duration-300 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="size-14 rounded-2xl bg-white/3 border border-white/10 flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/5 transition-all duration-300 shadow-2xl">
                    {item.icon}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-white tracking-tight group-hover:text-white transition-colors">{item.name}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Pending Integrations */}
          {pendingIntegrations.map((item) => (
            <div
              key={item.name}
              className="group p-8 border-r border-b border-white/5 hover:bg-white/2 transition-all duration-300 flex items-center justify-between cursor-pointer opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
            >
              <div className="flex items-center gap-6">
                <div className="size-14 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-all duration-300">
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-white/60 tracking-tight">{item.name}</span>
                  <span className="text-xs text-white/20 font-medium">Coming Soon</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
