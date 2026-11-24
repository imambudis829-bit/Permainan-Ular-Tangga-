import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Trophy, WifiOff, Globe } from 'lucide-react';
import { DifficultyMode, LeaderboardEntry } from '../types/game';
import { fetchGlobalLeaderboard } from '../utils/syncStore';

interface LeaderboardViewProps {
  onBack: () => void;
}

const MODE_FILTERS: Array<{ value: DifficultyMode | 'semua'; label: string }> = [
  { value: 'semua', label: 'Semua Mode' },
  { value: 'mudah', label: '1) Mudah' },
  { value: 'sedang', label: '2) Sedang' },
  { value: 'menantang', label: '3) Sulit' },
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<DifficultyMode | 'semua'>('semua');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [source, setSource] = useState<'cloud' | 'offline'>('cloud');
  const [loading, setLoading] = useState(true);

  const loadData = async (selectedFilter: DifficultyMode | 'semua') => {
    setLoading(true);
    const res = await fetchGlobalLeaderboard(selectedFilter);
    setEntries(res.entries);
    setSource(res.source);
    setLoading(false);
  };

  useEffect(() => {
    loadData(filter);
  }, [filter]);

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#1A241F]">
      <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3B2316]/12 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-[#3B2316]/15 bg-white px-3.5 py-2 text-sm font-medium text-[#1A241F] hover:bg-[#FAF7EE] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#0F4C3A]">
                Peringkat Global Siswa
              </h1>
              <p className="text-xs text-[#52615A] flex items-center gap-1.5 mt-0.5">
                {source === 'cloud' ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-[#0F4C3A]" />
                    <span>Tersinkronisasi dengan server peringkat global</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Menampilkan data lokal offline (akan sinkron saat online)</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadData(filter)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C3A] px-4 py-2 text-sm font-semibold text-[#FBF8F1] hover:bg-[#145E48] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>

        {/* Filter Segmented Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#3B2316]/12 bg-[#EFE8D5]/60 p-1.5 w-fit">
          {MODE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filter === opt.value
                  ? 'bg-white text-[#0F4C3A] shadow-sm font-semibold'
                  : 'text-[#52615A] hover:text-[#1A241F]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="mt-6 rounded-2xl border border-[#3B2316]/12 bg-white overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-[#52615A]">
              Memuat papan peringkat global...
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="mx-auto w-10 h-10 text-[#C89B3C]" />
              <h2 className="mt-3 font-display text-lg font-bold text-[#0F4C3A]">
                Belum Ada Skor di Papan Peringkat
              </h2>
              <p className="mt-1 text-sm text-[#52615A] max-w-md mx-auto">
                Selesaikan satu sesi permainan hingga kotak 100 untuk mencatatkan skor terbaikmu di
                peringkat global dan memotivasi teman-teman!
              </p>
              <button
                type="button"
                onClick={onBack}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C89B3C] px-5 py-2.5 text-sm font-bold text-[#1A241F] hover:bg-[#D7AB4C] cursor-pointer"
              >
                Mulai Bermain Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF7EE] border-b border-[#3B2316]/12 text-xs text-[#52615A]">
                  <tr>
                    <th className="py-3 px-4 text-left">Peringkat</th>
                    <th className="py-3 px-4 text-left">Nama Siswa / Kelompok</th>
                    <th className="py-3 px-4 text-left">Mode Soal</th>
                    <th className="py-3 px-4 text-right">Akurasi</th>
                    <th className="py-3 px-4 text-right">Status Finish</th>
                    <th className="py-3 px-4 text-right">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3B2316]/10">
                  {entries.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-[#FAF7EE]/70 transition-colors ${
                        idx < 3 ? 'bg-[#C89B3C]/6' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono-num font-bold text-[#0F4C3A]">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1A241F]">
                        {entry.playerName}
                        <div className="text-xs font-normal text-[#52615A]">
                          {new Date(entry.playedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#52615A] capitalize">
                        {entry.difficultyMode === 'menantang' ? 'Sulit' : entry.difficultyMode}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num">
                        {entry.accuracy}% ({entry.correctCount}/{entry.totalQuestions})
                      </td>
                      <td className="py-3 px-4 text-right text-xs">
                        {entry.reachedFinish ? (
                          <span className="font-semibold text-[#0F4C3A]">Capai 100</span>
                        ) : (
                          <span className="text-[#52615A]">Peserta</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-base font-bold text-[#0F4C3A]">
                        {entry.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
