import { useState } from 'react';
import type { AlarmConfig, TimerPreset, ZoomConfig } from '../types';
import { loadZoomConfig, saveZoomConfig, loadPresets, savePreset, deletePreset } from '../utils/storage';
import { createDefaultPreset } from '../utils/defaults';
import { prewarmTTS } from '../utils/audioEngine';
import { TimeInput } from './TimeInput';
import { AlarmRow } from './AlarmRow';

interface Props {
  onStart: (preset: TimerPreset, zoomConfig: ZoomConfig, joinZoom: boolean) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function SetupScreen({ onStart }: Props) {
  const savedZoom = loadZoomConfig();
  const [clientId, setClientId] = useState(savedZoom.clientId);
  const [clientSecret, setClientSecret] = useState(savedZoom.clientSecret);
  const [meetingNumber, setMeetingNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [joinZoom, setJoinZoom] = useState(true);

  const presets = loadPresets();
  const [activePreset, setActivePreset] = useState<TimerPreset>(
    presets[0] ?? createDefaultPreset()
  );
  const [presetName, setPresetName] = useState(activePreset.name);
  const [showSettings, setShowSettings] = useState(false);

  const updateAlarm = (updated: AlarmConfig) => {
    setActivePreset(p => ({
      ...p,
      alarms: p.alarms.map(a => a.id === updated.id ? updated : a),
    }));
  };

  const handleSavePreset = () => {
    const preset = { ...activePreset, name: presetName };
    setActivePreset(preset);
    savePreset(preset);
  };

  const handleNewPreset = () => {
    const preset = { ...createDefaultPreset(), id: generateId(), name: 'New Preset' };
    setActivePreset(preset);
    setPresetName(preset.name);
  };

  const handleLoadPreset = (id: string) => {
    const found = loadPresets().find(p => p.id === id);
    if (found) {
      setActivePreset(found);
      setPresetName(found.name);
    }
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
    if (joinZoom) {
      saveZoomConfig({ clientId, clientSecret });
    }
    onStart(
      activePreset,
      {
        clientId,
        clientSecret,
        meetingNumber: meetingNumber.replace(/\s/g, ''),
        passcode,
        displayName: 'Meeting Timer',
      },
      joinZoom
    );
  };

  const mainAlarm = activePreset.alarms.find(a => a.type === 'main')!;
  const warningAlarms = activePreset.alarms.filter(a => a.type === 'warning');
  const overtimeAlarm = activePreset.alarms.find(a => a.type === 'overtime');

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="text-center pt-4 pb-2">
          <h1 className="text-3xl font-bold text-slate-800">⏱ Meeting Timer</h1>
          <p className="text-slate-500 text-sm mt-1">Configure your timer and join the meeting</p>
        </div>

        {/* SDK Settings toggle */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between text-slate-700 font-medium"
          >
            <span>⚙️ Zoom SDK Settings</span>
            <span className="text-slate-400">{showSettings ? '▲' : '▼'}</span>
          </button>
          {showSettings && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder="Zoom Meeting SDK Client ID"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Client Secret</label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={e => setClientSecret(e.target.value)}
                  placeholder="Zoom Meeting SDK Client Secret"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(!clientId || !clientSecret) && (
                <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  SDK credentials not set. Timer will work locally but cannot join Zoom until credentials are configured.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Zoom Meeting Join */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Zoom Meeting</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={joinZoom}
                onChange={e => setJoinZoom(e.target.checked)}
                className="accent-blue-600"
              />
              <span className="text-sm text-slate-600">Join Zoom</span>
            </label>
          </div>
          {joinZoom && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Meeting ID</label>
                <input
                  type="text"
                  value={meetingNumber}
                  onChange={e => setMeetingNumber(e.target.value)}
                  placeholder="000 000 0000"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Passcode</label>
                <input
                  type="text"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  placeholder="Passcode"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Preset Management */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Timer Preset</h2>

          {loadPresets().length > 0 && (
            <div className="flex flex-wrap gap-2">
              {loadPresets().map(p => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleLoadPreset(p.id)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      p.id === activePreset.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => handleDeletePreset(p.id)}
                    className="text-slate-400 hover:text-red-500 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder="Preset name"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSavePreset}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleNewPreset}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              New
            </button>
          </div>

          {/* Total time */}
          <TimeInput
            label="Total presentation time"
            seconds={activePreset.totalSeconds}
            onChange={v => setActivePreset(p => ({ ...p, totalSeconds: v }))}
          />
        </div>

        {/* Alarms */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Alarm Settings</h2>

          {warningAlarms.map(alarm => (
            <AlarmRow key={alarm.id} alarm={alarm} onChange={updateAlarm} />
          ))}

          {mainAlarm && <AlarmRow alarm={mainAlarm} onChange={updateAlarm} />}

          {overtimeAlarm ? (
            <AlarmRow alarm={overtimeAlarm} onChange={updateAlarm} />
          ) : (
            <button
              onClick={() => {
                const newAlarm: AlarmConfig = {
                  id: generateId(),
                  label: 'Overtime Alert',
                  type: 'overtime',
                  triggerAtSeconds: activePreset.overtimeIntervalSeconds,
                  bellCount: 3,
                  soundType: 'tts',
                  ttsVoiceIndex: 0,
                  ttsMessage: 'Time exceeded',
                  enabled: true,
                };
                setActivePreset(p => ({ ...p, alarms: [...p.alarms, newAlarm] }));
              }}
              className="w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
            >
              + Add Overtime Alert
            </button>
          )}

          {overtimeAlarm && (
            <TimeInput
              label="Overtime alert interval"
              seconds={activePreset.overtimeIntervalSeconds}
              onChange={v => setActivePreset(p => ({ ...p, overtimeIntervalSeconds: v }))}
            />
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl shadow-lg transition-colors"
        >
          {joinZoom ? 'Join Meeting & Start Timer' : 'Start Timer (Local Only)'}
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
}
