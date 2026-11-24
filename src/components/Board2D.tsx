import React, { useMemo } from 'react';
import { Award, BookOpen, Flag, Shield, Sparkles } from 'lucide-react';
import {
  getGridDisplayOrder,
  getTilePosition,
  SNAKES_AND_LADDERS,
} from '../data/boardConfig';
import { Player, SnakeOrLadder, TileConfig } from '../types/game';

interface Board2DProps {
  players: Player[];
  currentPlayerIndex: number;
  selectedTile: TileConfig | null;
  onSelectTile: (tile: TileConfig) => void;
  highlightedTile: number | null;
}

function buildLadderGeometry(item: SnakeOrLadder) {
  const start = getTilePosition(item.from);
  const end = getTilePosition(item.to);
  const dx = end.cx - start.cx;
  const dy = end.cy - start.cy;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  // Perpendicular vector
  const px = -uy;
  const py = ux;
  const halfWidth = 17;

  const rail1Start = { x: start.cx + px * halfWidth, y: start.cy + py * halfWidth };
  const rail1End = { x: end.cx + px * halfWidth, y: end.cy + py * halfWidth };
  const rail2Start = { x: start.cx - px * halfWidth, y: start.cy - py * halfWidth };
  const rail2End = { x: end.cx - px * halfWidth, y: end.cy - py * halfWidth };

  const rungCount = Math.max(4, Math.floor(length / 46));
  const rungs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 1; i < rungCount; i += 1) {
    const t = i / rungCount;
    const cx = start.cx + dx * t;
    const cy = start.cy + dy * t;
    rungs.push({
      x1: cx + px * (halfWidth + 2),
      y1: cy + py * (halfWidth + 2),
      x2: cx - px * (halfWidth + 2),
      y2: cy - py * (halfWidth + 2),
    });
  }

  return { rail1Start, rail1End, rail2Start, rail2End, rungs };
}

function buildSnakeGeometry(item: SnakeOrLadder, seedIndex: number) {
  const head = getTilePosition(item.from);
  const tail = getTilePosition(item.to);
  const dx = tail.cx - head.cx;
  const dy = tail.cy - head.cy;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;

  const dir = seedIndex % 2 === 0 ? 1 : -1;
  const amp1 = Math.min(82, Math.max(46, length * 0.22)) * dir;
  const amp2 = Math.min(82, Math.max(46, length * 0.22)) * -dir;

  // 4-point smooth S-curve sampled into tapered polygon + spine path
  const p0 = { x: head.cx, y: head.cy };
  const p1 = {
    x: head.cx + dx * 0.32 + px * amp1,
    y: head.cy + dy * 0.32 + py * amp1,
  };
  const p2 = {
    x: head.cx + dx * 0.68 + px * amp2,
    y: head.cy + dy * 0.68 + py * amp2,
  };
  const p3 = { x: tail.cx, y: tail.cy };

  const evalBezier = (t: number) => {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    return {
      x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
      y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
    };
  };

  const samples = 28;
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= samples; i += 1) {
    pts.push(evalBezier(i / samples));
  }

  const leftEdge: Array<{ x: number; y: number }> = [];
  const rightEdge: Array<{ x: number; y: number }> = [];
  const spots: Array<{ x: number; y: number; r: number }> = [];

  for (let i = 0; i < pts.length; i += 1) {
    const curr = pts[i];
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tLen = Math.hypot(tx, ty) || 1;
    const nx = -ty / tLen;
    const ny = tx / tLen;

    const progress = i / (pts.length - 1);
    // Taper body from 15px near neck down to 3px at tail tip
    const radius = 15 * (1 - progress * 0.78) + (progress < 0.12 ? 2 : 0);
    leftEdge.push({ x: curr.x + nx * radius, y: curr.y + ny * radius });
    rightEdge.push({ x: curr.x - nx * radius, y: curr.y - ny * radius });

    if (i > 1 && i < pts.length - 2 && i % 2 === 0) {
      spots.push({ x: curr.x, y: curr.y, r: Math.max(2.5, radius * 0.45) });
    }
  }

  const bodyPolygon = [
    ...leftEdge.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
    ...rightEdge.reverse().map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
  ].join(' ');

  const spinePath = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${p1.x.toFixed(1)} ${p1.y.toFixed(
    1
  )}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}, ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`;

  // Head angle pointing slightly away from neck
  const neck = pts[2];
  const headAngleDeg = (Math.atan2(head.cy - neck.y, head.cx - neck.x) * 180) / Math.PI;

  return { head, tail, bodyPolygon, spinePath, spots, headAngleDeg };
}

export const Board2D: React.FC<Board2DProps> = ({
  players,
  currentPlayerIndex,
  selectedTile,
  onSelectTile,
  highlightedTile,
}) => {
  const displayTiles = useMemo(() => getGridDisplayOrder(), []);
  const ladders = useMemo(
    () => SNAKES_AND_LADDERS.filter((item) => item.kind === 'ladder'),
    []
  );
  const snakes = useMemo(
    () => SNAKES_AND_LADDERS.filter((item) => item.kind === 'snake'),
    []
  );

  // Group players by tile so multiple tokens arrange cleanly in one tile
  const playersByTile = useMemo(() => {
    const map = new Map<number, Array<{ player: Player; idx: number }>>();
    players.forEach((player, idx) => {
      const list = map.get(player.position) || [];
      list.push({ player, idx });
      map.set(player.position, list);
    });
    return map;
  }, [players]);

  return (
    <div className="relative w-full max-w-[740px] mx-auto select-none">
      {/* Mahogany & Emerald outer wooden frame */}
      <div className="relative rounded-2xl border-4 border-[#3B2316] bg-[#3B2316] p-2 sm:p-3 shadow-xl">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-[#C89B3C]/60 bg-[#FBF8F1]">
          {/* Subtle generated parchment texture backdrop */}
          <img
            src="/src/assets/images/board_parchment_texture_1795513754578.jpg"
            alt="Tekstur papan perkamen Petualangan Islami"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
          />

          {/* 10x10 Interactive Grid */}
          <div className="relative z-10 grid h-full w-full grid-cols-10 grid-rows-10">
            {displayTiles.map((tile) => {
              const row = Math.floor((tile.index - 1) / 10);
              const isWarmAlt = (tile.index + row) % 2 === 0;
              const isSelected = selectedTile?.index === tile.index;
              const isHighlighted = highlightedTile === tile.index;

              let tileBg = isWarmAlt ? 'bg-[#FBF8F1]/82' : 'bg-[#EFE8D5]/82';
              if (tile.type === 'start') tileBg = 'bg-[#0F4C3A]/15';
              if (tile.type === 'finish') tileBg = 'bg-[#C89B3C]/30';
              if (tile.type === 'quiz') tileBg = 'bg-[#0E7490]/10';
              if (tile.type === 'bonus') tileBg = 'bg-[#C89B3C]/16';

              return (
                <button
                  key={tile.index}
                  type="button"
                  onClick={() => onSelectTile(tile)}
                  aria-label={`Kotak ${tile.index}: ${tile.title}`}
                  className={`group relative flex flex-col justify-between border border-[#3B2316]/15 p-0.5 sm:p-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#0F4C3A] cursor-pointer ${tileBg} ${
                    isSelected ? 'ring-2 ring-inset ring-[#0F4C3A] bg-[#0F4C3A]/15' : ''
                  } ${isHighlighted ? 'ring-2 ring-inset ring-[#C89B3C]' : ''} hover:bg-[#C89B3C]/22`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span
                      className={`font-mono-num text-[10px] sm:text-xs font-bold leading-none ${
                        tile.type === 'finish'
                          ? 'text-[#3B2316]'
                          : tile.type === 'start'
                          ? 'text-[#0F4C3A]'
                          : 'text-[#3B2316]/80'
                      }`}
                    >
                      {tile.index}
                    </span>

                    {tile.type === 'quiz' && (
                      <BookOpen className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#0E7490] shrink-0" />
                    )}
                    {tile.type === 'bonus' && (
                      <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#B47D18] shrink-0" />
                    )}
                    {tile.type === 'finish' && (
                      <Award className="w-3 h-3 sm:w-4 sm:h-4 text-[#9A6E14] shrink-0" />
                    )}
                    {tile.type === 'start' && (
                      <Flag className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#0F4C3A] shrink-0" />
                    )}
                  </div>

                  {/* Subtle bottom label on key tiles */}
                  {tile.type === 'finish' && (
                    <span className="hidden sm:block text-[9px] font-bold uppercase tracking-tight text-[#3B2316] leading-none">
                      Finish
                    </span>
                  )}
                  {tile.type === 'start' && (
                    <span className="hidden sm:block text-[9px] font-bold uppercase tracking-tight text-[#0F4C3A] leading-none">
                      Mulai
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Realistic 2D Ladders & Snakes SVG Overlay */}
          <svg
            viewBox="0 0 1000 1000"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="woodRailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6D4323" />
                <stop offset="50%" stopColor="#A96E3B" />
                <stop offset="100%" stopColor="#563218" />
              </linearGradient>
              <linearGradient id="woodRungGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D7A16B" />
                <stop offset="100%" stopColor="#7C4D27" />
              </linearGradient>
              <linearGradient id="snakeEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="50%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>
              <linearGradient id="snakeCrimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDBA74" />
                <stop offset="50%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <filter id="pieceShadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="2" dy="4" stdDeviation="3.5" floodColor="#1A120B" floodOpacity="0.24" />
              </filter>
            </defs>

            {/* 1. Render Realistic Wooden & Rope Ladders */}
            {ladders.map((ladder) => {
              const g = buildLadderGeometry(ladder);
              return (
                <g key={ladder.id} filter="url(#pieceShadow)" opacity="0.93">
                  {/* Rungs */}
                  {g.rungs.map((r, i) => (
                    <g key={i}>
                      <line
                        x1={r.x1}
                        y1={r.y1}
                        x2={r.x2}
                        y2={r.y2}
                        stroke="#4A2B14"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <line
                        x1={r.x1}
                        y1={r.y1}
                        x2={r.x2}
                        y2={r.y2}
                        stroke="url(#woodRungGrad)"
                        strokeWidth="6.5"
                        strokeLinecap="round"
                      />
                      {/* Rope knots on both sides */}
                      <circle cx={r.x1} cy={r.y1} r="4.5" fill="#DEC79F" stroke="#5A4223" strokeWidth="1.2" />
                      <circle cx={r.x2} cy={r.y2} r="4.5" fill="#DEC79F" stroke="#5A4223" strokeWidth="1.2" />
                    </g>
                  ))}

                  {/* Side Wooden Rails */}
                  <line
                    x1={g.rail1Start.x}
                    y1={g.rail1Start.y}
                    x2={g.rail1End.x}
                    y2={g.rail1End.y}
                    stroke="#3B2316"
                    strokeWidth="11"
                    strokeLinecap="round"
                  />
                  <line
                    x1={g.rail1Start.x}
                    y1={g.rail1Start.y}
                    x2={g.rail1End.x}
                    y2={g.rail1End.y}
                    stroke="url(#woodRailGrad)"
                    strokeWidth="7.5"
                    strokeLinecap="round"
                  />

                  <line
                    x1={g.rail2Start.x}
                    y1={g.rail2Start.y}
                    x2={g.rail2End.x}
                    y2={g.rail2End.y}
                    stroke="#3B2316"
                    strokeWidth="11"
                    strokeLinecap="round"
                  />
                  <line
                    x1={g.rail2Start.x}
                    y1={g.rail2Start.y}
                    x2={g.rail2End.x}
                    y2={g.rail2End.y}
                    stroke="url(#woodRailGrad)"
                    strokeWidth="7.5"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* 2. Render Friendly Kid-Style 2D Illustrated Snakes */}
            {snakes.map((snake, idx) => {
              const g = buildSnakeGeometry(snake, idx);
              const isEmerald = snake.palette === 'emerald';
              const bodyFill = isEmerald ? 'url(#snakeEmeraldGrad)' : 'url(#snakeCrimsonGrad)';
              const spotFill = isEmerald ? '#FEF08A' : '#FEF3C7';
              const outlineColor = isEmerald ? '#14532D' : '#9A3412';

              return (
                <g key={snake.id} filter="url(#pieceShadow)" opacity="0.95">
                  {/* Smooth rounded playful serpent body */}
                  <polygon
                    points={g.bodyPolygon}
                    fill={bodyFill}
                    stroke={outlineColor}
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                  />
                  {/* Cheerful polka-dot pattern */}
                  {g.spots.map((spot, sIdx) => (
                    <circle
                      key={sIdx}
                      cx={spot.x}
                      cy={spot.y}
                      r={spot.r * 1.05}
                      fill={spotFill}
                      opacity="0.88"
                    />
                  ))}
                  {/* Soft belly shine highlight */}
                  <path
                    d={g.spinePath}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeOpacity="0.32"
                    strokeLinecap="round"
                  />
                  {/* Cute rounded tail tip */}
                  <circle cx={g.tail.cx} cy={g.tail.cy} r="5" fill={spotFill} stroke={outlineColor} strokeWidth="1.5" />

                  {/* Cute Expressive Kid-Friendly Head at `from` tile */}
                  <g transform={`translate(${g.head.cx}, ${g.head.cy}) rotate(${g.headAngleDeg})`}>
                    {/* Tiny playful rounded tongue */}
                    <path
                      d="M 19 0 Q 25 -2 27 0 Q 25 2 19 0"
                      fill="#FB7185"
                      stroke="#E11D48"
                      strokeWidth="1.2"
                    />
                    {/* Friendly chubby rounded head */}
                    <ellipse
                      cx="2"
                      cy="0"
                      rx="19"
                      ry="15.5"
                      fill={bodyFill}
                      stroke={outlineColor}
                      strokeWidth="2.5"
                    />
                    {/* Rosy cheeks */}
                    <circle cx="4" cy="-9.5" r="3.4" fill="#FDA4AF" opacity="0.85" />
                    <circle cx="4" cy="9.5" r="3.4" fill="#FDA4AF" opacity="0.85" />
                    {/* Big friendly cartoon eyes with sparkle */}
                    <circle cx="7" cy="-6.2" r="5.6" fill="#FFFFFF" stroke={outlineColor} strokeWidth="1.3" />
                    <circle cx="7" cy="6.2" r="5.6" fill="#FFFFFF" stroke={outlineColor} strokeWidth="1.3" />
                    <circle cx="8.4" cy="-6.2" r="3.1" fill="#1F2937" />
                    <circle cx="8.4" cy="6.2" r="3.1" fill="#1F2937" />
                    <circle cx="9.6" cy="-7.4" r="1.2" fill="#FFFFFF" />
                    <circle cx="9.6" cy="5.0" r="1.2" fill="#FFFFFF" />
                    {/* Gentle smile curve */}
                    <path
                      d="M 13 -3.5 Q 16.5 0 13 3.5"
                      fill="none"
                      stroke={outlineColor}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              );
            })}
          </svg>

          {/* 3. Player Tokens Layer (1–10 Players, crisp CSS transform transitions) */}
          <div className="pointer-events-none absolute inset-0 z-30">
            {Array.from(playersByTile.entries()).map(([tileNum, group]) => {
              const pos = getTilePosition(tileNum);
              const baseLeftPct = pos.colFromLeft * 10 + 5;
              const baseTopPct = pos.rowFromTop * 10 + 5;

              return group.map(({ player, idx }, slotIdx) => {
                // Cluster offset for up to 10 tokens sharing one tile
                const count = group.length;
                let offsetX = 0;
                let offsetY = 0;
                if (count > 1) {
                  const angle = (slotIdx / count) * Math.PI * 2;
                  const dist = count <= 4 ? 1.8 : 2.5;
                  offsetX = Math.cos(angle) * dist;
                  offsetY = Math.sin(angle) * dist;
                }

                const isActive = idx === currentPlayerIndex;

                return (
                  <div
                    key={player.id}
                    style={{
                      left: `${baseLeftPct + offsetX}%`,
                      top: `${baseTopPct + offsetY}%`,
                      transform: 'translate(-50%, -50%)',
                      transitionProperty: 'left, top, transform',
                      transitionDuration: '190ms',
                      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    className={`absolute flex items-center justify-center ${
                      isActive ? 'z-40' : 'z-30'
                    }`}
                  >
                    <div
                      style={{ backgroundColor: player.color }}
                      className={`relative flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-white text-[10px] sm:text-xs font-bold text-white shadow-md ${
                        isActive ? 'ring-2 ring-[#C89B3C] scale-115 animate-token-hop' : ''
                      }`}
                      title={`${player.name} (Kotak ${player.position})`}
                    >
                      <span>{player.tokenSymbol}</span>
                      {player.hasShield && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0E7490] text-white border border-white">
                          <Shield className="w-2 h-2" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
