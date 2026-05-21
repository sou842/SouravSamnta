"use client";

import { useMemo, useState } from 'react';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppMessages, useWhatsAppSession, getWhatsAppStatusTone } from '@/lib/whatsapp/client';

export function WhatsAppWorkspace() {
  const { status, chats } = useWhatsAppSession();
  const [selectedChatJid, setSelectedChatJid] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const activeChatJid = selectedChatJid || chats[0]?.jid || null;
  const selectedChat = useMemo(
    () => chats.find((chat) => chat.jid === activeChatJid) || null,
    [activeChatJid, chats]
  );
  const activeMessages = useWhatsAppMessages(activeChatJid);

  const handleSend = async () => {
    if (!draft.trim() || !activeChatJid) return;
    try {
      await activeMessages.sendTextMessage(draft.trim());
      setDraft('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send WhatsApp message');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] flex-col bg-black text-white">
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">WhatsApp Workspace</h1>
            <p className="mt-1 text-sm text-white/45">Linked-device messaging inside the existing platform, ready for future AI routing.</p>
          </div>
          <Badge variant="outline" className={getWhatsAppStatusTone(status.status)}>
            {status.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-r border-white/5 bg-[#020202]">
          <div className="border-b border-white/5 px-5 py-4">
            <p className="text-sm font-semibold text-white">Chats</p>
            <p className="mt-1 text-xs text-white/40">Recent WhatsApp conversations sync here in realtime.</p>
          </div>

          <div className="h-[calc(100%-73px)] overflow-y-auto">
            {chats.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white/45">
                <MessageCircle className="size-8" />
                <p className="text-sm">No chats yet. Connect and open WhatsApp from your phone to populate the list.</p>
              </div>
            ) : (
              chats.map((chat) => {
                const active = activeChatJid === chat.jid;
                return (
                  <button
                    key={chat.jid}
                    type="button"
                    onClick={() => setSelectedChatJid(chat.jid)}
                    className={`flex w-full items-start gap-3 border-b border-white/[0.04] px-5 py-4 text-left transition ${active ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300">
                      <MessageCircle className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">{chat.name}</p>
                        <span className="text-[11px] text-white/35">{chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-white/45">{chat.lastMessageText || 'No messages yet'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-[#030303]">
          <div className="border-b border-white/5 px-6 py-4">
            <p className="text-sm font-semibold text-white">{selectedChat?.name || 'Choose a chat'}</p>
            <p className="mt-1 text-xs text-white/40">{selectedChat?.jid || 'Select a conversation to view message history.'}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {activeMessages.isLoading ? (
              <div className="flex h-full items-center justify-center text-white/45">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : activeMessages.messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-white/45">
                <p className="max-w-sm text-sm">No synced messages yet for this conversation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeMessages.messages.map((message) => (
                  <div key={message.messageId} className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm ${message.fromMe ? 'bg-emerald-500 text-black' : 'border border-white/10 bg-white/[0.04] text-white/90'}`}>
                      <p>{message.text || message.type}</p>
                      <div className={`mt-2 text-[11px] ${message.fromMe ? 'text-black/60' : 'text-white/35'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/5 px-6 py-4">
            <div className="flex items-end gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeChatJid ? 'Write a WhatsApp reply...' : 'Select a chat to start replying'}
                disabled={!activeChatJid || status.status !== 'connected'}
                className="min-h-[54px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
              />
              <Button onClick={handleSend} disabled={!draft.trim() || !activeChatJid || status.status !== 'connected'} className="rounded-2xl bg-emerald-500 text-black hover:bg-emerald-400">
                <Send className="size-4" />
                Send
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
