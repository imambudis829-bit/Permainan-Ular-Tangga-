import { PILLAR_LIST } from '../data/questions';
import { MatchReportRecord, PillarPerformance } from '../types/game';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ParentAnalyticsAggregate {
  studentFilter: string;
  totalMatches: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
  highestScore: number;
  finishCount: number;
  pillarMap: Record<string, PillarPerformance>;
  difficultyMap: Record<'mudah' | 'sedang' | 'menantang', PillarPerformance>;
  missedAttempts: Array<{
    prompt: string;
    pillarTitle: string;
    difficulty: string;
    selectedOption: string;
    correctOption: string;
    explanation: string;
    playerName: string;
    timestamp: string;
  }>;
  recentMatches: MatchReportRecord[];
}

export function buildStandaloneHtmlReport(data: ParentAnalyticsAggregate): string {
  const generatedDate = new Date().toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const studentLabel =
    data.studentFilter === 'semua' ? 'Semua Siswa / Kelompok' : data.studentFilter;

  const pillarRowsHtml = PILLAR_LIST.map((p) => {
    const stat = data.pillarMap[p.title] || { correct: 0, wrong: 0 };
    const total = stat.correct + stat.wrong;
    const pct = total > 0 ? Math.round((stat.correct / total) * 100) : 0;
    const catLabel = p.category === 'rukun_iman' ? 'Rukun Iman' : 'Rukun Islam';
    const barColor = pct >= 75 ? '#0F4C3A' : pct >= 50 ? '#C89B3C' : '#B91C1C';
    return `
      <tr>
        <td><strong>${escapeHtml(p.title)}</strong><div class="sub">${catLabel} ke-${p.number}</div></td>
        <td class="num">${stat.correct}</td>
        <td class="num">${stat.wrong}</td>
        <td class="num"><strong>${total > 0 ? `${pct}%` : '-'}</strong></td>
        <td style="width: 180px;">
          <div class="bar-track"><div class="bar-fill" style="width: ${pct}%; background: ${barColor};"></div></div>
        </td>
      </tr>
    `;
  }).join('');

  const missedRowsHtml =
    data.missedAttempts.length === 0
      ? '<p class="empty">Alhamdulillah, belum ada catatan jawaban salah pada filter siswa ini.</p>'
      : data.missedAttempts
          .slice(0, 25)
          .map(
            (m) => `
          <div class="missed-card">
            <div class="missed-meta">${escapeHtml(m.playerName)} &middot; ${escapeHtml(m.pillarTitle)} &middot; Tingkat ${escapeHtml(m.difficulty)}</div>
            <div class="missed-q">${escapeHtml(m.prompt)}</div>
            <div class="missed-ans">
              <span class="wrong">Jawaban Anak: ${escapeHtml(m.selectedOption)}</span>
              <span class="right">Jawaban Benar: ${escapeHtml(m.correctOption)}</span>
            </div>
            <div class="missed-exp">Pembahasan: ${escapeHtml(m.explanation)}</div>
          </div>
        `
          )
          .join('');

  const matchRowsHtml = data.recentMatches
    .slice(0, 15)
    .map((m) => {
      const dateStr = new Date(m.playedAt).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      return `
        <tr>
          <td>${escapeHtml(dateStr)}</td>
          <td>${escapeHtml(m.winnerName)}</td>
          <td class="num">${m.winnerScore} poin</td>
          <td class="num">${m.players.length} pemain</td>
          <td>${escapeHtml(m.difficultyMode)}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Laporan Kemajuan Belajar — ${escapeHtml(studentLabel)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FBF8F1; color: #1A241F; margin: 0; padding: 32px 20px; line-height: 1.55; }
    .container { max-width: 960px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2DDD0; border-radius: 14px; overflow: hidden; }
    .header { background: #0F4C3A; color: #FBF8F1; padding: 28px 32px; border-bottom: 4px solid #C89B3C; }
    .header h1 { margin: 0 0 6px; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .section { padding: 24px 32px; border-bottom: 1px solid #EFECE2; }
    .section:last-child { border-bottom: none; }
    h2 { margin: 0 0 14px; font-size: 18px; color: #0F4C3A; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
    .kpi { background: #FBF8F1; border: 1px solid #E5DFD0; border-radius: 10px; padding: 14px 16px; }
    .kpi .label { font-size: 12px; color: #52615A; margin-bottom: 4px; }
    .kpi .val { font-size: 22px; font-weight: 700; color: #0F4C3A; font-variant-numeric: tabular-nums; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #EFECE2; vertical-align: middle; }
    th { font-size: 12px; color: #52615A; background: #FAF7EE; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .sub { font-size: 12px; color: #52615A; }
    .bar-track { width: 100%; height: 10px; background: #EAE4D3; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; }
    .missed-card { background: #FAF7EE; border: 1px solid #E6E0D2; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; }
    .missed-meta { font-size: 12px; color: #52615A; margin-bottom: 6px; }
    .missed-q { font-weight: 600; margin-bottom: 8px; }
    .missed-ans { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; margin-bottom: 6px; }
    .wrong { color: #B91C1C; font-weight: 600; }
    .right { color: #0F4C3A; font-weight: 600; }
    .missed-exp { font-size: 13px; color: #36453E; }
    .empty { font-size: 14px; color: #52615A; }
    .footer { text-align: center; padding: 18px; font-size: 12px; color: #52615A; background: #FAF7EE; }
    @media print { body { background: #FFF; padding: 0; } .container { border: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Laporan Kemajuan Belajar Orang Tua — Jejak Hikmah</h1>
      <p>Peserta: <strong>${escapeHtml(studentLabel)}</strong> &middot; Dicetak pada ${escapeHtml(generatedDate)}</p>
    </div>

    <div class="section">
      <h2>Ringkasan Capaian Belajar</h2>
      <div class="kpi-grid">
        <div class="kpi"><div class="label">Total Sesi Permainan</div><div class="val">${data.totalMatches}</div></div>
        <div class="kpi"><div class="label">Akurasi Kuis Keseluruhan</div><div class="val">${data.accuracy}%</div></div>
        <div class="kpi"><div class="label">Jawaban Benar / Salah</div><div class="val">${data.totalCorrect} / ${data.totalWrong}</div></div>
        <div class="kpi"><div class="label">Skor Tertinggi Dicapai</div><div class="val">${data.highestScore}</div></div>
        <div class="kpi"><div class="label">Mencapai Kotak 100</div><div class="val">${data.finishCount}x</div></div>
      </div>
    </div>

    <div class="section">
      <h2>Penguasaan Materi Rukun Iman &amp; Rukun Islam</h2>
      <table>
        <thead>
          <tr>
            <th>Materi Pilar</th>
            <th class="num">Benar</th>
            <th class="num">Salah</th>
            <th class="num">Akurasi</th>
            <th>Penguasaan</th>
          </tr>
        </thead>
        <tbody>
          ${pillarRowsHtml}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Topik yang Perlu Pendampingan Orang Tua</h2>
      ${missedRowsHtml}
    </div>

    <div class="section">
      <h2>Riwayat Sesi Terbaru</h2>
      ${
        data.recentMatches.length === 0
          ? '<p class="empty">Belum ada riwayat sesi yang tercatat.</p>'
          : `<table>
              <thead>
                <tr>
                  <th>Tanggal Sesi</th>
                  <th>Pemenang</th>
                  <th class="num">Skor Pemenang</th>
                  <th class="num">Jumlah Pemain</th>
                  <th>Mode Soal</th>
                </tr>
              </thead>
              <tbody>${matchRowsHtml}</tbody>
            </table>`
      }
    </div>

    <div class="footer">
      Dokumen laporan mandiri dari permainan edukasi Jejak Hikmah &mdash; dapat dibuka kapan saja dalam mode offline.
    </div>
  </div>
</body>
</html>`;
}

export function downloadStandaloneHtmlReport(data: ParentAnalyticsAggregate): void {
  const html = buildStandaloneHtmlReport(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeName = (data.studentFilter === 'semua' ? 'Semua_Siswa' : data.studentFilter)
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .slice(0, 30);
  const dateStamp = new Date().toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `Laporan_Belajar_${safeName}_${dateStamp}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
