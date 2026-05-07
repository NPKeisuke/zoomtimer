import type { AlarmConfig, TimerPreset } from '../types';

export function createDefaultPreset(): TimerPreset {
  const alarms: AlarmConfig[] = [
    {
      id: 'warning-1',
      label: '1st Warning',
      type: 'warning',
      triggerAtSeconds: 120, // 2 minutes remaining
      bellCount: 1,
      soundType: 'tts',
      ttsVoiceIndex: 0,
      ttsMessage: '2 minutes remaining',
      enabled: true,
    },
    {
      id: 'main-bell',
      label: 'Main Bell',
      type: 'main',
      triggerAtSeconds: 0,
      bellCount: 2,
      soundType: 'tts',
      ttsVoiceIndex: 0,
      ttsMessage: 'Time is over',
      enabled: true,
    },
  ];

  return {
    id: 'default',
    name: '10 min presentation',
    totalSeconds: 600,
    alarms,
    overtimeIntervalSeconds: 120, // every 2 minutes
  };
}
