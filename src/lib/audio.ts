'use client';

let ctx: AudioContext | null = null;
let continuousHandoffInterval: ReturnType<typeof setInterval> | null = null;
let lastPlayedTone = '';
let lastPlayedAt = 0;

function canPlay(toneType: string, minIntervalMs = 400) {
  const now = Date.now();
  if (toneType === lastPlayedTone && now - lastPlayedAt < minIntervalMs) {
    return false;
  }
  lastPlayedTone = toneType;
  lastPlayedAt = now;
  return true;
}

// Generate in-memory 16-bit PCM Mono WAV Data URI
function generateWavDataUri(
  notes: Array<{ freq: number; durationMs: number; volume?: number }>,
  sampleRate = 22050
): string {
  if (typeof window === 'undefined') return '';
  let totalSamples = 0;
  notes.forEach(n => {
    totalSamples += Math.floor((n.durationMs / 1000) * sampleRate);
  });
  const dataSize = totalSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  notes.forEach(n => {
    const samples = Math.floor((n.durationMs / 1000) * sampleRate);
    const vol = n.volume ?? 0.95;
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const env = Math.sin((i / samples) * Math.PI);
      const sample = Math.sin(2 * Math.PI * n.freq * t) * vol * env * 32767;
      view.setInt16(offset, Math.max(-32768, Math.min(32767, sample)), true);
      offset += 2;
    }
  });

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// Crisp notification chime
const MESSAGE_WAV = typeof window !== 'undefined' ? generateWavDataUri([
  { freq: 987.77, durationMs: 70, volume: 0.95 },   // B5
  { freq: 1479.98, durationMs: 150, volume: 0.95 }, // F#6
]) : '';

const HANDOFF_WAV = typeof window !== 'undefined' ? generateWavDataUri([
  { freq: 659.25, durationMs: 80, volume: 1.0 },   // E5
  { freq: 880.00, durationMs: 80, volume: 1.0 },   // A5
  { freq: 1174.66, durationMs: 80, volume: 1.0 },  // D6
  { freq: 1567.98, durationMs: 250, volume: 1.0 }, // G6
]) : '';

function getCtx(): AudioContext | null {
  return null;
}

function playDataUri(_dataUri: string) {
  // Silenced as requested by user
}

export function playVisitorAlertSound(): void {
  // Silenced as requested by user
}

export function playChatMessageAlertSound(): void {
  // Silenced as requested by user
}

export function playHandoffAlertSound(): void {
  // Silenced as requested by user
}

export function startContinuousHandoffRinger(): void {
  // Silenced as requested by user
}

export function stopContinuousHandoffRinger(): void {
  if (continuousHandoffInterval) {
    clearInterval(continuousHandoffInterval);
    continuousHandoffInterval = null;
  }
}

export async function initAndUnlockAudio(): Promise<boolean> {
  return true;
}
