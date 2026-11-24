import React, { useState } from 'react';
import { Download, WifiOff, RefreshCw } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#1A241F] hover:bg-[#D7AB4C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Pasang Aplikasi Offline
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-900/20 bg-white px-4 py-2 text-sm font-semibold text-[#0F4C3A] hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Pasang di iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
            <div className="w-full max-w-sm rounded-xl border border-emerald-950/15 bg-[#FBF8F1] p-6 shadow-xl">
              <h3 className="font-display text-lg font-bold text-[#0F4C3A]">
                Pasang di iPhone / iPad
              </h3>
              <p className="mt-2 text-sm text-[#36453E] leading-relaxed">
                1. Ketuk tombol <strong>Bagikan (Share)</strong> pada bilah bawah Safari.
                <br />
                2. Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama</strong> agar papan
                permainan bisa dibuka kapan saja tanpa internet.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-[#0F4C3A] py-2.5 text-sm font-semibold text-[#FBF8F1] hover:bg-[#145E48] transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

interface OfflineIndicatorProps {
  pendingSyncCount: number;
  onSyncNow?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  pendingSyncCount,
  onSyncNow,
}) => {
  const isOnline = useOnlineStatus();

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-3 rounded-lg border border-amber-900/25 bg-[#3B2316] px-4 py-2.5 text-xs font-medium text-[#FBF8F1] shadow-lg">
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 text-[#E5BE67] shrink-0" />
          <span>Mode Offline Aktif — Progres disimpan lokal &amp; siap disinkronkan</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 text-[#E5BE67] shrink-0" />
          <span>{pendingSyncCount} data menunggu sinkronisasi</span>
          {onSyncNow && (
            <button
              type="button"
              onClick={onSyncNow}
              className="rounded bg-[#C89B3C] px-2.5 py-1 text-xs font-semibold text-[#1A241F] hover:bg-[#D7AB4C] cursor-pointer whitespace-nowrap"
            >
              Sinkronkan
            </button>
          )}
        </>
      )}
    </div>
  );
};
