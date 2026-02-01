/**
 * Audio file generation for alarm sounds
 * Generates data URLs for bell, chime, buzz, and piano sounds
 * These are looped by HTML5 Audio elements for reliable playback
 */

// Generate a simple bell sound using Web Audio API, export as data URL
function generateBellAudio(): string {
  const sampleRate = 22050; // Lower sample rate for smaller size
  const duration = 2; // 2 seconds
  const numSamples = sampleRate * duration;
  const buffer = new Float32Array(numSamples);
  
  // Bell sound: 800Hz fundamental with harmonics and decay
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-3 * t); // Exponential decay
    
    // Multiple frequencies for richer bell sound
    const f1 = Math.sin(2 * Math.PI * 800 * t); // Fundamental
    const f2 = Math.sin(2 * Math.PI * 1200 * t) * 0.5; // Harmonic
    const f3 = Math.sin(2 * Math.PI * 1600 * t) * 0.3; // Harmonic
    
    buffer[i] = (f1 + f2 + f3) * decay * 0.3;
  }
  
  return bufferToWavDataUrl(buffer, sampleRate);
}

// Generate a chime sound (ascending notes)
function generateChimeAudio(): string {
  const sampleRate = 22050;
  const noteDuration = 0.4; // Each note lasts 0.4 seconds
  const notes = [523, 659, 784, 1047]; // C, E, G, C (major chord)
  const totalDuration = noteDuration * notes.length;
  const numSamples = Math.floor(sampleRate * totalDuration);
  const buffer = new Float32Array(numSamples);
  
  notes.forEach((freq, noteIndex) => {
    const startSample = Math.floor(noteIndex * noteDuration * sampleRate);
    const noteSamples = Math.floor(noteDuration * sampleRate);
    
    for (let i = 0; i < noteSamples && startSample + i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-5 * t);
      buffer[startSample + i] = Math.sin(2 * Math.PI * freq * t) * decay * 0.3;
    }
  });
  
  return bufferToWavDataUrl(buffer, sampleRate);
}

// Generate a buzz sound (alert sound)
function generateBuzzAudio(): string {
  const sampleRate = 22050;
  const duration = 1.5;
  const numSamples = sampleRate * duration;
  const buffer = new Float32Array(numSamples);
  
  // Alternating two frequencies for urgent buzz
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const pulseFreq = 8; // 8 Hz pulse
    const pulse = Math.sin(2 * Math.PI * pulseFreq * t) > 0 ? 1 : 0;
    
    const freq1 = 400;
    const freq2 = 600;
    const freq = pulse > 0.5 ? freq1 : freq2;
    
    // Square wave for harsh buzz sound
    buffer[i] = (Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1) * 0.3;
  }
  
  return bufferToWavDataUrl(buffer, sampleRate);
}

// Generate a piano-like sound
function generatePianoAudio(): string {
  const sampleRate = 22050;
  const duration = 3;
  const numSamples = sampleRate * duration;
  const buffer = new Float32Array(numSamples);
  
  // Piano chord: C major (C, E, G)
  const notes = [
    { freq: 262, time: 0.0 },
    { freq: 330, time: 0.3 },
    { freq: 392, time: 0.6 },
    { freq: 523, time: 0.9 },
  ];
  
  notes.forEach(note => {
    const startSample = Math.floor(note.time * sampleRate);
    const noteDuration = 1.0;
    const noteSamples = Math.floor(noteDuration * sampleRate);
    
    for (let i = 0; i < noteSamples && startSample + i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-2 * t);
      
      // Piano has multiple harmonics
      const fundamental = Math.sin(2 * Math.PI * note.freq * t);
      const harmonic2 = Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.3;
      const harmonic3 = Math.sin(2 * Math.PI * note.freq * 3 * t) * 0.1;
      
      buffer[startSample + i] += (fundamental + harmonic2 + harmonic3) * decay * 0.2;
    }
  });
  
  return bufferToWavDataUrl(buffer, sampleRate);
}

// Convert Float32Array audio buffer to WAV data URL
function bufferToWavDataUrl(buffer: Float32Array, sampleRate: number): string {
  const numChannels = 1; // Mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * bytesPerSample;
  const fileSize = 44 + dataSize; // 44 bytes for WAV header
  
  const wavBuffer = new ArrayBuffer(fileSize);
  const view = new DataView(wavBuffer);
  
  // WAV file header
  let offset = 0;
  
  // "RIFF" chunk descriptor
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, fileSize - 8, true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;
  
  // "fmt " sub-chunk
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // Subchunk size
  view.setUint16(offset, 1, true); offset += 2; // Audio format (1 = PCM)
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitsPerSample, true); offset += 2;
  
  // "data" sub-chunk
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, dataSize, true); offset += 4;
  
  // Write audio samples
  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, buffer[i])); // Clamp
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }
  
  // Convert to base64 data URL
  const bytes = new Uint8Array(wavBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  return `data:audio/wav;base64,${base64}`;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Pre-generate all sounds
export const ALARM_SOUNDS = {
  bell: generateBellAudio(),
  chime: generateChimeAudio(),
  buzz: generateBuzzAudio(),
  piano: generatePianoAudio(),
};

export type AlarmSoundType = keyof typeof ALARM_SOUNDS;
