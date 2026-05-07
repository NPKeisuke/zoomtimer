import { useRef, useState } from 'react';
import type { TimerPreset, ZoomConfig } from '../types';
import { useTimer } from '../hooks/useTimer';
import { useZoomBot } from '../hooks/useZoomBot';
import { TimerCanvas } from './TimerCanvas';
import { AlarmRow } from './AlarmRow';
import { TimeInput } from './TimeInput';
import type { AlarmConfig } from '../types';

interface Props {
  initialPreset: TimerPreset;
  zoomConfig: ZoomConfig;
  joinZoom: boolean;
  onExit: () => void;
}

export function ControlScreen({ initialPreset, zoomConfig, joinZoom, onExit }: Props) {
  const [preset, setPreset] = useState<TimerPreset>(initialPreset);
  const { state, start, pause, reset, applyPreset } = useTimer(preset);
  const { status, errorMsg, join, leave, canvasRef } = useZoomBot();
  const [showAlarms, setShowAlarms] = useState(false);
  const joinedRef = useRef(false);

  // Auto-join on mount if joinZoom is true
  if (joinZoom && !joinedRef.current) {
    joinedRef.current = true;
    join(zoomConfig);
  }

  const handleReset = () => {
    reset();
    applyPreset(preset);
  };

  const handlePresetChange = (updated: TimerPreset) => {
    setPreset(updated);
    if (!state.isRunning) applyPreset(updated);
  };

  const updateAlarm = (updated: AlarmConfig) => {
    handlePresetChange({
      ...preset,
      alarms: preset.alarms.map(a => a.id === updated.id ? updated : a),
    });
  };

  const statusColor = {
    disconnected: 'bg-slate-400',
    connecting: 'bg-yellow-400 animate-pulse',
    connected: 'bg-green-500',
    error: 'bg-red-500',
  }[status];

  const canStart = state.phase === 'idle';
  const isRunning = state.isRunning && !state.isPaused;

  return (
    <div className="min-h-screen bg-slate-800 text-white p-4">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Top bar */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-xl font-bold text-slate-200">⏱ Meeting Timer</h1>
          <div className="flex items-center gap-3">
            {joinZoom && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                <span>
                  {status === 'connected' && 'Connected to Zoom'}
                  {status === 'connecting' && 'Connecting...'}
                  {status === 'disconnected' && 'Not connected'}
                  {status === 'error' && 'Connection failed'}
                </span>
              </div>
            )}
            <button
              onClick={async () => { await leave(); onExit(); }}
              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-sm rounded-lg transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-900 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Main layout */}
        <div className="flex flex-col md:flex-row gap-4 items-start">

          {/* Canvas */}
          <div className="flex-shrink-0 mx-auto">
            <TimerCanvas state={state} canvasRef={canvasRef} size={320} />
            <p className="text-center text-xs text-slate-500 mt-2">
              This video is sent to Zoom participants
            </p>
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-3">

            {/* Time setting (only when idle) */}
            {canStart && (
              <div className="bg-slate-700 rounded-xl p-4">
                <TimeInput
                  label="Total time"
                  seconds={preset.totalSeconds}
                  onChange={v => handlePresetChange({ ...preset, totalSeconds: v })}
                />
              </div>
            )}

            {/* Status display when running */}
            {!canStart && (
              <div className="bg-slate-700 rounded-xl p-4 text-center">
                <div className="text-5xl font-mono font-bold text-white">
                  {state.isOvertime
                    ? `+${String(Math.floor(state.overtimeSeconds / 60)).padStart(2, '0')}:${String(state.overtimeSeconds % 60).padStart(2, '0')}`
                    : `${String(Math.floor(state.remainingSeconds / 60)).padStart(2, '0')}:${String(state.remainingSeconds % 60).padStart(2, '0')}`
                  }
                </div>
                <div className={`text-sm mt-1 font-medium ${
                  state.isOvertime ? 'text-red-400' :
                  state.phase === 'warning' ? 'text-yellow-400' :
                  'text-slate-400'
                }`}>
                  {state.isOvertime ? 'OVERTIME' :
                   state.phase === 'warning' ? 'WARNING — Time running out' :
                   state.isPaused ? 'PAUSED' : 'RUNNING'}
                </div>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex gap-2">
              {canStart ? (
                <button
                  onClick={start}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-lg transition-colors"
                >
                  ▶ Start
                </button>
              ) : (
                <button
                  onClick={pause}
                  className={`flex-1 py-3 font-bold rounded-xl text-lg transition-colors ${
                    isRunning
                      ? 'bg-yellow-600 hover:bg-yellow-500'
                      : 'bg-blue-600 hover:bg-blue-500'
                  } text-white`}
                >
                  {isRunning ? '⏸ Pause' : '▶ Resume'}
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-5 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl transition-colors"
              >
                ↺ Reset
              </button>
            </div>

            {/* Alarm settings toggle */}
            <button
              onClick={() => setShowAlarms(!showAlarms)}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-sm text-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>🔔 Alarm Settings</span>
              <span>{showAlarms ? '▲' : '▼'}</span>
            </button>

            {showAlarms && (
              <div className="bg-slate-700 rounded-xl p-4 space-y-3">
                {preset.alarms.map(alarm => (
                  <AlarmRow key={alarm.id} alarm={alarm} onChange={updateAlarm} />
                ))}
                <TimeInput
                  label="Overtime interval"
                  seconds={preset.overtimeIntervalSeconds}
                  onChange={v => handlePresetChange({ ...preset, overtimeIntervalSeconds: v })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
