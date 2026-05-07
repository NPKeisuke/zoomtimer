import { useRef, useState } from 'react';
import type { TimerPreset, ZoomConfig } from '../types';
import { useTimer } from '../hooks/useTimer';
import { useZoomBot } from '../hooks/useZoomBot';
import { TimerCanvas } from './TimerCanvas';
import { AlarmRow } from './AlarmRow';
import { TimeInput } from './TimeInput';
import type { AlarmConfig } from '../types';
import { playBell, speakTTS, BELL_TYPES, getBellTypeName } from '../utils/audioEngine';

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
  const [showTest, setShowTest] = useState(false);
  const [testBellType, setTestBellType] = useState<'chime1' | 'chime2' | 'metal1' | 'metal2'>('chime1');
  const [testMessage, setTestMessage] = useState('One minute remaining');
  const joinedRef = useRef(false);

  if (joinZoom && !joinedRef.current) {
    joinedRef.current = true;
    join(zoomConfig);
  }

  const handleReset = () => { reset(); applyPreset(preset); };

  const handlePresetChange = (updated: TimerPreset) => {
    setPreset(updated);
    if (!state.isRunning) applyPreset(updated);
  };

  const updateAlarm = (updated: AlarmConfig) => {
    handlePresetChange({ ...preset, alarms: preset.alarms.map(a => a.id === updated.id ? updated : a) });
  };

  const statusColor = {
    disconnected: 'bg-slate-400',
    connecting: 'bg-yellow-400 animate-pulse',
    connected: 'bg-green-500',
    error: 'bg-red-500',
  }[status];

  const statusLabel = {
    disconnected: '未接続',
    connecting: '接続中...',
    connected: 'Zoom接続済み',
    error: '接続エラー',
  }[status];

  const canStart = state.phase === 'idle';
  const isRunning = state.isRunning && !state.isPaused;

  return (
    <div className="min-h-screen bg-slate-800 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Top bar */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-xl font-black text-white tracking-tight">ミーティングタイマー</h1>
          <div className="flex items-center gap-3">
            {joinZoom && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                <span>{statusLabel}</span>
              </div>
            )}
            <button onClick={async () => { await leave(); onExit(); }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-sm font-medium rounded-xl transition-colors">
              終了
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-900/50 border border-red-700 rounded-2xl px-4 py-3 text-sm text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* Canvas */}
          <div className="flex-shrink-0 mx-auto lg:mx-0">
            <TimerCanvas state={state} canvasRef={canvasRef} size={320} />
            <p className="text-center text-xs text-slate-500 mt-2">Zoom参加者に配信される映像</p>
          </div>

          {/* Controls */}
          <div className="flex-1 w-full space-y-3">

            {canStart && (
              <div className="bg-slate-700 rounded-2xl p-4">
                <TimeInput label="合計時間" seconds={preset.totalSeconds}
                  onChange={v => handlePresetChange({ ...preset, totalSeconds: v })} />
              </div>
            )}

            {!canStart && (
              <div className="bg-slate-700 rounded-2xl p-4 text-center">
                <div className={`text-5xl font-mono font-black ${state.isOvertime ? 'text-red-400' : state.phase === 'warning' ? 'text-yellow-400' : 'text-white'}`}>
                  {state.isOvertime
                    ? `+${String(Math.floor(state.overtimeSeconds / 60)).padStart(2, '0')}:${String(state.overtimeSeconds % 60).padStart(2, '0')}`
                    : `${String(Math.floor(state.remainingSeconds / 60)).padStart(2, '0')}:${String(state.remainingSeconds % 60).padStart(2, '0')}`
                  }
                </div>
                <div className={`text-sm mt-1.5 font-semibold ${state.isOvertime ? 'text-red-400' : state.phase === 'warning' ? 'text-yellow-400' : 'text-slate-400'}`}>
                  {state.isOvertime ? '延長中' : state.phase === 'warning' ? '警告 — 残り時間わずか' : state.isPaused ? '一時停止中' : '実行中'}
                </div>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex gap-2">
              {canStart ? (
                <button onClick={start}
                  className="flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl text-lg transition-colors">
                  ▶ スタート
                </button>
              ) : (
                <button onClick={pause}
                  className={`flex-1 py-3.5 font-black rounded-2xl text-lg transition-colors ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
                  {isRunning ? '⏸ 一時停止' : '▶ 再開'}
                </button>
              )}
              <button onClick={handleReset}
                className="px-5 py-3.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-2xl transition-colors">
                ↺ リセット
              </button>
            </div>

            {/* Alarm Settings toggle */}
            <button onClick={() => setShowAlarms(!showAlarms)}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-sm font-medium text-slate-300 rounded-2xl transition-colors flex items-center justify-center gap-2">
              <span>🔔 アラーム設定</span>
              <span className="text-slate-500">{showAlarms ? '▲' : '▼'}</span>
            </button>

            {showAlarms && (
              <div className="space-y-3">
                {preset.alarms.map(alarm => (
                  <AlarmRow key={alarm.id} alarm={alarm} onChange={updateAlarm} />
                ))}
                <div className="bg-slate-700 rounded-2xl p-4">
                  <TimeInput label="延長インターバル" seconds={preset.overtimeIntervalSeconds}
                    onChange={v => handlePresetChange({ ...preset, overtimeIntervalSeconds: v })} />
                </div>
              </div>
            )}

            {/* Test Sound toggle */}
            <button onClick={() => setShowTest(!showTest)}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-sm font-medium text-slate-300 rounded-2xl transition-colors flex items-center justify-center gap-2">
              <span>🔊 テストサウンド</span>
              <span className="text-slate-500">{showTest ? '▲' : '▼'}</span>
            </button>

            {showTest && (
              <div className="bg-slate-700 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-slate-400">ベル音と音声のテストができます。Zoom参加者にも届くか確認してください。</p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ベルの種類</label>
                    <select value={testBellType} onChange={e => setTestBellType(e.target.value as typeof testBellType)}
                      className="border border-slate-600 rounded-xl px-3 py-2 text-sm text-white bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                      {BELL_TYPES.map(t => (
                        <option key={t} value={t}>{getBellTypeName(t)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-40">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">音声メッセージ</label>
                    <input type="text" value={testMessage} onChange={e => setTestMessage(e.target.value)}
                      className="border border-slate-600 rounded-xl px-3 py-2 text-sm text-white bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => playBell(1, testBellType)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
                    🔔 ベルをテスト
                  </button>
                  <button onClick={() => speakTTS(testMessage, 0)}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors">
                    🗣 音声をテスト
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
