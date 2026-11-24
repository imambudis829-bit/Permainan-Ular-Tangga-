import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');

interface StoreShape {
  leaderboard: Array<{
    id: string;
    playerName: string;
    score: number;
    accuracy: number;
    correctCount: number;
    totalQuestions: number;
    reachedFinish: boolean;
    difficultyMode: string;
    playedAt: string;
  }>;
  reports: Array<{
    id: string;
    playedAt: string;
    difficultyMode: string;
    winnerName: string;
    winnerScore: number;
    totalTurns: number;
    players: unknown[];
    attempts: unknown[];
  }>;
}

function ensureStore(): StoreShape {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreShape = { leaderboard: [], reports: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
    };
  } catch {
    return { leaderboard: [], reports: [] };
  }
}

function saveStore(store: StoreShape): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/leaderboard', (req, res) => {
    const store = ensureStore();
    const modeFilter = sanitizeText(req.query.mode, 32);
    let entries = [...store.leaderboard];
    if (modeFilter && modeFilter !== 'semua') {
      entries = entries.filter((item) => item.difficultyMode === modeFilter);
    }
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime();
    });
    res.json({ entries: entries.slice(0, 100) });
  });

  app.post('/api/leaderboard', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const items = Array.isArray(body.entries) ? body.entries : [body];
    const store = ensureStore();
    let added = 0;

    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const id = sanitizeText(item.id, 80);
      const playerName = sanitizeText(item.playerName, 40);
      const score = Number(item.score);
      const accuracy = Number(item.accuracy);
      const correctCount = Number(item.correctCount ?? 0);
      const totalQuestions = Number(item.totalQuestions ?? 0);
      const reachedFinish = Boolean(item.reachedFinish);
      const difficultyMode = sanitizeText(item.difficultyMode, 24) || 'adaptif';
      const playedAt = sanitizeText(item.playedAt, 40) || new Date().toISOString();

      if (!id || !playerName || !Number.isFinite(score) || !Number.isFinite(accuracy)) {
        continue;
      }

      const exists = store.leaderboard.some((entry) => entry.id === id);
      if (!exists) {
        store.leaderboard.push({
          id,
          playerName,
          score: Math.max(-500, Math.min(5000, Math.round(score))),
          accuracy: Math.max(0, Math.min(100, Math.round(accuracy))),
          correctCount: Math.max(0, Math.round(correctCount)),
          totalQuestions: Math.max(0, Math.round(totalQuestions)),
          reachedFinish,
          difficultyMode,
          playedAt,
        });
        added += 1;
      }
    }

    if (added > 0) {
      store.leaderboard.sort((a, b) => b.score - a.score);
      store.leaderboard = store.leaderboard.slice(0, 500);
      saveStore(store);
    }

    res.status(201).json({ ok: true, added });
  });

  app.get('/api/reports', (_req, res) => {
    const store = ensureStore();
    const sorted = [...store.reports].sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
    res.json({ reports: sorted.slice(0, 100) });
  });

  app.post('/api/reports', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const items = Array.isArray(body.reports) ? body.reports : [body];
    const store = ensureStore();
    let added = 0;

    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const id = sanitizeText(item.id, 80);
      const playedAt = sanitizeText(item.playedAt, 40) || new Date().toISOString();
      const difficultyMode = sanitizeText(item.difficultyMode, 24) || 'adaptif';
      const winnerName = sanitizeText(item.winnerName, 40);
      const winnerScore = Number(item.winnerScore ?? 0);
      const totalTurns = Number(item.totalTurns ?? 0);

      if (!id || !winnerName || !Array.isArray(item.players)) {
        continue;
      }

      const exists = store.reports.some((rep) => rep.id === id);
      if (!exists) {
        store.reports.push({
          id,
          playedAt,
          difficultyMode,
          winnerName,
          winnerScore: Number.isFinite(winnerScore) ? Math.round(winnerScore) : 0,
          totalTurns: Number.isFinite(totalTurns) ? Math.round(totalTurns) : 0,
          players: item.players.slice(0, 10),
          attempts: Array.isArray(item.attempts) ? item.attempts.slice(0, 200) : [],
        });
        added += 1;
      }
    }

    if (added > 0) {
      store.reports = store.reports.slice(-200);
      saveStore(store);
    }

    res.status(201).json({ ok: true, added });
  });

  if (!isProduction) {
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript').send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    decline() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url) {
  return url;
}
export class ErrorOverlay {}
`);
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
