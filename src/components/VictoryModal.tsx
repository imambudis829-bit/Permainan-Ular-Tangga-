import React, { useEffect, useRef } from 'react';
import { Award, BarChart3, RotateCcw, Trophy } from 'lucide-react';
import { Player } from '../types/game';

interface VictoryModalProps {
  players: Player[];
  onPlayAgain: () => void;
  onOpenLeaderboard: () => void;
  onOpenParentDashboard: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  players,
  onPlayAgain,
  onOpenLeaderboard,
  onOpenParentDashboard,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rankedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.reachedFinish !== b.reachedFinish) return a.reachedFinish ? -1 : 1;
    if (b.position !== a.position) return b.position - a.position;
    return b.correctCount - a.correctCount;
  });

  const winner = rankedPlayers[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let animId = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#C89B3C', '#E5BE67', '#0F4C3A', '#1D8362', '#0E7490', '#FBF8F1'];
    const particles = Array.from({ length: 95 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 6 + Math.random() * 7,
      h: 8 + Math.random() * 9,
      vy: 2.2 + Math.random() * 3.2,
      vx: -1.4 + Math.random() * 2.8,
      rot: Math.random() * Math.PI * 2,
      vRot: -0.08 + Math.random() * 0.16,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241F]/75 p-4 overflow-y-auto">
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#C89B3C]/40 bg-[#FBF8F1] shadow-2xl overflow-hidden my-auto">
        <div className="bg-[#0F4C3A] px-6 py-6 text-center text-[#FBF8F1] border-b-4 border-[#C89B3C]">
          <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-[#E5BE67] bg-[#0B392B] shadow-lg">
            <img
              src="/src/assets/images/badge_islamic_crest_1795513755072.jpg"
              alt="Lencana Kemenangan Jejak Hikmah"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="text-xs font-medium tracking-wide text-[#E5BE67]">
            Petualangan Selesai &middot; Istana Hikmah Kotak 100
          </div>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-balance">
            Selamat, {winner?.name}!
          </h2>
          <p className="mt-1.5 text-sm text-[#FBF8F1]/85">
            Juara Utama dengan total{' '}
            <span className="font-mono-num font-bold text-[#E5BE67]">
              {winner?.score ?? 0} poin
            </span>
            {winner?.reachedFinish ? ' (termasuk +100 bonus mencapai kotak 100)' : ''}
          </p>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-semibold text-[#52615A] mb-3">
            Klasemen Akhir Pemain
          </h3>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-[#3B2316]/12 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF7EE] text-xs text-[#52615A] border-b border-[#3B2316]/10">
                <tr>
                  <th className="py-2.5 px-3 text-left">Peringkat</th>
                  <th className="py-2.5 px-3 text-left">Pemain</th>
                  <th className="py-2.5 px-3 text-right">Kotak</th>
                  <th className="py-2.5 px-3 text-right">Benar/Salah</th>
                  <th className="py-2.5 px-3 text-right">Total Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3B2316]/10">
                {rankedPlayers.map((p, idx) => (
                  <tr key={p.id} className={idx === 0 ? 'bg-[#C89B3C]/10 font-semibold' : ''}>
                    <td className="py-2.5 px-3 font-mono-num">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: p.color }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                        >
                          {p.tokenSymbol}
                        </span>
                        <span className="truncate max-w-[140px]">{p.name}</span>
                        {p.reachedFinish && (
                          <span className="text-[11px] font-semibold text-[#0F4C3A]">
                            (Finish 100)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num">{p.position}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num">
                      {p.correctCount}/{p.wrongCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num font-bold text-[#0F4C3A]">
                      {p.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F4C3A] px-4 py-3 text-sm font-semibold text-[#FBF8F1] hover:bg-[#145E48] transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Main Lagi
            </button>
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3B2316]/20 bg-white px-4 py-3 text-sm font-semibold text-[#1A241F] hover:bg-[#FAF7EE] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 text-[#C89B3C]" />
              Peringkat Global
            </button>
            <button
              type="button"
              onClick={onOpenParentDashboard}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3B2316]/20 bg-white px-4 py-3 text-sm font-semibold text-[#1A241F] hover:bg-[#FAF7EE] transition-colors cursor-pointer whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4 text-[#0E7490]" />
              Dasbor Orang Tua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
