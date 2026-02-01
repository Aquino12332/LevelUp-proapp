import { ALARM_SOUNDS } from "./alarmAudioFiles";

export type SoundType = "bell" | "chime" | "buzz" | "piano" | string; // Allow custom sound URLs

type PlayState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/**
 * NEW: HTML5 Audio-based Alarm Sound Manager
 * Simple, reliable, mobile-friendly alarm sounds using Audio elements
 */
class AlarmSoundManager {
  private audio: HTMLAudioElement | null = null;
  private playState: PlayState = 'idle';
  private currentSound: string | null = null;
  private volume: number = 0.8;
  private stopTimeoutId: number | null = null;

  async playSound(soundType: SoundType, duration: number = 60000): Promise<void> {
    console.log('[AlarmSound] 🔊 Playing sound:', soundType, 'for', duration, 'ms');
    
    // Stop any currently playing sound
    if (this.playState === 'playing') {
      console.log('[AlarmSound] Stopping previous sound');
      this.stopSound();
    }

    this.playState = 'loading';
    this.currentSound = soundType;

    try {
      // Get the audio data URL
      let audioUrl: string;
      
      if (soundType.startsWith("custom:") || soundType.startsWith("data:") || soundType.startsWith("http")) {
        // Custom sound URL
        audioUrl = soundType.startsWith("custom:") ? soundType.substring(7) : soundType;
        console.log('[AlarmSound] Using custom audio URL');
      } else {
        // Built-in sound from generated audio files
        const builtInSound = soundType as keyof typeof ALARM_SOUNDS;
        if (ALARM_SOUNDS[builtInSound]) {
          audioUrl = ALARM_SOUNDS[builtInSound];
          console.log('[AlarmSound] Using built-in sound:', builtInSound);
        } else {
          console.warn('[AlarmSound] Unknown sound type, falling back to bell');
          audioUrl = ALARM_SOUNDS.bell;
        }
      }

      // Create new Audio element
      this.audio = new Audio(audioUrl);
      this.audio.loop = true; // Loop continuously
      this.audio.volume = this.volume;

      // Add event listeners
      this.audio.addEventListener('ended', () => {
        console.log('[AlarmSound] Audio ended');
        this.playState = 'idle';
      });

      this.audio.addEventListener('error', (e) => {
        console.error('[AlarmSound] ❌ Audio error:', e);
        this.playState = 'error';
      });

      this.audio.addEventListener('canplay', () => {
        console.log('[AlarmSound] Audio can play');
      });

      // Try to play
      console.log('[AlarmSound] Starting playback...');
      await this.audio.play();
      
      this.playState = 'playing';
      console.log('[AlarmSound] ✅ Sound playing successfully');

      // Auto-stop after duration
      if (duration && duration > 0) {
        this.stopTimeoutId = window.setTimeout(() => {
          console.log('[AlarmSound] Duration elapsed, stopping sound');
          this.stopSound();
        }, duration);
      }

    } catch (error: any) {
      console.error('[AlarmSound] ❌ Failed to play sound:', error);
      this.playState = 'error';
      
      // Provide helpful error message
      if (error.name === 'NotAllowedError') {
        throw new Error('Sound blocked by browser. User interaction required.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Sound format not supported by browser.');
      } else {
        throw error;
      }
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    console.log('[AlarmSound] Volume set to:', this.volume);
  }

  getState(): PlayState {
    return this.playState;
  }

  isPlaying(): boolean {
    return this.playState === 'playing';
  }

  stopSound(): void {
    console.log('[AlarmSound] 🛑 Stopping sound');

    // Clear stop timeout if exists
    if (this.stopTimeoutId !== null) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    // Stop and clean up audio element
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio = null;
        console.log('[AlarmSound] ✅ Audio stopped and cleaned up');
      } catch (e) {
        console.error('[AlarmSound] Error stopping audio:', e);
      }
    }

    this.playState = 'idle';
    this.currentSound = null;
    console.log('[AlarmSound] Stop complete');
  }
}

export const alarmSounds = new AlarmSoundManager();