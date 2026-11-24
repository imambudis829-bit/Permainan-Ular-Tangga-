import React from 'react';
import {
  BarChart3,
  Pencil,
  Play,
  Plus,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { DifficultyMode } from '../types/game';
import { PWAInstallButton } from './PWAControls';

export interface PlayerDraft {
  id: string;
  name: string;
  color: string;
  tokenSymbol: string;
}

export const PLAYER_PRESETS: Array<{ color: string; symbol: string }> = [
  { color: '#0F4C3A', symbol: '1' },
  { color: '#C89B3C', symbol: '2' },
  { color: '#0E7490', symbol: '3' },
  { color: '#B91C1C', symbol: '4' },
  { color: '#6D28D9', symbol: '5' },
  { color: '#B45309', symbol: '6' },
  { color: '#047857', symbol: '7' },
  { color: '#1D4ED8', symbol: '8' },
  { color: '#BE185D', symbol: '9' },
  { color: '#374151', symbol: '10' },
];

interface TitleSetupScreenProps {
  drafts: PlayerDraft[];
  difficultyMode: DifficultyMode;
  onAddPlayer: () => void;
  onRemovePlayer: (id: string) => void;
  onRenamePlayer: (id: string, name: string) => void;
  onChangeDifficulty: (mode: DifficultyMode) => void;
  onStartGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenParentDashboard: () => void;
}

const DIFFICULTY_OPTIONS: Array<{
  value: DifficultyMode;
  label: string;
}> = [
  {
    value: 'mudah',
    label: '1) Mudah',
  },
  {
    value: 'sedang',
    label: '2) Sedang',
  },
  {
    value: 'menantang',
    label: '3) Sulit',
  },
];

export const TitleSetupScreen: React.FC<TitleSetupScreenProps> = ({
  drafts,
  difficultyMode,
  onAddPlayer,
  onRemovePlayer,
  onRenamePlayer,
  onChangeDifficulty,
  onStartGame,
  onOpenLeaderboard,
  onOpenParentDashboard,
}) => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#1A241F] text-[#FBF8F1]">
      {/* Generated Key Art Backdrop with Measured Scrim */}
      <div className="absolute inset-0">
        <img
          src="/src/assets/images/title_backdrop_islamic_adventure_1795513754777.jpg"
          alt="Ilustrasi halaman petualangan Islami Jejak Hikmah"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2B21]/95 via-[#0F382B]/85 to-[#1A241F]/70" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1260px] flex-col justify-between px-5 py-6 sm:px-8 sm:py-8">
        {/* Clean 3-zone utility bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <svg
              viewBox="0 0 40 40"
              className="h-8 w-8 shrink-0"
              aria-hidden="true"
            >
              <rect width="40" height="40" rx="10" fill="#0F4C3A" stroke="#C89B3C" strokeWidth="2" />
              <polygon
                points="20,5 24,16 35,20 24,24 20,35 16,24 5,20 16,16"
                fill="#E5BE67"
              />
              <circle cx="20" cy="20" r="6" fill="#0F4C3A" />
            </svg>
            <span className="font-display text-lg font-bold tracking-tight text-[#FBF8F1]">
              Jejak Hikmah
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-[#FBF8F1] hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trophy className="w-4 h-4 text-[#E5BE67]" />
              Peringkat Global
            </button>
            <button
              type="button"
              onClick={onOpenParentDashboard}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-[#FBF8F1] hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <BarChart3 className="w-4 h-4 text-[#E5BE67]" />
              Dasbor Orang Tua
            </button>
            <PWAInstallButton />
          </div>
        </header>

        {/* Split Hero + 1–10 Player Roster Panel */}
        <main className="my-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Hero Lockup over Calm Negative Space */}
          <div className="lg:col-span-6 space-y-5">
            <div className="text-xs font-medium tracking-wide text-[#E5BE67]">
              Permainan dikembangkan oleh Imam Budi Santoso
            </div>

            {/* Bespoke SVG Title Lockup */}
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-balance text-[#FBF8F1]">
              Petualangan Ular Tangga Rukun Iman &amp; Rukun Islam
            </h1>

            <p className="max-w-xl text-base text-[#FBF8F1]/85 leading-relaxed">
              Jelajahi 100 kotak interaktif bersama hingga 10 pemain atau kelompok. Hadapi
              tantangan 116 soal acak otomatis Rukun Iman &amp; Rukun Islam tingkat SD, kumpulkan
              poin keberkahan, hindari ular, dan raih bonus +100 di Istana Hikmah.
            </p>

            <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-5 max-w-lg">
              <div>
                <div className="font-mono-num text-xl font-bold text-[#E5BE67]">+10 / -5</div>
                <div className="text-xs text-[#FBF8F1]/75 mt-0.5">Poin Jawaban Kuis</div>
              </div>
              <div>
                <div className="font-mono-num text-xl font-bold text-[#E5BE67]">+100</div>
                <div className="text-xs text-[#FBF8F1]/75 mt-0.5">Bonus Kotak Finish</div>
              </div>
              <div>
                <div className="font-mono-num text-xl font-bold text-[#E5BE67]">116 Soal</div>
                <div className="text-xs text-[#FBF8F1]/75 mt-0.5">Acak Anti-Hafalan</div>
              </div>
            </div>
          </div>

          {/* Right Setup Card: 1–10 Players & Difficulty */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-[#C89B3C]/35 bg-[#FBF8F1] p-5 sm:p-6 text-[#1A241F] shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3B2316]/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-[#0F4C3A]" />
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#0F4C3A]">
                      Daftar Pemain ({drafts.length}/10)
                    </h2>
                    <p className="text-xs text-[#52615A]">
                      Klik nama pemain untuk mengganti atau gunakan tombol Tambah Pemain
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onAddPlayer}
                  disabled={drafts.length >= 10}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F4C3A] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#FBF8F1] hover:bg-[#145E48] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Pemain
                </button>
              </div>

              {/* Player Roster List */}
              <div className="mt-4 max-h-[250px] overflow-y-auto pr-1 space-y-2">
                {drafts.map((player, idx) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2.5 rounded-xl border border-[#3B2316]/15 bg-white px-3 py-2 focus-within:border-[#0F4C3A] focus-within:ring-2 focus-within:ring-[#0F4C3A]/15 transition-colors"
                  >
                    <span
                      style={{ backgroundColor: player.color }}
                      className="font-mono-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    >
                      {player.tokenSymbol}
                    </span>
                    <input
                      type="text"
                      value={player.name}
                      maxLength={28}
                      onChange={(e) => onRenamePlayer(player.id, e.target.value)}
                      placeholder={`Nama Pemain ${idx + 1}`}
                      aria-label={`Edit Nama Pemain ${idx + 1}`}
                      className="w-full min-w-0 bg-transparent text-sm font-medium text-[#1A241F] focus:outline-none"
                    />
                    <Pencil className="w-3.5 h-3.5 text-[#52615A]/70 shrink-0 pointer-events-none" />
                    {drafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemovePlayer(player.id)}
                        aria-label={`Hapus ${player.name}`}
                        className="rounded-lg p-1.5 text-[#52615A] hover:bg-red-50 hover:text-[#B91C1C] transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Difficulty Mode Selector */}
              <div className="mt-5 border-t border-[#3B2316]/10 pt-4">
                <label className="block text-xs font-semibold text-[#52615A] mb-2">
                  Tingkat Kesulitan Soal :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => {
                    const active = difficultyMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChangeDifficulty(opt.value)}
                        className={`rounded-xl border px-3 py-2.5 text-center transition-colors cursor-pointer ${
                          active
                            ? 'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A]'
                            : 'border-[#3B2316]/12 bg-white text-[#1A241F] hover:bg-[#FAF7EE]'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                          {opt.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary CTA */}
              <button
                type="button"
                onClick={onStartGame}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C89B3C] px-6 py-3.5 text-base font-bold text-[#1A241F] shadow-md hover:bg-[#D7AB4C] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-5 h-5 fill-current" />
                Mulai Petualangan
              </button>
            </div>
          </div>
        </main>

        {/* Single Flat Control-Hint Line */}
        <footer className="border-t border-white/15 pt-4 text-xs text-[#FBF8F1]/75 flex flex-wrap items-center justify-between gap-2">
          <span>
            Kontrol: Klik Lempar Dadu atau tekan Spasi &middot; Klik kotak papan mana saja untuk info &middot; Jawab 1–4 pakai keyboard
          </span>
          <span>Akses penuh mode offline &amp; sinkronisasi otomatis saat online</span>
        </footer>
      </div>
    </div>
  );
};
