import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { PILLAR_LIST } from '../data/questions';
import { MatchReportRecord, PillarPerformance } from '../types/game';
import {
  downloadStandaloneHtmlReport,
  ParentAnalyticsAggregate,
} from '../utils/htmlReportGenerator';
import { fetchAllReports } from '../utils/syncStore';

interface ParentDashboardViewProps {
  onBack: () => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({ onBack }) => {
  const [reports, setReports] = useState<MatchReportRecord[]>([]);
  const [studentFilter, setStudentFilter] = useState<string>('semua');
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'cloud' | 'offline'>('cloud');

  const loadReports = async () => {
    setLoading(true);
    const res = await fetchAllReports();
    setReports(res.reports);
    setSource(res.source);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const allStudentNames = useMemo(() => {
    const names = new Set<string>();
    for (const rep of reports) {
      for (const p of rep.players) {
        if (p.name) names.add(p.name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [reports]);

  const aggregate = useMemo<ParentAnalyticsAggregate>(() => {
    const pillarMap: Record<string, PillarPerformance> = {};
    for (const p of PILLAR_LIST) {
      pillarMap[p.title] = { correct: 0, wrong: 0 };
    }
    const difficultyMap: Record<'mudah' | 'sedang' | 'menantang', PillarPerformance> = {
      mudah: { correct: 0, wrong: 0 },
      sedang: { correct: 0, wrong: 0 },
      menantang: { correct: 0, wrong: 0 },
    };

    let totalMatches = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let highestScore = 0;
    let finishCount = 0;
    const recentMatches: MatchReportRecord[] = [];
    const missedAttempts: ParentAnalyticsAggregate['missedAttempts'] = [];

    for (const rep of reports) {
      const matchingPlayers =
        studentFilter === 'semua'
          ? rep.players
          : rep.players.filter((p) => p.name === studentFilter);

      if (matchingPlayers.length === 0) continue;

      totalMatches += 1;
      recentMatches.push(rep);

      for (const p of matchingPlayers) {
        totalCorrect += p.correctCount;
        totalWrong += p.wrongCount;
        if (p.score > highestScore) highestScore = p.score;
        if (p.reachedFinish) finishCount += 1;

        for (const [pillarTitle, perf] of Object.entries(p.pillarStats || {})) {
          if (!pillarMap[pillarTitle]) {
            pillarMap[pillarTitle] = { correct: 0, wrong: 0 };
          }
          pillarMap[pillarTitle].correct += perf.correct || 0;
          pillarMap[pillarTitle].wrong += perf.wrong || 0;
        }
      }

      for (const att of rep.attempts || []) {
        if (studentFilter !== 'semua' && att.playerName !== studentFilter) continue;
        if (att.isCorrect) {
          difficultyMap[att.difficulty].correct += 1;
        } else {
          difficultyMap[att.difficulty].wrong += 1;
          missedAttempts.push({
            prompt: att.prompt,
            pillarTitle: att.pillarTitle,
            difficulty: att.difficulty,
            selectedOption: att.selectedOption,
            correctOption: att.correctOption,
            explanation: att.explanation,
            playerName: att.playerName,
            timestamp: att.timestamp,
          });
        }
      }
    }

    const totalQ = totalCorrect + totalWrong;
    const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

    return {
      studentFilter,
      totalMatches,
      totalCorrect,
      totalWrong,
      accuracy,
      highestScore,
      finishCount,
      pillarMap,
      difficultyMap,
      missedAttempts,
      recentMatches,
    };
  }, [reports, studentFilter]);

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#1A241F]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8 sm:py-8">
        {/* Top Bar */}
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
                Dasbor Analitik Belajar Orang Tua
              </h1>
              <p className="text-xs text-[#52615A] mt-0.5">
                Pantau penguasaan Rukun Iman &amp; Rukun Islam anak &middot; Sumber:{' '}
                {source === 'cloud' ? 'Cloud & Lokal' : 'Penyimpanan Offline'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              aria-label="Filter Siswa"
              className="rounded-lg border border-[#3B2316]/20 bg-white px-3.5 py-2 text-sm font-medium text-[#1A241F] focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]"
            >
              <option value="semua">Semua Siswa / Kelompok</option>
              {allStudentNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadReports}
              className="inline-flex items-center gap-2 rounded-lg border border-[#3B2316]/20 bg-white px-3.5 py-2 text-sm font-medium text-[#1A241F] hover:bg-[#FAF7EE] cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>

            <button
              type="button"
              onClick={() => downloadStandaloneHtmlReport(aggregate)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-bold text-[#1A241F] hover:bg-[#D7AB4C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              Unduh Laporan HTML
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#52615A]">
            Memuat analitik kemajuan belajar...
          </div>
        ) : reports.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#3B2316]/12 bg-white p-12 text-center">
            <FileText className="mx-auto w-10 h-10 text-[#0F4C3A]" />
            <h2 className="mt-3 font-display text-lg font-bold text-[#0F4C3A]">
              Belum Ada Data Kemajuan Belajar
            </h2>
            <p className="mt-1 text-sm text-[#52615A] max-w-md mx-auto">
              Mainkan minimal satu sesi permainan hingga selesai (mencapai kotak 100) untuk
              melihat analitik penguasaan Rukun Iman &amp; Islam dan mengunduh laporan HTML orang tua.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0F4C3A] px-5 py-2.5 text-sm font-semibold text-[#FBF8F1] hover:bg-[#145E48] cursor-pointer"
            >
              Kembali ke Permainan
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-xl border border-[#3B2316]/12 bg-white p-4">
                <div className="text-xs text-[#52615A]">Total Sesi</div>
                <div className="mt-1 font-mono-num text-2xl font-bold text-[#0F4C3A]">
                  {aggregate.totalMatches}
                </div>
              </div>
              <div className="rounded-xl border border-[#3B2316]/12 bg-white p-4">
                <div className="text-xs text-[#52615A]">Akurasi Kuis</div>
                <div className="mt-1 font-mono-num text-2xl font-bold text-[#0F4C3A]">
                  {aggregate.accuracy}%
                </div>
              </div>
              <div className="rounded-xl border border-[#3B2316]/12 bg-white p-4">
                <div className="text-xs text-[#52615A]">Benar / Salah</div>
                <div className="mt-1 font-mono-num text-2xl font-bold text-[#1A241F]">
                  {aggregate.totalCorrect} / {aggregate.totalWrong}
                </div>
              </div>
              <div className="rounded-xl border border-[#3B2316]/12 bg-white p-4">
                <div className="text-xs text-[#52615A]">Skor Tertinggi</div>
                <div className="mt-1 font-mono-num text-2xl font-bold text-[#B47D18]">
                  {aggregate.highestScore}
                </div>
              </div>
              <div className="rounded-xl border border-[#3B2316]/12 bg-white p-4 col-span-2 sm:col-span-1">
                <div className="text-xs text-[#52615A]">Capai Finish 100</div>
                <div className="mt-1 font-mono-num text-2xl font-bold text-[#0E7490]">
                  {aggregate.finishCount}x
                </div>
              </div>
            </div>

            {/* Pillar Mastery + Difficulty Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 rounded-2xl border border-[#3B2316]/12 bg-white p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold text-[#0F4C3A]">
                  Penguasaan Materi Per Pilar (Rukun Iman &amp; Rukun Islam)
                </h2>
                <p className="text-xs text-[#52615A] mt-0.5 mb-4">
                  Menampilkan akurasi jawaban anak pada setiap pokok bahasan akidah dan ibadah
                </p>

                <div className="space-y-3">
                  {PILLAR_LIST.map((p) => {
                    const stat = aggregate.pillarMap[p.title] || { correct: 0, wrong: 0 };
                    const total = stat.correct + stat.wrong;
                    const pct = total > 0 ? Math.round((stat.correct / total) * 100) : 0;
                    const barColor =
                      total === 0
                        ? 'bg-[#EAE4D3]'
                        : pct >= 75
                        ? 'bg-[#0F4C3A]'
                        : pct >= 50
                        ? 'bg-[#C89B3C]'
                        : 'bg-[#B91C1C]';

                    return (
                      <div key={p.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="font-medium text-[#1A241F]">
                            {p.title}{' '}
                            <span className="text-xs text-[#52615A]">
                              ({p.category === 'rukun_iman' ? 'Iman' : 'Islam'} #{p.number})
                            </span>
                          </span>
                          <span className="font-mono-num text-xs text-[#52615A]">
                            {total > 0 ? `${pct}% (${stat.correct}/${total})` : 'Belum diuji'}
                          </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EFE8D5]">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Breakdown + Recent Sessions */}
              <div className="lg:col-span-4 space-y-6">
                <div className="rounded-2xl border border-[#3B2316]/12 bg-white p-5">
                  <h2 className="font-display text-lg font-bold text-[#0F4C3A] mb-3">
                    Akurasi Per Tingkat Soal
                  </h2>
                  <div className="space-y-3">
                    {(
                      [
                        { key: 'mudah', label: '1) Mudah' },
                        { key: 'sedang', label: '2) Sedang' },
                        { key: 'menantang', label: '3) Sulit' },
                      ] as const
                    ).map((tier) => {
                      const d = aggregate.difficultyMap[tier.key];
                      const tot = d.correct + d.wrong;
                      const pct = tot > 0 ? Math.round((d.correct / tot) * 100) : 0;
                      return (
                        <div
                          key={tier.key}
                          className="flex items-center justify-between border-b border-[#3B2316]/8 pb-2.5 last:border-none last:pb-0"
                        >
                          <div>
                            <div className="text-sm font-semibold text-[#1A241F]">{tier.label}</div>
                            <div className="text-xs text-[#52615A] font-mono-num">
                              {d.correct} benar &middot; {d.wrong} salah
                            </div>
                          </div>
                          <div className="font-mono-num text-base font-bold text-[#0F4C3A]">
                            {tot > 0 ? `${pct}%` : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#3B2316]/12 bg-white p-5">
                  <h2 className="font-display text-lg font-bold text-[#0F4C3A] mb-3">
                    Riwayat Sesi Terbaru
                  </h2>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {aggregate.recentMatches.slice(0, 8).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-2 border-b border-[#3B2316]/8 pb-2 last:border-none last:pb-0 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-[#1A241F] truncate">
                            Juara: {m.winnerName}
                          </div>
                          <div className="text-[#52615A]">
                            {new Date(m.playedAt).toLocaleDateString('id-ID')} &middot;{' '}
                            {m.players.length} pemain
                          </div>
                        </div>
                        <div className="font-mono-num font-bold text-[#0F4C3A] shrink-0">
                          {m.winnerScore} poin
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Missed Questions Review for Parents */}
            <div className="rounded-2xl border border-[#3B2316]/12 bg-white p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold text-[#0F4C3A]">
                Catatan Pendampingan Orang Tua (Soal yang Pernah Keliru)
              </h2>
              <p className="text-xs text-[#52615A] mt-0.5 mb-4">
                Bahan diskusi santai di rumah agar pemahaman anak semakin kuat
              </p>

              {aggregate.missedAttempts.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-[#0F4C3A] py-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Belum ada catatan kesalahan jawaban pada filter siswa yang dipilih.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aggregate.missedAttempts.slice(0, 10).map((item, idx) => (
                    <div
                      key={`${item.timestamp}-${idx}`}
                      className="rounded-xl border border-[#3B2316]/12 bg-[#FAF7EE] p-4 space-y-2"
                    >
                      <div className="text-xs text-[#52615A]">
                        {item.playerName} &middot; {item.pillarTitle} &middot; {item.difficulty}
                      </div>
                      <div className="text-sm font-semibold text-[#1A241F]">
                        {item.prompt}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-start gap-1.5 text-[#B91C1C]">
                          <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>Jawaban anak: {item.selectedOption}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-[#0F4C3A] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>Jawaban tepat: {item.correctOption}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#36453E] leading-relaxed pt-1 border-t border-[#3B2316]/10">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
