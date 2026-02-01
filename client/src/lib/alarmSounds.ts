export type SoundType = "bell" | "chime" | "buzz" | "piano" | string; // Allow custom sound URLs

class AlarmSoundManager {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private scheduledOscillators: OscillatorNode[] = []; // Track all scheduled oscillators

  async playSound(soundType: SoundType, duration: number = 60000): Promise<void> {
    console.log('[AlarmSound] Playing sound:', soundType, 'for', duration, 'ms');
    
    if (this.isPlaying) {
      console.log('[AlarmSound] Sound already playing, stopping previous first');
      this.stopSound();
    }
    
    // Clear any previously scheduled oscillators
    this.scheduledOscillators = [];
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
        console.log('[AlarmSound] Audio context created, state:', this.audioContext.state);
      }

      const ctx = this.audioContext;
      
      // CRITICAL: Resume audio context if suspended (browser autoplay policy)
      // This is required on mobile browsers
      if (ctx.state === 'suspended') {
        console.log('[AlarmSound] Audio context suspended, attempting to resume...');
        try {
          await ctx.resume();
          console.log('[AlarmSound] Audio context resumed successfully, state:', ctx.state);
        } catch (err) {
          console.error('[AlarmSound] Failed to resume audio context:', err);
          throw new Error('Cannot play sound - audio context suspended. Please interact with the page first.');
        }
      }
      
      // Double check state
      if (ctx.state !== 'running') {
        console.error('[AlarmSound] Audio context not running, state:', ctx.state);
        throw new Error('Cannot play sound - audio not ready. Try tapping the screen first.');
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
    try {
      // Extract the actual URL if it has custom: prefix
      const url = soundUrl.startsWith("custom:") ? soundUrl.substring(7) : soundUrl;
      
      console.log('[AlarmSound] Loading custom sound, length:', url.length);
      
      this.currentAudio = new Audio(url);
      this.currentAudio.loop = true; // Loop the custom sound
      this.currentAudio.volume = 1.0; // Max volume
      
      // Try to play immediately - this works better on mobile
      try {
        await this.currentAudio.play();
        console.log('[AlarmSound] ✅ Custom sound playing successfully');
      } catch (playErr) {
        console.error("[AlarmSound] ❌ Error playing custom sound immediately:", playErr);
        
        // If immediate play fails, wait for loadeddata and try again
        await new Promise((resolve, reject) => {
          this.currentAudio!.addEventListener('loadeddata', async () => {
            try {
              console.log('[AlarmSound] Custom sound loaded, retrying play');
              await this.currentAudio!.play();
              console.log('[AlarmSound] ✅ Custom sound playing after load');
              resolve(true);
            } catch (err) {
              console.error("[AlarmSound] ❌ Error playing custom sound after load:", err);
              reject(err);
            }
          });
          
          this.currentAudio!.addEventListener('error', (e) => {
            console.error("❌ Error loading custom sound:", e);
            reject(e);
          });
          
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Custom sound load timeout')), 5000);
        });
      }
    } catch (error) {
      console.error("Failed to play custom sound:", error);
      this.isPlaying = false;
      throw error;
    }
  }

  private playBell(ctx: AudioContext, duration: number): void {
    console.log('[AlarmSound] Starting bell sound for', duration / 1000, 'seconds');
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime); // Louder volume

    const frequencies = [800, 1200, 1600];
    const bellInterval = 1500; // Ring every 1.5 seconds
    const startTime = Date.now();
    const endTime = startTime + duration;

    // Function to play one bell ring
    const playOneBell = () => {
      if (Date.now() >= endTime || !this.isPlaying) {
        console.log('[AlarmSound] Bell sound finished or stopped');
        return;
      }

      const currentCtx = this.audioContext;
      if (!currentCtx || currentCtx.state === 'closed') {
        console.log('[AlarmSound] AudioContext closed, stopping bell');
        return;
      }

      // Create a new gain node for this bell ring
      const bellGain = currentCtx.createGain();
      bellGain.connect(gainNode);
      bellGain.gain.setValueAtTime(1, currentCtx.currentTime);

      frequencies.forEach((freq, idx) => {
        const osc = currentCtx.createOscillator();
        osc.frequency.value = freq;
        osc.type = "sine";
        osc.connect(bellGain);

        const delay = idx * 0.05;
        osc.start(currentCtx.currentTime + delay);
        osc.stop(currentCtx.currentTime + delay + 0.8);
        this.scheduledOscillators.push(osc);
      });

      // Schedule next bell ring
      setTimeout(playOneBell, bellInterval);
    };

    // Start the bell loop
    playOneBell();
    console.log('[AlarmSound] Bell sound loop started');
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
        this.scheduledOscillators.push(osc); // Track for cleanup
        time += note.duration + 0.1;
      });
      totalDuration = time - ctx.currentTime;
    }

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + maxDuration);
    console.log('[AlarmSound] Chime sound configured with looping for', duration / 1000, 'seconds');
  }

  private playBuzz(ctx: AudioContext, duration: number): void {
    console.log('[AlarmSound] Starting buzz sound for', duration / 1000, 'seconds');
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime); // Louder volume

    const buzzInterval = 800; // Buzz every 800ms (500ms buzz + 300ms pause)
    const startTime = Date.now();
    const endTime = startTime + duration;

    // Function to play one buzz
    const playOneBuzz = () => {
      if (Date.now() >= endTime || !this.isPlaying) {
        console.log('[AlarmSound] Buzz sound finished or stopped');
        return;
      }

      const currentCtx = this.audioContext;
      if (!currentCtx || currentCtx.state === 'closed') {
        console.log('[AlarmSound] AudioContext closed, stopping buzz');
        return;
      }

      const osc = currentCtx.createOscillator();
      osc.frequency.value = 1000;
      osc.type = "square";
      osc.connect(gainNode);

      osc.start(currentCtx.currentTime);
      osc.stop(currentCtx.currentTime + 0.5); // 500ms buzz duration
      this.scheduledOscillators.push(osc);

      // Schedule next buzz
      setTimeout(playOneBuzz, buzzInterval);
    };

    // Start the buzz loop
    playOneBuzz();
    console.log('[AlarmSound] Buzz sound loop started');
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
        this.scheduledOscillators.push(osc); // Track for cleanup
      });
      time += 0.5;
    }

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, stopTime);
    console.log('[AlarmSound] Piano sound configured with looping for', duration / 1000, 'seconds');
  }

  stopSound(): void {
    console.log('[AlarmSound] Stopping all sounds');
    
    // Stop custom audio if playing
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
        console.log('[AlarmSound] Custom audio stopped');
      } catch (e) {
        console.error("Error stopping custom audio:", e);
      }
    }

    // Actually stop and disconnect all scheduled oscillators
    // Use separate try-catch for each operation to handle errors gracefully
    console.log('[AlarmSound] Stopping', this.scheduledOscillators.length, 'scheduled oscillators');
    this.scheduledOscillators.forEach((osc, index) => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator may have already finished - this is fine
      }
      try {
        osc.disconnect();
      } catch (e) {
        // Already disconnected - this is fine
      }
    });
    this.scheduledOscillators = [];

    // Stop main oscillator if playing (this is for old single-oscillator sounds)
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // Already stopped
      }
      this.oscillator = null;
    }
    
    // Close the audio context to ensure all sounds stop immediately
    if (this.audioContext) {
      try {
        this.audioContext.close();
        this.audioContext = null;
        console.log('[AlarmSound] Audio context closed');
      } catch (e) {
        console.error("Error closing audio context:", e);
      }
    }
    
    this.isPlaying = false;
    console.log('[AlarmSound] All sounds stopped');
  }
}

export const alarmSounds = new AlarmSoundManager();