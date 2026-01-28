export type SoundType = "bell" | "chime" | "buzz" | "piano" | string; // Allow custom sound URLs

class AlarmSoundManager {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;

  async playSound(soundType: SoundType, duration: number = 60000): Promise<void> {
    console.log('[AlarmSound] Playing sound:', soundType, 'for', duration, 'ms');
    
    if (this.isPlaying) {
      console.log('[AlarmSound] Sound already playing, skipping');
      return;
    }
    this.isPlaying = true;

    try {
      // Check if it's a custom sound (starts with data: or http)
      if (soundType.startsWith("custom:") || soundType.startsWith("data:") || soundType.startsWith("http")) {
        await this.playCustomSound(soundType, duration);
        return;
      }

      // Initialize audio context on first use for built-in sounds
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        console.log('[AlarmSound] Audio context created');
      }

      const ctx = this.audioContext;
      
      // Resume audio context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
        console.log('[AlarmSound] Audio context resumed');
      }

      console.log('[AlarmSound] Playing built-in sound:', soundType);

      if (soundType === "bell") {
        this.playBell(ctx, duration);
      } else if (soundType === "chime") {
        this.playChime(ctx, duration);
      } else if (soundType === "buzz") {
        this.playBuzz(ctx, duration);
      } else if (soundType === "piano") {
        this.playPiano(ctx, duration);
      }
      
      console.log('[AlarmSound] Sound started successfully');
    } catch (error) {
      console.error("[AlarmSound] Failed to play alarm sound:", error);
      this.isPlaying = false;
    }
  }

  private async playCustomSound(soundUrl: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Extract the actual URL if it has custom: prefix
        const url = soundUrl.startsWith("custom:") ? soundUrl.substring(7) : soundUrl;
        
        this.currentAudio = new Audio(url);
        this.currentAudio.loop = true; // Loop the custom sound
        
        this.currentAudio.addEventListener('canplaythrough', () => {
          this.currentAudio?.play().catch(err => {
            console.error("Error playing custom sound:", err);
            this.isPlaying = false;
            reject(err);
          });
        });

        this.currentAudio.addEventListener('error', (e) => {
          console.error("Error loading custom sound:", e);
          this.isPlaying = false;
          reject(e);
        });

        // Stop after duration
        setTimeout(() => {
          if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
          }
          this.isPlaying = false;
          resolve();
        }, duration);

      } catch (error) {
        console.error("Failed to play custom sound:", error);
        this.isPlaying = false;
        reject(error);
      }
    });
  }

  private playBell(ctx: AudioContext, duration: number): void {
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    const frequencies = [800, 1200, 1600];
    let stopTime = ctx.currentTime + duration / 1000;

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.type = "sine";
      osc.connect(gainNode);

      const delay = idx * 0.05;
      osc.start(ctx.currentTime + delay);
      osc.stop(stopTime);
    });

    // Louder volume
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, stopTime);
    
    console.log('[AlarmSound] Bell sound configured');
  }

  private playChime(ctx: AudioContext, duration: number): void {
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    const notes = [
      { freq: 523.25, duration: 0.5 }, // C5
      { freq: 659.25, duration: 0.5 }, // E5
      { freq: 783.99, duration: 1 },   // G5
    ];

    let time = ctx.currentTime;
    let totalDuration = 0;
    const maxDuration = duration / 1000;

    while (totalDuration < maxDuration) {
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        osc.frequency.value = note.freq;
        osc.type = "sine";
        osc.connect(gainNode);

        osc.start(time);
        osc.stop(time + note.duration);
        time += note.duration + 0.1;
      });
      totalDuration = time - ctx.currentTime;
    }

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + maxDuration);
  }

  private playBuzz(ctx: AudioContext, duration: number): void {
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.frequency.value = 1000;
    osc.type = "square";
    osc.connect(gainNode);

    const stopTime = ctx.currentTime + duration / 1000;
    osc.start(ctx.currentTime);
    osc.stop(stopTime);

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, stopTime);
  }

  private playPiano(ctx: AudioContext, duration: number): void {
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    const pianoNotes = [261.63, 293.66, 329.63, 349.23]; // C, D, E, F

    let time = ctx.currentTime;
    const stopTime = ctx.currentTime + duration / 1000;

    while (time < stopTime) {
      pianoNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.frequency.value = freq;
        osc.type = "sine";
        osc.connect(gainNode);

        osc.start(time);
        osc.stop(time + 0.3);
      });
      time += 0.5;
    }

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, stopTime);
  }

  stopSound(): void {
    // Stop custom audio if playing
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      } catch (e) {
        console.error("Error stopping custom audio:", e);
      }
    }

    // Stop synthesized sound if playing
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // Already stopped
      }
      this.oscillator = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isPlaying = false;
  }
}

export const alarmSounds = new AlarmSoundManager();