import type { TimerPreset } from '../types';

const PRESETS_KEY = 'meeting_timer_presets';
const ZOOM_CONFIG_KEY = 'meeting_timer_zoom_config';

export function loadPresets(): TimerPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
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
  if (idx >= 0) {
    presets[idx] = preset;
  } else {
    presets.push(preset);
  }
  savePresets(presets);
}

export function deletePreset(id: string): void {
  const presets = loadPresets().filter(p => p.id !== id);
  savePresets(presets);
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
