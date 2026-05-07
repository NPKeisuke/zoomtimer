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
  if (virtualAudioDestination) {
    node.connect(virtualAudioDestination);
  }
}

// Metallic bell using FM synthesis
export async function playBell(count: 1 | 2 | 3): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const playOneBell = (delaySeconds: number) => {
    const startTime = ctx.currentTime + delaySeconds;
    const duration = 2.5;

    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const envelopeGain = ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(880, startTime);
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(440, startTime);
    modGain.gain.setValueAtTime(220, startTime);

    envelopeGain.gain.setValueAtTime(0, startTime);
    envelopeGain.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
    envelopeGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(envelopeGain);
    connectToDestination(envelopeGain);

    carrier.start(startTime);
    modulator.start(startTime);
    carrier.stop(startTime + duration);
    modulator.stop(startTime + duration);
  };

  for (let i = 0; i < count; i++) {
    playOneBell(i * 1.2);
  }
}

const TTS_VOICES = [
  { name: 'Voice 1 (Bright)', lang: 'en-US', pitch: 1.4, rate: 0.95 },
  { name: 'Voice 2 (Clear)', lang: 'en-US', pitch: 1.2, rate: 1.0 },
  { name: 'Voice 3 (Gentle)', lang: 'en-GB', pitch: 1.3, rate: 0.9 },
  { name: 'Voice 4 (Natural)', lang: 'en-AU', pitch: 1.1, rate: 1.05 },
];

export function getTTSVoiceNames(): string[] {
  return TTS_VOICES.map(v => v.name);
}

let voicesLoaded = false;
export function prewarmTTS(): void {
  if (voicesLoaded) return;
  const synth = window.speechSynthesis;
  // Trigger voice list loading
  synth.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
  };
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
