import type { TimerPreset, AlarmConfig } from '../types';

const PRESETS_KEY = 'meeting_timer_presets';
const ZOOM_CONFIG_KEY = 'meeting_timer_zoom_config';

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

export function loadZoomConfig(): { clientId: string; clientSecret: string } {
  const envDefaults = {
    clientId: import.meta.env.VITE_ZOOM_CLIENT_ID ?? '',
    clientSecret: import.meta.env.VITE_ZOOM_CLIENT_SECRET ?? '',
  };
  try {
    const raw = localStorage.getItem(ZOOM_CONFIG_KEY);
    return raw ? JSON.parse(raw) : envDefaults;
  } catch {
    return envDefaults;
  }
}

export function saveZoomConfig(config: { clientId: string; clientSecret: string }): void {
  localStorage.setItem(ZOOM_CONFIG_KEY, JSON.stringify(config));
}
