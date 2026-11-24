class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.14,
    delay = 0,
    endFreq?: number
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playDiceRoll(): void {
    const freqs = [240, 310, 270, 360, 295, 420];
    freqs.forEach((f, idx) => {
      this.playTone(f, 0.05, 'triangle', 0.1, idx * 0.055);
    });
  }

  public playStep(stepIdx = 0): void {
    const base = 360 + (stepIdx % 6) * 28;
    this.playTone(base, 0.09, 'sine', 0.11, 0, base * 1.15);
  }

  public playLadderClimb(): void {
    const notes = [392, 493.88, 587.33, 659.25, 783.99];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.18, 'triangle', 0.13, idx * 0.07);
    });
  }

  public playSnakeSlide(): void {
    this.playTone(540, 0.48, 'sawtooth', 0.08, 0, 150);
    this.playTone(430, 0.45, 'triangle', 0.09, 0.06, 130);
  }

  public playShieldBlock(): void {
    this.playTone(523.25, 0.14, 'sine', 0.14, 0);
    this.playTone(783.99, 0.25, 'triangle', 0.15, 0.08);
  }

  public playBonus(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.2, 'sine', 0.12, idx * 0.065);
    });
  }

  public playCorrect(): void {
    this.playTone(523.25, 0.15, 'triangle', 0.14, 0);
    this.playTone(659.25, 0.18, 'triangle', 0.14, 0.09);
    this.playTone(783.99, 0.28, 'sine', 0.15, 0.18);
  }

  public playWrong(): void {
    this.playTone(260, 0.18, 'triangle', 0.14, 0, 210);
    this.playTone(196, 0.26, 'sine', 0.14, 0.14, 155);
  }

  public playVictory(): void {
    const melody = [
      { f: 523.25, d: 0.16, t: 0 },
      { f: 659.25, d: 0.16, t: 0.13 },
      { f: 783.99, d: 0.16, t: 0.26 },
      { f: 1046.5, d: 0.36, t: 0.4 },
      { f: 783.99, d: 0.15, t: 0.65 },
      { f: 1046.5, d: 0.55, t: 0.8 },
    ];
    melody.forEach((m) => {
      this.playTone(m.f, m.d, 'triangle', 0.16, m.t);
      this.playTone(m.f * 0.5, m.d, 'sine', 0.09, m.t);
    });
  }
}

export const soundEngine = new SoundEngine();
