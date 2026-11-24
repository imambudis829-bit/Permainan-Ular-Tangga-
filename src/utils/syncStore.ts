import {
  DifficultyMode,
  LeaderboardEntry,
  MatchReportRecord,
  PendingSyncPayload,
} from '../types/game';

const LOCAL_LEADERBOARD_KEY = 'jejak_hikmah_leaderboard_v1';
const LOCAL_REPORTS_KEY = 'jejak_hikmah_reports_v1';
const PENDING_QUEUE_KEY = 'jejak_hikmah_sync_queue_v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function getLocalLeaderboard(): LeaderboardEntry[] {
  const list = readJson<LeaderboardEntry[]>(LOCAL_LEADERBOARD_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function getLocalReports(): MatchReportRecord[] {
  const list = readJson<MatchReportRecord[]>(LOCAL_REPORTS_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function getPendingQueue(): PendingSyncPayload[] {
  const list = readJson<PendingSyncPayload[]>(PENDING_QUEUE_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function enqueueAndSaveMatchResults(
  leaderboardEntries: LeaderboardEntry[],
  report: MatchReportRecord
): void {
  // 1. Save locally immediately (100% offline ready)
  const existingLb = getLocalLeaderboard();
  const mergedLb = [...leaderboardEntries, ...existingLb].slice(0, 300);
  writeJson(LOCAL_LEADERBOARD_KEY, mergedLb);

  const existingReports = getLocalReports();
  const mergedReports = [report, ...existingReports].slice(0, 100);
  writeJson(LOCAL_REPORTS_KEY, mergedReports);

  // 2. Add to offline sync outbox queue
  const queue = getPendingQueue();
  for (const entry of leaderboardEntries) {
    queue.push({
      id: `q-lb-${entry.id}`,
      kind: 'leaderboard',
      data: entry,
      createdAt: new Date().toISOString(),
    });
  }
  queue.push({
    id: `q-rep-${report.id}`,
    kind: 'report',
    data: report,
    createdAt: new Date().toISOString(),
  });
  writeJson(PENDING_QUEUE_KEY, queue);
}

export async function flushPendingSyncQueue(): Promise<{ synced: number; remaining: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, remaining: getPendingQueue().length };
  }

  const queue = getPendingQueue();
  if (queue.length === 0) {
    return { synced: 0, remaining: 0 };
  }

  const lbItems = queue
    .filter((item) => item.kind === 'leaderboard')
    .map((item) => item.data as LeaderboardEntry);
  const reportItems = queue
    .filter((item) => item.kind === 'report')
    .map((item) => item.data as MatchReportRecord);

  let lbOk = lbItems.length === 0;
  let repOk = reportItems.length === 0;

  try {
    if (lbItems.length > 0) {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: lbItems }),
      });
      if (res.ok) lbOk = true;
    }
    if (reportItems.length > 0) {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: reportItems }),
      });
      if (res.ok) repOk = true;
    }
  } catch {
    return { synced: 0, remaining: queue.length };
  }

  const remainingQueue = queue.filter((item) => {
    if (item.kind === 'leaderboard' && lbOk) return false;
    if (item.kind === 'report' && repOk) return false;
    return true;
  });

  writeJson(PENDING_QUEUE_KEY, remainingQueue);
  return {
    synced: queue.length - remainingQueue.length,
    remaining: remainingQueue.length,
  };
}

export async function fetchGlobalLeaderboard(
  modeFilter: DifficultyMode | 'semua' = 'semua'
): Promise<{ entries: LeaderboardEntry[]; source: 'cloud' | 'offline' }> {
  const local = getLocalLeaderboard();
  const filterLocal = (items: LeaderboardEntry[]) =>
    modeFilter === 'semua' ? items : items.filter((e) => e.difficultyMode === modeFilter);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      entries: filterLocal(local).sort((a, b) => b.score - a.score || b.accuracy - a.accuracy),
      source: 'offline',
    };
  }

  try {
    await flushPendingSyncQueue();
    const res = await fetch(`/api/leaderboard?mode=${encodeURIComponent(modeFilter)}`);
    if (!res.ok) throw new Error('Network error');
    const json = (await res.json()) as { entries: LeaderboardEntry[] };
    const cloudEntries = Array.isArray(json.entries) ? json.entries : [];

    // Merge any unsynced local entries by id
    const seen = new Set(cloudEntries.map((e) => e.id));
    const combined = [...cloudEntries];
    for (const item of filterLocal(local)) {
      if (!seen.has(item.id)) {
        combined.push(item);
        seen.add(item.id);
      }
    }
    combined.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);
    return { entries: combined.slice(0, 100), source: 'cloud' };
  } catch {
    return {
      entries: filterLocal(local).sort((a, b) => b.score - a.score || b.accuracy - a.accuracy),
      source: 'offline',
    };
  }
}

export async function fetchAllReports(): Promise<{
  reports: MatchReportRecord[];
  source: 'cloud' | 'offline';
}> {
  const local = getLocalReports();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { reports: local, source: 'offline' };
  }

  try {
    await flushPendingSyncQueue();
    const res = await fetch('/api/reports');
    if (!res.ok) throw new Error('Network error');
    const json = (await res.json()) as { reports: MatchReportRecord[] };
    const cloudReports = Array.isArray(json.reports) ? json.reports : [];
    const seen = new Set(cloudReports.map((r) => r.id));
    const merged = [...cloudReports];
    for (const item of local) {
      if (!seen.has(item.id)) {
        merged.push(item);
        seen.add(item.id);
      }
    }
    merged.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
    return { reports: merged, source: 'cloud' };
  } catch {
    return { reports: local, source: 'offline' };
  }
}
