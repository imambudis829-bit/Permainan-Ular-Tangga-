import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, BookOpen, ArrowRight } from 'lucide-react';
import { DrawnQuestion, Player } from '../types/game';

interface QuizModalProps {
  question: DrawnQuestion;
  player: Player;
  onComplete: (selectedIndex: number, isCorrect: boolean) => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export const QuizModal: React.FC<QuizModalProps> = ({ question, player, onComplete }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const isAnswered = selectedIdx !== null;
  const isCorrect = selectedIdx === question.shuffledCorrectIndex;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isAnswered) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = Number(e.key) - 1;
          if (idx < question.shuffledOptions.length) {
            setSelectedIdx(idx);
          }
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onComplete(selectedIdx, selectedIdx === question.shuffledCorrectIndex);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAnswered, selectedIdx, question, onComplete]);

  const categoryText =
    question.category === 'rukun_iman' ? 'Rukun Iman' : 'Rukun Islam';
  const difficultyText =
    question.difficulty === 'mudah'
      ? 'Tingkat Mudah'
      : question.difficulty === 'sedang'
      ? 'Tingkat Sedang'
      : 'Tingkat Sulit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A241F]/65 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#0F4C3A]/20 bg-[#FBF8F1] shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-[#0F4C3A]/12 bg-[#0F4C3A] px-6 py-4 text-[#FBF8F1]">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-5 h-5 text-[#E5BE67] shrink-0" />
            <div className="truncate">
              <div className="text-sm font-semibold truncate">
                Giliran {player.name}
              </div>
              <div className="text-xs text-[#FBF8F1]/80">
                {categoryText} &middot; {question.pillarTitle} &middot; {difficultyText}
              </div>
            </div>
          </div>
          <div className="font-mono-num text-xs font-semibold text-[#E5BE67] whitespace-nowrap shrink-0">
            +10 Benar / -5 Salah
          </div>
        </div>

        {/* Question Body */}
        <div className="p-6">
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#1A241F] leading-snug">
            {question.prompt}
          </h3>

          <div className="mt-5 space-y-2.5">
            {question.shuffledOptions.map((option, idx) => {
              const isThisSelected = selectedIdx === idx;
              const isThisCorrect = idx === question.shuffledCorrectIndex;

              let buttonStyle =
                'border-[#3B2316]/15 bg-white text-[#1A241F] hover:border-[#0F4C3A] hover:bg-emerald-50/60';
              if (isAnswered) {
                if (isThisCorrect) {
                  buttonStyle =
                    'border-[#0F4C3A] bg-[#0F4C3A]/10 text-[#0F4C3A] font-semibold';
                } else if (isThisSelected && !isThisCorrect) {
                  buttonStyle =
                    'border-[#B91C1C] bg-[#B91C1C]/10 text-[#B91C1C]';
                } else {
                  buttonStyle = 'border-[#3B2316]/10 bg-white/60 text-[#52615A]';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => setSelectedIdx(idx)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm sm:text-base transition-colors cursor-pointer disabled:cursor-default ${buttonStyle}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono-num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-current/25 text-xs font-bold">
                      {OPTION_LABELS[idx]}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>

                  {isAnswered && isThisCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-[#0F4C3A] shrink-0" />
                  )}
                  {isAnswered && isThisSelected && !isThisCorrect && (
                    <XCircle className="w-5 h-5 text-[#B91C1C] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation */}
          {isAnswered && (
            <div className="mt-5 rounded-xl border border-[#3B2316]/15 bg-white p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#0F4C3A]" />
                      <span className="text-[#0F4C3A]">
                        MasyaAllah, Jawaban Benar! (+10 Poin)
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-[#B91C1C]" />
                      <span className="text-[#B91C1C]">
                        Kurang Tepat (-5 Poin)
                      </span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-[#36453E] leading-relaxed">
                {question.explanation}
              </p>

              <button
                type="button"
                onClick={() => onComplete(selectedIdx, isCorrect)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C3A] px-5 py-3 text-sm font-semibold text-[#FBF8F1] hover:bg-[#145E48] transition-colors cursor-pointer whitespace-nowrap"
              >
                Lanjutkan Permainan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
