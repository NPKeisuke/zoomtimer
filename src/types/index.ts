export interface AlarmConfig {
  id: string;
  label: string;
  type: 'warning' | 'main' | 'overtime';
  triggerAtSeconds: number;
  bellCount: 1 | 2 | 3;
  soundType: 'bell' | 'voice' | 'bell+voice';
  bellType: 'chime1' | 'chime2' | 'metal1' | 'metal2';
  ttsVoiceIndex: number;
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
