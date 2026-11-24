import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Compass,
  Dices,
  Home,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  BarChart3,
} from 'lucide-react';
import { Board2D } from './components/Board2D';
import { LeaderboardView } from './components/LeaderboardView';
import { ParentDashboardView } from './components/ParentDashboardView';
import { OfflineIndicator } from './components/PWAControls';
import { QuizModal } from './components/QuizModal';
import {
  PLAYER_PRESETS,
  PlayerDraft,
  TitleSetupScreen,
} from './components/TitleSetupScreen';
import { VictoryModal } from './components/VictoryModal';
import { BOARD_TILES, SNAKES_AND_LADDERS } from './data/boardConfig';
import { drawShuffledQuestion } from './data/questions';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  DifficultyMode,
  DrawnQuestion,
  GameScreen,
  LeaderboardEntry,
  MatchReportRecord,
  Player,
  QuestionAttemptRecord,
  TileConfig,
} from './types/game';
import { soundEngine } from './utils/sound';
import {
  enqueueAndSaveMatchResults,
  flushPendingSyncQueue,
  getPendingQueue,
} from './utils/syncStore';

function createInitialDrafts(): PlayerDraft[] {
  return [
    {
      id: 'p-1',
      name: 'Pemain 1',
      color: PLAYER_PRESETS[0].color,
      tokenSymbol: PLAYER_PRESETS[0].symbol,
    },
    {
      id: 'p-2',
      name: 'Pemain 2',
      color: PLAYER_PRESETS[1].color,
      tokenSymbol: PLAYER_PRESETS[1].symbol,
    },
  ];
}

function draftsToPlayers(drafts: PlayerDraft[]): Player[] {
  return drafts.map((d, idx) => ({
    id: d.id,
    name: d.name.trim() || `Pemain ${idx + 1}`,
    color: d.color,
    bgClass: '',
    tokenSymbol: d.tokenSymbol,
    position: 1,
    score: 0,
    hasShield: false,
    correctCount: 0,
    wrongCount: 0,
    bonusCount: 0,
    snakesHit: 0,
    laddersClimbed: 0,
    reachedFinish: false,
    pillarStats: {},
  }));
}

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const pipsMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const active = pipsMap[value] || pipsMap[1];

  return (
    <div
      className={`grid h-14 w-14 grid-cols-3 grid-rows-3 gap-1 rounded-xl border-2 border-[#3B2316] bg-[#FBF8F1] p-2 shadow-md ${
        rolling ? 'animate-dice-shake' : ''
      }`}
    >
      {Array.from({ length: 9 }, (_, idx) => (
        <div key={idx} className="flex items-center justify-center">
          {active.includes(idx) && (
            <span className="h-2.5 w-2.5 rounded-full bg-[#0F4C3A]" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('TITLE_MENU');
  const [drafts, setDrafts] = useState<PlayerDraft[]>(createInitialDrafts);
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode>('mudah');

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [isAnimatingMove, setIsAnimatingMove] = useState(false);
  const [totalTurns, setTotalTurns] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const [selectedTile, setSelectedTile] = useState<TileConfig | null>(BOARD_TILES[0]);
  const [highlightedTile, setHighlightedTile] = useState<number | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<DrawnQuestion | null>(null);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<QuestionAttemptRecord[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => getPendingQueue().length);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const sessionUsedQuestionIdsRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<number[]>([]);
  const isOnline = useOnlineStatus();

  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // Automatic background flush of offline outbox queue when back online
  const handleSyncNow = useCallback(async () => {
    const result = await flushPendingSyncQueue();
    setPendingSyncCount(result.remaining);
  }, []);

  useEffect(() => {
    if (isOnline) {
      handleSyncNow();
    }
  }, [isOnline, handleSyncNow]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  // Setup Roster Handlers (1–10 Players)
  const handleAddDraftPlayer = () => {
    setDrafts((prev) => {
      if (prev.length >= 10) return prev;
      const nextNum = prev.length + 1;
      const preset = PLAYER_PRESETS[(nextNum - 1) % PLAYER_PRESETS.length];
      return [
        ...prev,
        {
          id: `p-${Date.now()}-${nextNum}`,
          name: `Pemain ${nextNum}`,
          color: preset.color,
          tokenSymbol: String(nextNum),
        },
      ];
    });
  };

  const handleRemoveDraftPlayer = (id: string) => {
    setDrafts((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({
        ...p,
        tokenSymbol: String(idx + 1),
      }));
    });
  };

  const handleRenameDraftPlayer = (id: string, name: string) => {
    setDrafts((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  // Mid-game Add Player (up to 10 players)
  const handleAddPlayerInGame = () => {
    if (isGameFinished || isRolling || isAnimatingMove || activeQuestion) return;
    setPlayers((prev) => {
      if (prev.length >= 10) return prev;
      const nextNum = prev.length + 1;
      const preset = PLAYER_PRESETS[(nextNum - 1) % PLAYER_PRESETS.length];
      const newPlayer: Player = {
        id: `p-live-${Date.now()}`,
        name: `Pemain ${nextNum}`,
        color: preset.color,
        bgClass: '',
        tokenSymbol: String(nextNum),
        position: 1,
        score: 0,
        hasShield: false,
        correctCount: 0,
        wrongCount: 0,
        bonusCount: 0,
        snakesHit: 0,
        laddersClimbed: 0,
        reachedFinish: false,
        pillarStats: {},
      };
      setActivityLog((logs) => [`${newPlayer.name} bergabung ke papan petualangan.`, ...logs].slice(0, 12));
      return [...prev, newPlayer];
    });
  };

  const handleStartEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingNameValue(player.name);
  };

  const handleCommitEditPlayer = (playerId: string) => {
    const trimmed = editingNameValue.trim().slice(0, 28);
    if (trimmed) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, name: trimmed } : p))
      );
      setDrafts((prev) =>
        prev.map((d) => (d.id === playerId ? { ...d, name: trimmed } : d))
      );
    }
    setEditingPlayerId(null);
  };

  const finalizeAndPersistMatch = useCallback(
    (finalPlayers: Player[], finalAttempts: QuestionAttemptRecord[], turnsCount: number) => {
      const nowIso = new Date().toISOString();
      const ranked = [...finalPlayers].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.reachedFinish !== b.reachedFinish) return a.reachedFinish ? -1 : 1;
        return b.position - a.position;
      });
      const winner = ranked[0];

      const lbEntries: LeaderboardEntry[] = ranked.map((p, idx) => {
        const totQ = p.correctCount + p.wrongCount;
        const acc = totQ > 0 ? Math.round((p.correctCount / totQ) * 100) : 0;
        return {
          id: `lb-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          playerName: p.name,
          score: p.score,
          accuracy: acc,
          correctCount: p.correctCount,
          totalQuestions: totQ,
          reachedFinish: p.reachedFinish,
          difficultyMode,
          playedAt: nowIso,
        };
      });

      const report: MatchReportRecord = {
        id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        playedAt: nowIso,
        difficultyMode,
        winnerName: winner?.name || 'Pemain 1',
        winnerScore: winner?.score || 0,
        totalTurns: turnsCount,
        players: ranked.map((p, idx) => {
          const totQ = p.correctCount + p.wrongCount;
          return {
            name: p.name,
            score: p.score,
            position: p.position,
            correctCount: p.correctCount,
            wrongCount: p.wrongCount,
            accuracy: totQ > 0 ? Math.round((p.correctCount / totQ) * 100) : 0,
            reachedFinish: p.reachedFinish,
            rank: idx + 1,
            pillarStats: p.pillarStats,
          };
        }),
        attempts: finalAttempts,
      };

      enqueueAndSaveMatchResults(lbEntries, report);
      setPendingSyncCount(getPendingQueue().length);
      flushPendingSyncQueue().then((res) => setPendingSyncCount(res.remaining));
    },
    [difficultyMode]
  );

  const startNewGame = useCallback(() => {
    clearAllTimers();
    sessionUsedQuestionIdsRef.current.clear();
    const initialPlayers = draftsToPlayers(drafts);
    setPlayers(initialPlayers);
    setCurrentPlayerIndex(0);
    setDiceValue(1);
    setIsRolling(false);
    setIsAnimatingMove(false);
    setTotalTurns(0);
    setSelectedTile(BOARD_TILES[0]);
    setHighlightedTile(1);
    setActiveQuestion(null);
    setIsGameFinished(false);
    setAttempts([]);
    setActivityLog([
      `Petualangan dimulai dengan ${initialPlayers.length} pemain (${difficultyMode.toUpperCase()}).`,
    ]);
    setScreen('PLAYING');
  }, [clearAllTimers, drafts, difficultyMode]);

  const advanceTurn = useCallback(
    (playerCount: number) => {
      setIsAnimatingMove(false);
      setCurrentPlayerIndex((prev) => (prev + 1) % playerCount);
    },
    []
  );

  const resolveTileLanding = useCallback(
    (
      landedTileNum: number,
      playerIdx: number,
      currentPlayers: Player[],
      currentAttempts: QuestionAttemptRecord[],
      turnsCount: number
    ) => {
      const tile = BOARD_TILES[landedTileNum - 1];
      setSelectedTile(tile);
      setHighlightedTile(landedTileNum);
      const actor = currentPlayers[playerIdx];

      // 1. Check Finish Tile 100 (+100 Bonus Points!)
      if (landedTileNum === 100) {
        const updated = currentPlayers.map((p, idx) =>
          idx === playerIdx
            ? {
                ...p,
                position: 100,
                score: p.score + 100,
                reachedFinish: true,
              }
            : p
        );
        setPlayers(updated);
        setActivityLog((logs) =>
          [`${actor.name} mencapai Kotak 100! Mendapat +100 poin bonus finish!`, ...logs].slice(0, 12)
        );
        soundEngine.playVictory();
        setIsAnimatingMove(false);
        setIsGameFinished(true);
        finalizeAndPersistMatch(updated, currentAttempts, turnsCount);
        return;
      }

      // 2. Check Snake or Ladder
      const connector = SNAKES_AND_LADDERS.find((item) => item.from === landedTileNum);
      if (connector) {
        if (connector.kind === 'ladder') {
          soundEngine.playLadderClimb();
          const updated = currentPlayers.map((p, idx) =>
            idx === playerIdx
              ? {
                  ...p,
                  position: connector.to,
                  laddersClimbed: p.laddersClimbed + 1,
                }
              : p
          );
          setActivityLog((logs) =>
            [
              `${actor.name} menaiki ${connector.name} dari kotak ${connector.from} ke ${connector.to}!`,
              ...logs,
            ].slice(0, 12)
          );
          scheduleTimer(() => {
            setPlayers(updated);
            setHighlightedTile(connector.to);
            setSelectedTile(BOARD_TILES[connector.to - 1]);
            advanceTurn(updated.length);
          }, 420);
          return;
        }

        // Snake
        if (actor.hasShield) {
          soundEngine.playShieldBlock();
          const updated = currentPlayers.map((p, idx) =>
            idx === playerIdx ? { ...p, hasShield: false } : p
          );
          setPlayers(updated);
          setActivityLog((logs) =>
            [
              `Perisai Anti-Ular melindungi ${actor.name} dari ${connector.name} di kotak ${connector.from}!`,
              ...logs,
            ].slice(0, 12)
          );
          scheduleTimer(() => advanceTurn(updated.length), 550);
          return;
        }

        soundEngine.playSnakeSlide();
        const updated = currentPlayers.map((p, idx) =>
          idx === playerIdx
            ? {
                ...p,
                position: connector.to,
                snakesHit: p.snakesHit + 1,
              }
            : p
        );
        setActivityLog((logs) =>
          [
            `${actor.name} bertemu ${connector.name}, turun dari kotak ${connector.from} ke ${connector.to}.`,
            ...logs,
          ].slice(0, 12)
        );
        scheduleTimer(() => {
          setPlayers(updated);
          setHighlightedTile(connector.to);
          setSelectedTile(BOARD_TILES[connector.to - 1]);
          advanceTurn(updated.length);
        }, 480);
        return;
      }

      // 3. Check Bonus Tile
      if (tile.type === 'bonus') {
        soundEngine.playBonus();
        if (tile.bonusEffect === 'points_15' || tile.bonusEffect === 'points_20') {
          const pts = tile.bonusEffect === 'points_20' ? 20 : 15;
          const updated = currentPlayers.map((p, idx) =>
            idx === playerIdx
              ? { ...p, score: p.score + pts, bonusCount: p.bonusCount + 1 }
              : p
          );
          setPlayers(updated);
          setActivityLog((logs) =>
            [`${actor.name} mendapat ${tile.title}: +${pts} poin keberkahan!`, ...logs].slice(0, 12)
          );
          scheduleTimer(() => advanceTurn(updated.length), 500);
          return;
        }

        if (tile.bonusEffect === 'shield') {
          const updated = currentPlayers.map((p, idx) =>
            idx === playerIdx
              ? { ...p, hasShield: true, bonusCount: p.bonusCount + 1 }
              : p
          );
          setPlayers(updated);
          setActivityLog((logs) =>
            [`${actor.name} memperoleh ${tile.title} (Perisai Anti-Ular)!`, ...logs].slice(0, 12)
          );
          scheduleTimer(() => advanceTurn(updated.length), 500);
          return;
        }

        if (tile.bonusEffect === 'step_2') {
          const boostedPos = Math.min(100, landedTileNum + 2);
          const updated = currentPlayers.map((p, idx) =>
            idx === playerIdx
              ? { ...p, position: boostedPos, bonusCount: p.bonusCount + 1 }
              : p
          );
          setPlayers(updated);
          setActivityLog((logs) =>
            [`${actor.name} mendapat ${tile.title}: maju ke kotak ${boostedPos}!`, ...logs].slice(0, 12)
          );
          scheduleTimer(() => {
            resolveTileLanding(boostedPos, playerIdx, updated, currentAttempts, turnsCount);
          }, 420);
          return;
        }
      }

      // 4. Check Quiz Tile
      if (tile.type === 'quiz') {
        const drawn = drawShuffledQuestion(
          difficultyMode,
          landedTileNum,
          sessionUsedQuestionIdsRef.current
        );
        setActiveQuestion(drawn);
        return;
      }

      // 5. Normal Tile
      setActivityLog((logs) =>
        [`${actor.name} berhenti di Kotak ${landedTileNum}.`, ...logs].slice(0, 12)
      );
      advanceTurn(currentPlayers.length);
    },
    [advanceTurn, difficultyMode, finalizeAndPersistMatch, scheduleTimer]
  );

  const handleRollDice = useCallback(() => {
    if (
      screen !== 'PLAYING' ||
      isRolling ||
      isAnimatingMove ||
      activeQuestion ||
      isGameFinished ||
      players.length === 0
    ) {
      return;
    }

    setIsRolling(true);
    soundEngine.playDiceRoll();

    const rollOutcome = Math.floor(Math.random() * 6) + 1;
    let tick = 0;

    const spinRoll = () => {
      tick += 1;
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      if (tick < 6) {
        scheduleTimer(spinRoll, 65);
      } else {
        setDiceValue(rollOutcome);
        setIsRolling(false);
        setIsAnimatingMove(true);

        const nextTurns = totalTurns + 1;
        setTotalTurns(nextTurns);

        const actorIdx = currentPlayerIndex;
        const startPos = players[actorIdx].position;
        const targetPos = Math.min(100, startPos + rollOutcome);
        const totalSteps = targetPos - startPos;

        if (totalSteps === 0) {
          resolveTileLanding(targetPos, actorIdx, players, attempts, nextTurns);
          return;
        }

        let currentStep = 0;
        const stepForward = () => {
          currentStep += 1;
          const nextPos = startPos + currentStep;
          soundEngine.playStep(currentStep);

          setPlayers((prev) =>
            prev.map((p, idx) => (idx === actorIdx ? { ...p, position: nextPos } : p))
          );
          setHighlightedTile(nextPos);

          if (currentStep < totalSteps) {
            scheduleTimer(stepForward, 190);
          } else {
            const updatedPlayers = players.map((p, idx) =>
              idx === actorIdx ? { ...p, position: targetPos } : p
            );
            scheduleTimer(() => {
              resolveTileLanding(targetPos, actorIdx, updatedPlayers, attempts, nextTurns);
            }, 220);
          }
        };

        scheduleTimer(stepForward, 160);
      }
    };

    scheduleTimer(spinRoll, 65);
  }, [
    activeQuestion,
    attempts,
    currentPlayerIndex,
    isAnimatingMove,
    isGameFinished,
    isRolling,
    players,
    resolveTileLanding,
    scheduleTimer,
    screen,
    totalTurns,
  ]);

  // Spacebar shortcut to roll dice
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'PLAYING') return;
      if (activeQuestion || isGameFinished) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleRollDice();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeQuestion, handleRollDice, isGameFinished, screen]);

  const handleQuizComplete = (selectedIdx: number, isCorrect: boolean) => {
    if (!activeQuestion) return;
    const actor = players[currentPlayerIndex];
    const delta = isCorrect ? 10 : -5;

    if (isCorrect) {
      soundEngine.playCorrect();
    } else {
      soundEngine.playWrong();
    }

    const attempt: QuestionAttemptRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      playerName: actor.name,
      questionId: activeQuestion.id,
      category: activeQuestion.category,
      pillarTitle: activeQuestion.pillarTitle,
      difficulty: activeQuestion.difficulty,
      prompt: activeQuestion.prompt,
      selectedOption: activeQuestion.shuffledOptions[selectedIdx] || '-',
      correctOption: activeQuestion.shuffledOptions[activeQuestion.shuffledCorrectIndex] || '-',
      isCorrect,
      pointsDelta: delta,
      explanation: activeQuestion.explanation,
    };

    const nextAttempts = [attempt, ...attempts];
    setAttempts(nextAttempts);

    const updatedPlayers = players.map((p, idx) => {
      if (idx !== currentPlayerIndex) return p;
      const prevPillar = p.pillarStats[activeQuestion.pillarTitle] || { correct: 0, wrong: 0 };
      return {
        ...p,
        score: p.score + delta,
        correctCount: p.correctCount + (isCorrect ? 1 : 0),
        wrongCount: p.wrongCount + (isCorrect ? 0 : 1),
        pillarStats: {
          ...p.pillarStats,
          [activeQuestion.pillarTitle]: {
            correct: prevPillar.correct + (isCorrect ? 1 : 0),
            wrong: prevPillar.wrong + (isCorrect ? 0 : 1),
          },
        },
      };
    });

    setPlayers(updatedPlayers);
    setActivityLog((logs) =>
      [
        `${actor.name} menjawab kuis ${activeQuestion.pillarTitle}: ${
          isCorrect ? 'Benar (+10 poin)' : 'Salah (-5 poin)'
        }.`,
        ...logs,
      ].slice(0, 12)
    );
    setActiveQuestion(null);
    advanceTurn(updatedPlayers.length);
  };

  if (screen === 'TITLE_MENU') {
    return (
      <>
        <TitleSetupScreen
          drafts={drafts}
          difficultyMode={difficultyMode}
          onAddPlayer={handleAddDraftPlayer}
          onRemovePlayer={handleRemoveDraftPlayer}
          onRenamePlayer={handleRenameDraftPlayer}
          onChangeDifficulty={setDifficultyMode}
          onStartGame={startNewGame}
          onOpenLeaderboard={() => setScreen('LEADERBOARD')}
          onOpenParentDashboard={() => setScreen('PARENT_DASHBOARD')}
        />
        <OfflineIndicator pendingSyncCount={pendingSyncCount} onSyncNow={handleSyncNow} />
      </>
    );
  }

  if (screen === 'LEADERBOARD') {
    return (
      <>
        <LeaderboardView onBack={() => setScreen(players.length > 0 ? 'PLAYING' : 'TITLE_MENU')} />
        <OfflineIndicator pendingSyncCount={pendingSyncCount} onSyncNow={handleSyncNow} />
      </>
    );
  }

  if (screen === 'PARENT_DASHBOARD') {
    return (
      <>
        <ParentDashboardView onBack={() => setScreen(players.length > 0 ? 'PLAYING' : 'TITLE_MENU')} />
        <OfflineIndicator pendingSyncCount={pendingSyncCount} onSyncNow={handleSyncNow} />
      </>
    );
  }

  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#1A241F]">
      {/* Compact Game Arena Header */}
      <header className="border-b border-[#3B2316]/12 bg-white/85 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <button
              type="button"
              onClick={() => {
                clearAllTimers();
                setScreen('TITLE_MENU');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B2316]/15 bg-[#FBF8F1] px-3 py-1.5 text-xs sm:text-sm font-medium text-[#1A241F] hover:bg-[#EFE8D5] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Home className="w-4 h-4" />
              Menu Utama
            </button>
            <span className="font-display text-base sm:text-lg font-bold text-[#0F4C3A]">
              Jejak Hikmah
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setScreen('LEADERBOARD')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B2316]/15 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-[#1A241F] hover:bg-[#FAF7EE] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trophy className="w-4 h-4 text-[#C89B3C]" />
              Peringkat Global
            </button>
            <button
              type="button"
              onClick={() => setScreen('PARENT_DASHBOARD')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B2316]/15 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-[#1A241F] hover:bg-[#FAF7EE] cursor-pointer whitespace-nowrap shrink-0"
            >
              <BarChart3 className="w-4 h-4 text-[#0E7490]" />
              Dasbor Orang Tua
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#3B2316]/15 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-[#1A241F] hover:bg-[#FAF7EE] cursor-pointer whitespace-nowrap shrink-0"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-[#B91C1C]" />
                  <span>Bisukan</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[#0F4C3A]" />
                  <span>Suara Aktif</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Playfield + Low-Occlusion Side HUD */}
      <main className="mx-auto grid max-w-[1360px] grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:grid-cols-12 lg:items-start">
        {/* Left/Center 2D Interactive Board (7 cols) */}
        <section className="lg:col-span-7">
          <Board2D
            players={players}
            currentPlayerIndex={currentPlayerIndex}
            selectedTile={selectedTile}
            onSelectTile={(tile) => setSelectedTile(tile)}
            highlightedTile={highlightedTile}
          />
        </section>

        {/* Right Control, Tile Inspector, and 1–10 Player Scoreboard (5 cols) */}
        <aside className="lg:col-span-5 space-y-4">
          {/* Active Turn & Dice Control Card */}
          {currentPlayer && (
            <div className="rounded-2xl border border-[#0F4C3A]/20 bg-[#0F4C3A] p-5 text-[#FBF8F1] shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-[#E5BE67] font-medium">
                    Giliran Bermain Sekarang
                  </div>
                  <div className="mt-1 flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: currentPlayer.color }}
                      className="font-mono-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white"
                    >
                      {currentPlayer.tokenSymbol}
                    </span>
                    <span className="font-display text-xl font-bold truncate">
                      {currentPlayer.name}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-[#FBF8F1]/80 font-mono-num">
                    Kotak {currentPlayer.position} / 100 &middot; Poin: {currentPlayer.score}
                    {currentPlayer.hasShield ? ' · Perisai Aktif' : ''}
                  </div>
                </div>

                <DiceFace value={diceValue} rolling={isRolling} />
              </div>

              <button
                type="button"
                onClick={handleRollDice}
                disabled={isRolling || isAnimatingMove || !!activeQuestion || isGameFinished}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C89B3C] px-5 py-3 text-base font-bold text-[#1A241F] hover:bg-[#D7AB4C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
              >
                <Dices className="w-5 h-5" />
                {isRolling
                  ? 'Mengocok Dadu...'
                  : isAnimatingMove
                  ? 'Melangkah...'
                  : 'Lempar Dadu (Spasi)'}
              </button>
            </div>
          )}

          {/* Interactive Tile Inspector */}
          {selectedTile && (
            <div className="rounded-2xl border border-[#3B2316]/12 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#0E7490] shrink-0" />
                  <span className="font-mono-num text-xs font-bold text-[#0F4C3A]">
                    KOTAK #{selectedTile.index}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#52615A]">
                  {selectedTile.type === 'quiz' && 'Tantangan Kuis'}
                  {selectedTile.type === 'bonus' && 'Kotak Bonus'}
                  {selectedTile.type === 'ladder' && `Tangga → ${selectedTile.targetIndex}`}
                  {selectedTile.type === 'snake' && `Ular → ${selectedTile.targetIndex}`}
                  {selectedTile.type === 'finish' && 'Finish (+100 Poin)'}
                  {selectedTile.type === 'start' && 'Titik Awal'}
                  {selectedTile.type === 'normal' && 'Pos Hikmah'}
                </span>
              </div>
              <h3 className="mt-1 font-display text-base font-bold text-[#1A241F]">
                {selectedTile.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#36453E] leading-relaxed">
                {selectedTile.fact}
              </p>
            </div>
          )}

          {/* 1–10 Players Live Scoreboard + Tambah Pemain Button */}
          <div className="rounded-2xl border border-[#3B2316]/12 bg-white p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="font-display text-base font-bold text-[#0F4C3A]">
                Papan Skor ({players.length}/10 Pemain)
              </h2>
              {players.length < 10 && !isGameFinished && (
                <button
                  type="button"
                  onClick={handleAddPlayerInGame}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0F4C3A]/10 px-2.5 py-1.5 text-xs font-semibold text-[#0F4C3A] hover:bg-[#0F4C3A]/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Pemain
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-[#3B2316]/8">
              {players.map((p, idx) => {
                const isTurn = idx === currentPlayerIndex;
                const isEditing = editingPlayerId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-2 py-2 px-2 rounded-lg ${
                      isTurn ? 'bg-[#C89B3C]/12' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        style={{ backgroundColor: p.color }}
                        className="font-mono-num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      >
                        {p.tokenSymbol}
                      </span>
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              maxLength={28}
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCommitEditPlayer(p.id);
                                if (e.key === 'Escape') setEditingPlayerId(null);
                              }}
                              onBlur={() => handleCommitEditPlayer(p.id)}
                              aria-label={`Ubah nama ${p.name}`}
                              className="w-full min-w-0 rounded border border-[#0F4C3A] bg-white px-2 py-0.5 text-xs sm:text-sm font-semibold text-[#1A241F] focus:outline-none"
                            />
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCommitEditPlayer(p.id);
                              }}
                              aria-label="Simpan nama pemain"
                              className="rounded bg-[#0F4C3A] p-1 text-white hover:bg-[#145E48] cursor-pointer shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm font-semibold text-[#1A241F] flex items-center gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditPlayer(p)}
                              title="Klik untuk ganti nama pemain"
                              className="inline-flex items-center gap-1.5 truncate hover:text-[#0F4C3A] cursor-pointer text-left min-w-0"
                            >
                              <span className="truncate">{p.name}</span>
                              <Pencil className="w-3 h-3 text-[#52615A]/70 shrink-0" />
                            </button>
                            {p.hasShield && (
                              <Shield className="w-3.5 h-3.5 text-[#0E7490] shrink-0" />
                            )}
                          </div>
                        )}
                        <div className="text-[11px] text-[#52615A] font-mono-num">
                          Kotak {p.position} &middot; {p.correctCount}B / {p.wrongCount}S
                        </div>
                      </div>
                    </div>

                    <div className="font-mono-num text-sm font-bold text-[#0F4C3A] shrink-0">
                      {p.score} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Activity Log */}
          <div className="rounded-2xl border border-[#3B2316]/12 bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#52615A] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />
              <span>Jejak Langkah Terbaru</span>
            </div>
            <ul className="space-y-1.5 max-h-28 overflow-y-auto text-xs text-[#36453E]">
              {activityLog.map((item, idx) => (
                <li key={idx} className="leading-snug">
                  &bull; {item}
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-2.5 border-t border-[#3B2316]/10 flex flex-wrap items-center gap-3 text-[11px] text-[#52615A]">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-[#0E7490]" /> Kuis (+10/-5)
              </span>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#B47D18]" /> Bonus &amp; Perisai
              </span>
              <span className="inline-flex items-center gap-1">
                <Award className="w-3 h-3 text-[#0F4C3A]" /> Finish 100 (+100)
              </span>
            </div>
          </div>
        </aside>
      </main>

      {activeQuestion && currentPlayer && (
        <QuizModal
          question={activeQuestion}
          player={currentPlayer}
          onComplete={handleQuizComplete}
        />
      )}

      {isGameFinished && (
        <VictoryModal
          players={players}
          onPlayAgain={startNewGame}
          onOpenLeaderboard={() => setScreen('LEADERBOARD')}
          onOpenParentDashboard={() => setScreen('PARENT_DASHBOARD')}
        />
      )}

      <OfflineIndicator pendingSyncCount={pendingSyncCount} onSyncNow={handleSyncNow} />
    </div>
  );
}
