import type { TimerPreset, AlarmConfig } from '../types';

const PRESETS_KEY = 'meeting_timer_presets';

function migrateAlarm(alarm: AlarmConfig): AlarmConfig {
  return {
    ...alarm,
    soundType: (alarm.soundType === 'tts' as string) ? 'bell+voice' : alarm.soundType,
    bellType: alarm.bellType ?? 'chime1',
  };
}

function migratePreset(preset: TimerPreset): TimerPreset {
  return { ...preset, alarms: preset.alarms.map(migrateAlarm) };
}

export function loadPresets(): TimerPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    const presets: TimerPreset[] = raw ? JSON.parse(raw) : [];
    return presets.map(migratePreset);
  } catch {
    return [];
  }
}

export function savePresets(presets: TimerPreset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function savePreset(preset: TimerPreset): void {
  const presets = loadPresets();
  const idx = presets.findIndex(p => p.id === preset.id);
  if (idx >= 0) presets[idx] = preset;
  else presets.push(preset);
  savePresets(presets);
}

export function deletePreset(id: string): void {
  savePresets(loadPresets().filter(p => p.id !== id));
}
