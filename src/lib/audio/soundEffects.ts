// Web Audio Engine de Baixa Latência para a Urna Eletrônica

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private keyBuffer: AudioBuffer | null = null;
  private endBuffer: AudioBuffer | null = null;
  private isUnlocked = false;
  private isPreloading = false;
  private isReady = false;

  private keyFallbackAudio: HTMLAudioElement | null = null;
  private endFallbackAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.setupGlobalUnlock();
      this.preload();
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  private setupGlobalUnlock() {
    const unlock = () => {
      this.unlock();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("click", unlock);
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
    window.addEventListener("click", unlock, { passive: true });
  }

  public unlock(): void {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    this.isUnlocked = true;
  }

  public async preload(): Promise<void> {
    if (this.isPreloading || this.isReady || typeof window === "undefined") return;
    this.isPreloading = true;

    try {
      // HTML5 Audio Fallback instances
      this.keyFallbackAudio = new Audio("/assets/audio/tecla.mp3");
      this.keyFallbackAudio.preload = "auto";
      this.endFallbackAudio = new Audio("/assets/audio/fim.mp3");
      this.endFallbackAudio.preload = "auto";

      const ctx = this.getAudioContext();
      if (ctx) {
        const [keyRes, endRes] = await Promise.all([
          fetch("/assets/audio/tecla.mp3").then((r) => r.arrayBuffer()),
          fetch("/assets/audio/fim.mp3").then((r) => r.arrayBuffer()),
        ]);

        const [decodedKey, decodedEnd] = await Promise.all([
          ctx.decodeAudioData(keyRes),
          ctx.decodeAudioData(endRes),
        ]);

        this.keyBuffer = decodedKey;
        this.endBuffer = decodedEnd;
        this.isReady = true;
      }
    } catch {
      // Fallback to HTMLAudioElement if Web Audio decoding fails
      this.isReady = true;
    } finally {
      this.isPreloading = false;
    }
  }

  public playKeySound(): void {
    this.unlock();
    const ctx = this.getAudioContext();

    if (ctx && this.keyBuffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = this.keyBuffer;
        source.connect(ctx.destination);
        source.start(0);
        return;
      } catch {
        // Fallback below
      }
    }

    // HTML5 fallback
    if (this.keyFallbackAudio) {
      try {
        const sound = this.keyFallbackAudio.cloneNode() as HTMLAudioElement;
        sound.play().catch(() => {});
      } catch {
        // Ignore errors
      }
    }
  }

  public playEndSound(): void {
    this.unlock();
    const ctx = this.getAudioContext();

    if (ctx && this.endBuffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = this.endBuffer;
        source.connect(ctx.destination);
        source.start(0);
        return;
      } catch {
        // Fallback below
      }
    }

    // HTML5 fallback
    if (this.endFallbackAudio) {
      try {
        const sound = this.endFallbackAudio.cloneNode() as HTMLAudioElement;
        sound.play().catch(() => {});
      } catch {
        // Ignore errors
      }
    }
  }

  public get ready(): boolean {
    return this.isReady;
  }
}

export const soundEffects = new SoundEngine();
