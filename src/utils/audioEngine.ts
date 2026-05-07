let audioCtx: AudioContext | null = null;
export let virtualAudioDestination: MediaStreamAudioDestinationNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    virtualAudioDestination = audioCtx.createMediaStreamDestination();
  }
  return audioCtx;
}

export function getVirtualAudioStream(): MediaStream | null {
  getAudioContext();
  return virtualAudioDestination?.stream ?? null;
}

function connectToDestination(node: AudioNode) {
  const ctx = getAudioContext();
  node.connect(ctx.destination);
  if (virtualAudioDestination) node.connect(virtualAudioDestination);
}

type BellType = 'chime1' | 'chime2' | 'metal1' | 'metal2';

interface BellConfig {
  carrierFreq: number;
  modFreq: number;
  modIndex: number;
  attack: number;
  decay: number;
  gain: number;
  interval: number;
}

const BELL_CONFIGS: Record<BellType, BellConfig> = {
  chime1: { carrierFreq: 1047, modFreq: 1047, modIndex: 20,  attack: 0.003, decay: 2.8, gain: 0.45, interval: 1.4 },
  chime2: { carrierFreq: 1568, modFreq: 784,  modIndex: 120, attack: 0.002, decay: 2.2, gain: 0.50, interval: 1.2 },
  metal1: { carrierFreq: 880,  modFreq: 1234, modIndex: 350, attack: 0.001, decay: 3.5, gain: 0.45, interval: 2.0 },
  metal2: { carrierFreq: 220,  modFreq: 310,  modIndex: 100, attack: 0.010, decay: 5.0, gain: 0.55, interval: 3.0 },
};

function playOneBell(ctx: AudioContext, delay: number, cfg: BellConfig) {
  const t = ctx.currentTime + delay;
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();
  const env = ctx.createGain();

  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(cfg.carrierFreq, t);
  modulator.type = 'sine';
  modulator.frequency.setValueAtTime(cfg.modFreq, t);
  modGain.gain.setValueAtTime(cfg.modIndex, t);

  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(cfg.gain, t + cfg.attack);
  env.gain.exponentialRampToValueAtTime(0.001, t + cfg.decay);

  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.connect(env);
  connectToDestination(env);

  carrier.start(t);
  modulator.start(t);
  carrier.stop(t + cfg.decay);
  modulator.stop(t + cfg.decay);
}

export async function playBell(count: 1 | 2 | 3, type: BellType = 'chime1'): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();
  const cfg = BELL_CONFIGS[type];
  for (let i = 0; i < count; i++) {
    playOneBell(ctx, i * cfg.interval, cfg);
  }
}

export function getBellTypeName(type: BellType): string {
  const names: Record<BellType, string> = {
    chime1: 'チャイム（柔らか）',
    chime2: 'チャイム（明るい）',
    metal1: '金属ベル',
    metal2: 'ゴング',
  };
  return names[type];
}

export const BELL_TYPES: BellType[] = ['chime1', 'chime2', 'metal1', 'metal2'];

const TTS_VOICES = [
  { name: 'ボイス1（ジェントル）', lang: 'en-GB', pitch: 1.3, rate: 0.90 },
  { name: 'ボイス2（ナチュラル）', lang: 'en-AU', pitch: 1.1, rate: 1.05 },
  { name: 'ボイス3（ウォーム）',   lang: 'en-GB', pitch: 1.2, rate: 0.92 },
  { name: 'ボイス4（クリア）',     lang: 'en-AU', pitch: 1.15, rate: 1.0 },
];

export function getTTSVoiceNames(): string[] {
  return TTS_VOICES.map(v => v.name);
}

let voicesLoaded = false;
export function prewarmTTS(): void {
  if (voicesLoaded) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => { voicesLoaded = true; };
}

function findBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang.startsWith(lang) && v.name.toLowerCase().includes('female')) ||
    voices.find(v => v.lang.startsWith(lang)) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0] ||
    null
  );
}

export function speakTTS(message: string, voiceIndex: number): void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const config = TTS_VOICES[voiceIndex] ?? TTS_VOICES[0];
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = config.lang;
  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  utterance.volume = 1.0;
  const voice = findBestVoice(config.lang);
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
