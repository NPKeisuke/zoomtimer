export interface AlarmConfig {
  id: string;
  label: string;
  type: 'warning' | 'main' | 'overtime';
  triggerAtSeconds: number; // for warning: remaining seconds; for overtime: interval seconds
  bellCount: 1 | 2 | 3;
  soundType: 'bell' | 'tts';
  ttsVoiceIndex: number; // 0-3
  ttsMessage: string;
  enabled: boolean;
}

export interface TimerPreset {
  id: string;
  name: string;
  totalSeconds: number;
  alarms: AlarmConfig[];
  overtimeIntervalSeconds: number;
}

export interface TimerState {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isOvertime: boolean;
  overtimeSeconds: number;
  phase: 'idle' | 'running' | 'warning' | 'overtime';
  firedAlarmIds: Set<string>;
  lastOvertimeBellAt: number;
}

export interface ZoomConfig {
  clientId: string;
  clientSecret: string;
  meetingNumber: string;
  passcode: string;
  displayName: string;
}

export type AppScreen = 'password' | 'setup' | 'control';
