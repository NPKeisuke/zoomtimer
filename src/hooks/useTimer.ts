import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlarmConfig, TimerPreset, TimerState } from '../types';
import { playBell, speakTTS } from '../utils/audioEngine';

const initialState = (totalSeconds: number): TimerState => ({
  totalSeconds,
  remainingSeconds: totalSeconds,
  isRunning: false,
  isPaused: false,
  isOvertime: false,
  overtimeSeconds: 0,
  phase: 'idle',
  firedAlarmIds: new Set(),
  lastOvertimeBellAt: 0,
});

export function useTimer(preset: TimerPreset) {
  const [state, setState] = useState<TimerState>(() => initialState(preset.totalSeconds));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const presetRef = useRef(preset);
  presetRef.current = preset;

  const fireAlarm = useCallback((alarm: AlarmConfig) => {
    if (alarm.soundType === 'bell') {
      playBell(alarm.bellCount);
    } else {
      playBell(alarm.bellCount);
      setTimeout(() => speakTTS(alarm.ttsMessage, alarm.ttsVoiceIndex), alarm.bellCount * 1200 + 200);
    }
  }, []);

  const tick = useCallback(() => {
    setState(prev => {
      if (!prev.isRunning || prev.isPaused) return prev;

      const p = presetRef.current;
      const newFired = new Set(prev.firedAlarmIds);

      if (!prev.isOvertime) {
        const newRemaining = prev.remainingSeconds - 1;

        // Check warning alarms
        const warningAlarms = p.alarms.filter(a => a.type === 'warning' && a.enabled);
        for (const alarm of warningAlarms) {
          if (!newFired.has(alarm.id) && newRemaining <= alarm.triggerAtSeconds) {
            newFired.add(alarm.id);
            fireAlarm(alarm);
          }
        }

        if (newRemaining <= 0) {
          // Fire main bell
          const mainAlarm = p.alarms.find(a => a.type === 'main' && a.enabled);
          if (mainAlarm && !newFired.has(mainAlarm.id)) {
            newFired.add(mainAlarm.id);
            fireAlarm(mainAlarm);
          }

          return {
            ...prev,
            remainingSeconds: 0,
            isOvertime: true,
            overtimeSeconds: 0,
            phase: 'overtime',
            firedAlarmIds: newFired,
            lastOvertimeBellAt: 0,
          };
        }

        const warningAlarmsSorted = warningAlarms
          .filter(a => newRemaining <= a.triggerAtSeconds)
          .sort((a, b) => b.triggerAtSeconds - a.triggerAtSeconds);
        const phase = warningAlarmsSorted.length > 0 ? 'warning' : 'running';

        return { ...prev, remainingSeconds: newRemaining, phase, firedAlarmIds: newFired };
      } else {
        // Overtime tick
        const newOvertime = prev.overtimeSeconds + 1;
        const interval = p.overtimeIntervalSeconds;
        const overtimeAlarm = p.alarms.find(a => a.type === 'overtime' && a.enabled);

        let lastOvertimeBellAt = prev.lastOvertimeBellAt;
        if (overtimeAlarm && newOvertime - lastOvertimeBellAt >= interval) {
          lastOvertimeBellAt = newOvertime;
          fireAlarm(overtimeAlarm);
        }

        return { ...prev, overtimeSeconds: newOvertime, lastOvertimeBellAt };
      }
    });
  }, [fireAlarm]);

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.isPaused, tick]);

  const start = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: true, isPaused: false, phase: 'running' }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState(initialState(presetRef.current.totalSeconds));
  }, []);

  const applyPreset = useCallback((newPreset: TimerPreset) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState(initialState(newPreset.totalSeconds));
  }, []);

  return { state, start, pause, reset, applyPreset };
}
