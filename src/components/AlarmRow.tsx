import type { AlarmConfig } from '../types';
import { getTTSVoiceNames, playBell, speakTTS } from '../utils/audioEngine';
import { TimeInput } from './TimeInput';

interface Props {
  alarm: AlarmConfig;
  onChange: (updated: AlarmConfig) => void;
  totalSeconds?: number; // for showing context
}

const VOICE_NAMES = getTTSVoiceNames();

export function AlarmRow({ alarm, onChange }: Props) {
  const update = (partial: Partial<AlarmConfig>) => onChange({ ...alarm, ...partial });

  const preview = () => {
    if (alarm.soundType === 'bell') {
      playBell(alarm.bellCount);
    } else {
      playBell(alarm.bellCount);
      setTimeout(() => speakTTS(alarm.ttsMessage, alarm.ttsVoiceIndex), alarm.bellCount * 1200 + 200);
    }
  };

  const labelColor =
    alarm.type === 'main' ? 'bg-blue-100 text-blue-700' :
    alarm.type === 'overtime' ? 'bg-red-100 text-red-700' :
    'bg-yellow-100 text-yellow-700';

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${labelColor}`}>
            {alarm.label}
          </span>
          <span className="text-xs text-slate-400">
            {alarm.type === 'warning' && 'fires when remaining time reaches'}
            {alarm.type === 'main' && 'fires at 0:00'}
            {alarm.type === 'overtime' && 'fires every'}
          </span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={alarm.enabled}
            onChange={e => update({ enabled: e.target.checked })}
            className="accent-blue-600"
          />
          <span className="text-xs text-slate-600">Enabled</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {(alarm.type === 'warning' || alarm.type === 'overtime') && (
          <TimeInput
            label={alarm.type === 'overtime' ? 'Interval' : 'Remaining time'}
            seconds={alarm.triggerAtSeconds}
            onChange={v => update({ triggerAtSeconds: v })}
          />
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sound</label>
          <select
            value={alarm.soundType}
            onChange={e => update({ soundType: e.target.value as 'bell' | 'tts' })}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bell">Bell only</option>
            <option value="tts">Bell + Voice</option>
          </select>
        </div>

        {alarm.soundType === 'tts' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Voice</label>
              <select
                value={alarm.ttsVoiceIndex}
                onChange={e => update({ ttsVoiceIndex: Number(e.target.value) })}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VOICE_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-40">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Message</label>
              <input
                type="text"
                value={alarm.ttsMessage}
                onChange={e => update({ ttsMessage: e.target.value })}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        <button
          onClick={preview}
          className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
        >
          Preview
        </button>
      </div>
    </div>
  );
}
