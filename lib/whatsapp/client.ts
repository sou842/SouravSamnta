"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WhatsAppChatSummary, WhatsAppConnectionStatus, WhatsAppMessageRecord, WhatsAppStatusPayload } from '@/lib/whatsapp/types';

const initialStatus: WhatsAppStatusPayload = {
  status: 'idle',
  qrCodeDataUrl: null,
  phoneNumber: null,
  pushName: null,
  lastError: null,
  connectedAt: null,
  updatedAt: new Date(0).toISOString(),
};

export function useWhatsAppSession() {
  const [status, setStatus] = useState<WhatsAppStatusPayload>(initialStatus);
  const [chats, setChats] = useState<WhatsAppChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshChats = useCallback(async () => {
    const response = await fetch('/api/whatsapp/chats', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    setChats(data.chats || []);
  }, []);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp/session', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load WhatsApp session');
      const data = await response.json();
      setStatus(data);
      await refreshChats();
    } finally {
      setIsLoading(false);
    }
  }, [refreshChats]);

  const startSession = useCallback(async () => {
    const response = await fetch('/api/whatsapp/session', { method: 'POST' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to start WhatsApp session');
    }
    const data = await response.json();
    setStatus(data);
  }, []);

  const disconnect = useCallback(async () => {
    const response = await fetch('/api/whatsapp/session/disconnect', { method: 'POST' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to disconnect WhatsApp');
    }
    await refreshStatus();
    setChats([]);
  }, [refreshStatus]);

  useEffect(() => {
    void refreshStatus();

    const source = new EventSource('/api/whatsapp/events');

    source.addEventListener('status', (event) => {
      setStatus(JSON.parse((event as MessageEvent).data));
    });

    source.addEventListener('qr', (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setStatus((current) => ({ ...current, qrCodeDataUrl: payload.qrCodeDataUrl || null, status: 'qr_pending', updatedAt: new Date().toISOString() }));
    });

    source.addEventListener('chat.upsert', (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      if (Array.isArray(payload)) {
        setChats(payload);
      }
    });

    source.addEventListener('session.cleared', () => {
      setChats([]);
      setStatus((current) => ({ ...current, status: 'disconnected', qrCodeDataUrl: null, connectedAt: null }));
    });

    source.onerror = () => {
      setStatus((current) => {
        if (current.status === 'connected') return current;
        return { ...current, status: 'reconnecting', updatedAt: new Date().toISOString() };
      });
    };

    return () => {
      source.close();
    };
  }, [refreshStatus]);

  const isConnected = status.status === 'connected';

  return {
    status,
    chats,
    isConnected,
    isLoading,
    startSession,
    disconnect,
    refreshChats,
    refreshStatus,
    setChats,
  };
}

export function useWhatsAppMessages(chatJid: string | null) {
  const [messages, setMessages] = useState<WhatsAppMessageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!chatJid) {
      setMessages([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/whatsapp/messages?chatJid=${encodeURIComponent(chatJid)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data.messages || []);
    } finally {
      setIsLoading(false);
    }
  }, [chatJid]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!chatJid) return;
    const source = new EventSource('/api/whatsapp/events');

    const handleUpsert = (raw: MessageEvent) => {
      const payload = JSON.parse(raw.data) as WhatsAppMessageRecord;
      if (payload.chatJid !== chatJid) return;
      setMessages((current) => {
        const exists = current.some((message) => message.messageId === payload.messageId);
        if (exists) {
          return current.map((message) => (message.messageId === payload.messageId ? payload : message));
        }
        return [...current, payload];
      });
    };

    const handleUpdate = (raw: MessageEvent) => {
      const payload = JSON.parse(raw.data) as WhatsAppMessageRecord;
      if (payload.chatJid !== chatJid) return;
      setMessages((current) => current.map((message) => (message.messageId === payload.messageId ? { ...message, ...payload } : message)));
    };

    source.addEventListener('message.upsert', handleUpsert as EventListener);
    source.addEventListener('message.update', handleUpdate as EventListener);

    return () => source.close();
  }, [chatJid]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!chatJid) throw new Error('No chat selected');
    const response = await fetch('/api/whatsapp/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatJid, text }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }
    return data.message as WhatsAppMessageRecord;
  }, [chatJid]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [messages]
  );

  return {
    messages: sortedMessages,
    isLoading,
    sendTextMessage,
    reload: loadMessages,
  };
}

export function getWhatsAppStatusTone(status: WhatsAppConnectionStatus) {
  switch (status) {
    case 'connected':
      return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
    case 'qr_pending':
      return 'text-amber-200 border-amber-400/30 bg-amber-500/10';
    case 'reconnecting':
    case 'initializing':
      return 'text-sky-200 border-sky-500/30 bg-sky-500/10';
    case 'logged_out':
    case 'error':
      return 'text-rose-200 border-rose-500/30 bg-rose-500/10';
    default:
      return 'text-white/70 border-white/10 bg-white/5';
  }
}
