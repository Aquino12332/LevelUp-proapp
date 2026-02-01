export type SoundType = "bell" | "chime" | "buzz" | "piano" | string; // Allow custom sound URLs

class AlarmSoundManager {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private scheduledOscillators: OscillatorNode[] = []; // Track all scheduled oscillators
  private loopTimeoutId: number | null = null; // For managing sound loops
  private currentSoundType: SoundType | null = null; // Track what's playing

  async playSound(soundType: SoundType, duration: number = 60000): Promise<void> {
    console.log('[AlarmSound] Playing sound:', soundType, 'for', duration, 'ms');
    
    if (this.isPlaying) {
      console.log('[AlarmSound] Sound already playing, stopping previous first');
      this.stopSound();
    }
    
    // Clear any previously scheduled oscillators
    this.scheduledOscillators = [];
    this.isPlaying = true;
    this.currentSoundType = soundType;

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

      // For long durations, use looping strategy to avoid memory issues
      if (duration > 30000) {
        console.log('[AlarmSound] Long duration - using looping strategy');
        await this.playWithLooping(soundType, duration);
      } else {
        // For short durations, play directly
        if (soundType === "bell") {
          this.playBell(ctx, duration);
        } else if (soundType === "chime") {
          this.playChime(ctx, duration);
        } else if (soundType === "buzz") {
          this.playBuzz(ctx, duration);
        } else if (soundType === "piano") {
          this.playPiano(ctx, duration);
        }
      }
      
      console.log('[AlarmSound] Sound started successfully');
    } catch (error) {
      console.error("[AlarmSound] Failed to play alarm sound:", error);
      this.isPlaying = false;
    }
  }

  private async playWithLooping(soundType: SoundType, totalDuration: number): Promise<void> {
    const chunkDuration = 15000; // Play 15 seconds at a time
    let elapsed = 0;
    
    const playChunk = () => {
      if (!this.isPlaying || !this.audioContext) {
        console.log('[AlarmSound] Looping stopped (isPlaying:', this.isPlaying, ')');
        return;
      }
      
      const remainingTime = totalDuration - elapsed;
      const nextChunkDuration = Math.min(chunkDuration, remainingTime);
      
      console.log('[AlarmSound] Playing chunk:', elapsed, 'to', elapsed + nextChunkDuration, 'of', totalDuration);
      
      // Clean up finished oscillators before adding new ones
      // Only remove oscillators that have already finished playing
      const now = this.audioContext.currentTime;
      this.scheduledOscillators = this.scheduledOscillators.filter(osc => {
        // We can't directly check if an oscillator is finished, so we keep all of them
        // The cleanup will happen in stopSound
        return true;
      });
      
      // Play the next chunk - each method will add to scheduledOscillators
      if (soundType === "bell") {
        this.playBell(this.audioContext, nextChunkDuration);
      } else if (soundType === "chime") {
        this.playChime(this.audioContext, nextChunkDuration);
      } else if (soundType === "buzz") {
        this.playBuzz(this.audioContext, nextChunkDuration);
      } else if (soundType === "piano") {
        this.playPiano(this.audioContext, nextChunkDuration);
      }
      
      elapsed += nextChunkDuration;
      
      // Schedule next chunk if we haven't reached the end
      if (elapsed < totalDuration && this.isPlaying) {
        // Schedule the next chunk to start a bit before the current one ends for seamless playback
        const scheduleDelay = Math.max(nextChunkDuration - 500, 100); // 500ms overlap
        this.loopTimeoutId = window.setTimeout(playChunk, scheduleDelay);
      } else {
        console.log('[AlarmSound] Looping completed');
      }
    };
    
    // Start the first chunk
    playChunk();
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
    console.log('[AlarmSound] Starting bell sound with repeating pattern');
    
    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    this.gainNode = gainNode;
    
    // Bell uses a repeating pattern instead of continuous tone
    // This is more reliable on mobile and sounds better
    const bellFrequency = 800; // Hz
    const patternDuration = 0.8; // seconds per ring
    const gapDuration = 0.4; // seconds between rings
    const totalPatternTime = patternDuration + gapDuration;
    
    let time = ctx.currentTime;
    const endTime = time + (duration / 1000);
    
    // Create repeating bell rings
    while (time < endTime) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = bellFrequency;
      osc.connect(gainNode);
      
      // Envelope for natural bell sound
      const oscGain = ctx.createGain();
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      
      // Attack and decay envelope
      oscGain.gain.setValueAtTime(0, time);
      oscGain.gain.linearRampToValueAtTime(0.8, time + 0.01); // Fast attack
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + patternDuration); // Decay
      
      osc.start(time);
      osc.stop(time + patternDuration);
      
      this.scheduledOscillators.push(osc);
      time += totalPatternTime;
    }
    
    // Set overall volume
    gainNode.gain.setValueAtTime(1.0, ctx.currentTime);
    
    console.log('[AlarmSound] Bell pattern scheduled for', duration / 1000, 'seconds');
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
    console.log('[AlarmSound] Starting buzz sound with pulsing pattern');
    
    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    this.gainNode = gainNode;
    
    // Buzz uses a pulsing pattern - more attention-grabbing and mobile-friendly
    const buzzFrequency = 400; // Hz (lower for better mobile speakers)
    const pulseOnDuration = 0.3; // seconds
    const pulseOffDuration = 0.2; // seconds
    const totalPulseTime = pulseOnDuration + pulseOffDuration;
    
    let time = ctx.currentTime;
    const endTime = time + (duration / 1000);
    
    // Create repeating buzz pulses
    while (time < endTime) {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = buzzFrequency;
      osc.connect(gainNode);
      
      osc.start(time);
      osc.stop(time + pulseOnDuration);
      
      this.scheduledOscillators.push(osc);
      time += totalPulseTime;
    }
    
    // Set louder volume for buzz
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    
    console.log('[AlarmSound] Buzz pattern scheduled for', duration / 1000, 'seconds');
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
    
    // Clear loop timeout if exists
    if (this.loopTimeoutId !== null) {
      clearTimeout(this.loopTimeoutId);
      this.loopTimeoutId = null;
      console.log('[AlarmSound] Loop timeout cleared');
    }
    
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

    // Fade out gain node if exists to prevent clicks
    if (this.gainNode && this.audioContext && this.audioContext.state === 'running') {
      try {
        const currentTime = this.audioContext.currentTime;
        this.gainNode.gain.cancelScheduledValues(currentTime);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0.001, currentTime + 0.03); // 30ms fade out
      } catch (e) {
        console.log('[AlarmSound] Fade out failed (already stopped?):', e);
      }
    }

    // Stop and disconnect all scheduled oscillators after a brief delay for fade
    setTimeout(() => {
      console.log('[AlarmSound] Stopping', this.scheduledOscillators.length, 'scheduled oscillators');
      this.scheduledOscillators.forEach((osc) => {
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

      // Clean up main oscillator if exists (legacy)
      if (this.oscillator) {
        try {
          this.oscillator.stop();
          this.oscillator.disconnect();
        } catch (e) {
          // Already stopped
        }
        this.oscillator = null;
      }
      
      // Clean up gain node
      if (this.gainNode) {
        try {
          this.gainNode.disconnect();
        } catch (e) {
          // Already disconnected
        }
        this.gainNode = null;
      }
      
      console.log('[AlarmSound] All oscillators cleaned up');
    }, 40); // Wait for fade out
    
    // DON'T close the audio context - keep it alive for reuse to prevent clicks
    // Closing and reopening causes audible pops/clicks
    if (this.audioContext && this.audioContext.state === 'running') {
      console.log('[AlarmSound] Audio context kept alive (state: ' + this.audioContext.state + ')');
    }
    
    this.isPlaying = false;
    this.currentSoundType = null;
    console.log('[AlarmSound] Stop initiated (fade out in progress)');
  }
}

export const alarmSounds = new AlarmSoundManager();