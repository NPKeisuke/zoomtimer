import type { AlarmConfig, TimerPreset } from '../types';

export function createDefaultPreset(): TimerPreset {
  const alarms: AlarmConfig[] = [
    {
      id: 'warning-1',
      label: '1分前警告',
      type: 'warning',
      triggerAtSeconds: 60,
      bellCount: 1,
      soundType: 'bell+voice',
      bellType: 'chime1',
      ttsVoiceIndex: 0,
      ttsMessage: 'One minute remaining',
      enabled: true,
    },
    {
      id: 'main-bell',
      label: 'メインベル',
      type: 'main',
      triggerAtSeconds: 0,
      bellCount: 2,
      soundType: 'bell+voice',
      bellType: 'chime2',
      ttsVoiceIndex: 0,
      ttsMessage: 'Time is over',
      enabled: true,
    },
  ];

  return {
    id: 'default',
    name: '10分プレゼン',
    totalSeconds: 600,
    alarms,
    overtimeIntervalSeconds: 120,
  };
}
