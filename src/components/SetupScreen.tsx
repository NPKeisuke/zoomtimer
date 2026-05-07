import { useState } from 'react';
import type { AlarmConfig, TimerPreset } from '../types';
import { loadPresets, savePreset, deletePreset } from '../utils/storage';
import { createDefaultPreset } from '../utils/defaults';
import { prewarmTTS } from '../utils/audioEngine';
import { TimeInput } from './TimeInput';
import { AlarmRow } from './AlarmRow';

interface Props {
  onStart: (preset: TimerPreset) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function SetupScreen({ onStart }: Props) {
  const presets = loadPresets();
  const [activePreset, setActivePreset] = useState<TimerPreset>(
    presets[0] ?? createDefaultPreset()
  );
  const [presetName, setPresetName] = useState(activePreset.name);

  const updateAlarm = (updated: AlarmConfig) => {
    setActivePreset(p => ({ ...p, alarms: p.alarms.map(a => a.id === updated.id ? updated : a) }));
  };

  const handleSavePreset = () => {
    const preset = { ...activePreset, name: presetName };
    setActivePreset(preset);
    savePreset(preset);
  };

  const handleNewPreset = () => {
    const preset = { ...createDefaultPreset(), id: generateId(), name: '新しいプリセット' };
    setActivePreset(preset);
    setPresetName(preset.name);
  };

  const handleLoadPreset = (id: string) => {
    const found = loadPresets().find(p => p.id === id);
    if (found) { setActivePreset(found); setPresetName(found.name); }
  };

  const handleDeletePreset = (id: string) => {
    deletePreset(id);
    const remaining = loadPresets();
    if (remaining.length > 0) {
      setActivePreset(remaining[0]);
      setPresetName(remaining[0].name);
    } else {
      const d = createDefaultPreset();
      setActivePreset(d);
      setPresetName(d.name);
    }
  };

  const handleStart = () => {
    prewarmTTS();
    onStart(activePreset);
  };

  const mainAlarm = activePreset.alarms.find(a => a.type === 'main')!;
  const warningAlarms = activePreset.alarms.filter(a => a.type === 'warning');
  const overtimeAlarm = activePreset.alarms.find(a => a.type === 'overtime');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="text-center pt-6 pb-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">ミーティングタイマー</h1>
          <p className="text-slate-400 text-sm mt-1">タイマーを設定する</p>
        </div>

        {/* Timer Preset */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <span className="text-lg">⏱</span>
            <span className="font-semibold text-slate-700">タイマープリセット</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            {loadPresets().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {loadPresets().map(p => (
                  <div key={p.id} className="flex items-center gap-1">
                    <button onClick={() => handleLoadPreset(p.id)}
                      className={`px-3 py-1.5 text-sm rounded-xl border transition-colors ${p.id === activePreset.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
                      {p.name}
                    </button>
                    <button onClick={() => handleDeletePreset(p.id)} className="text-slate-300 hover:text-red-400 text-sm px-1">×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input type="text" value={presetName} onChange={e => setPresetName(e.target.value)}
                placeholder="プリセット名"
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={handleSavePreset}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
                保存
              </button>
              <button onClick={handleNewPreset}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors">
                新規
              </button>
            </div>

            <TimeInput label="発表時間" seconds={activePreset.totalSeconds}
              onChange={v => setActivePreset(p => ({ ...p, totalSeconds: v }))} />
          </div>
        </div>

        {/* Alarms */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <span className="text-lg">🔔</span>
            <span className="font-semibold text-slate-700">アラーム設定</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            {warningAlarms.map(alarm => (
              <AlarmRow key={alarm.id} alarm={alarm} onChange={updateAlarm} />
            ))}
            {mainAlarm && <AlarmRow alarm={mainAlarm} onChange={updateAlarm} />}
            {overtimeAlarm
              ? <AlarmRow alarm={overtimeAlarm} onChange={updateAlarm} />
              : (
                <button onClick={() => {
                  const newAlarm: AlarmConfig = {
                    id: generateId(), label: '延長アラート', type: 'overtime',
                    triggerAtSeconds: activePreset.overtimeIntervalSeconds,
                    bellCount: 3, soundType: 'bell+voice', bellType: 'metal1',
                    ttsVoiceIndex: 0, ttsMessage: 'Time exceeded', enabled: true,
                  };
                  setActivePreset(p => ({ ...p, alarms: [...p.alarms, newAlarm] }));
                }}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm font-medium">
                  + 延長アラートを追加
                </button>
              )
            }
            {overtimeAlarm && (
              <TimeInput label="延長インターバル" seconds={activePreset.overtimeIntervalSeconds}
                onChange={v => setActivePreset(p => ({ ...p, overtimeIntervalSeconds: v }))} />
            )}
          </div>
        </div>

        {/* Start Button */}
        <button onClick={handleStart}
          className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white text-xl font-black rounded-2xl shadow-lg transition-colors">
          ▶ タイマー開始
        </button>
        <div className="h-4" />
      </div>
    </div>
  );
}
