"use client";

import { Loader2, LogOut, MessageCircle, RefreshCcw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWhatsAppSession, getWhatsAppStatusTone } from '@/lib/whatsapp/client';

export function WhatsAppConnectModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { status, isLoading, startSession, disconnect, refreshStatus } = useWhatsAppSession();

  const handleConnect = async () => {
    try {
      await startSession();
      toast.success('WhatsApp session started. Scan the QR from your phone.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start WhatsApp session');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('WhatsApp disconnected.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect WhatsApp');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/10 bg-[#050505] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="flex size-10 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <MessageCircle className="size-5" />
            </span>
            Connect WhatsApp
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Link your personal account using a QR scan, keep the session persisted per user, and stream WhatsApp activity into the app in realtime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Connection status</p>
                <p className="text-xs text-white/45">QR refreshes automatically and reconnect state streams live.</p>
              </div>
              <Badge variant="outline" className={getWhatsAppStatusTone(status.status)}>
                {status.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/40 p-5">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 text-white/55">
                  <Loader2 className="size-6 animate-spin" />
                  <p className="text-sm">Loading WhatsApp session...</p>
                </div>
              ) : status.qrCodeDataUrl ? (
                <div className="space-y-4 text-center">
                  <img src={status.qrCodeDataUrl} alt="WhatsApp QR code" className="mx-auto size-72 rounded-3xl bg-white p-4" />
                  <p className="text-sm text-white/60">Open WhatsApp on your phone, go to Linked Devices, and scan this QR.</p>
                </div>
              ) : status.status === 'connected' ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    <Smartphone className="size-10" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">Device linked</p>
                    <p className="mt-1 text-sm text-white/55">{status.pushName || status.phoneNumber || 'WhatsApp account'} is connected and ready.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60">
                    <MessageCircle className="size-10" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">Start a linked-device session</p>
                    <p className="mt-1 text-sm text-white/55">We’ll generate a secure QR and keep credentials isolated to this user session.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-white">Session details</p>
                <p className="mt-1 text-xs text-white/45">Designed for reconnects, restarts, and future AI routing.</p>
              </div>

              <div className="space-y-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Phone</p>
                  <p className="mt-2 font-medium text-white">{status.phoneNumber || 'Not linked yet'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Connected at</p>
                  <p className="mt-2 font-medium text-white">{status.connectedAt ? new Date(status.connectedAt).toLocaleString() : 'Waiting for device link'}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Last error</p>
                  <p className="mt-2 font-medium text-white">{status.lastError || 'None'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleConnect} className="bg-emerald-500 text-black hover:bg-emerald-400">
                {status.status === 'connected' ? 'Refresh session' : 'Connect WhatsApp'}
              </Button>
              <Button variant="outline" onClick={() => void refreshStatus()} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                <RefreshCcw className="size-4" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleDisconnect} className="border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
                <LogOut className="size-4" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
