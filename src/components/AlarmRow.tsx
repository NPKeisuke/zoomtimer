import type { AlarmConfig } from '../types';
import { getTTSVoiceNames, playBell, speakTTS, getBellTypeName, BELL_TYPES } from '../utils/audioEngine';
import { TimeInput } from './TimeInput';

interface Props {
  alarm: AlarmConfig;
  onChange: (updated: AlarmConfig) => void;
}

const VOICE_NAMES = getTTSVoiceNames();

const SOUND_TYPE_LABELS = {
  bell: 'ベルのみ',
  voice: '音声のみ',
  'bell+voice': 'ベル＋音声',
};

const TYPE_LABELS = {
  warning: { bg: 'bg-amber-100 text-amber-700 border-amber-200', text: '警告' },
  main:    { bg: 'bg-blue-100 text-blue-700 border-blue-200',   text: 'メインベル' },
  overtime:{ bg: 'bg-red-100 text-red-700 border-red-200',      text: '延長' },
};

const TIMING_LABELS = {
  warning:  '残り時間が以下になったとき',
  main:     '0:00になったとき',
  overtime: '以下の間隔で',
};

export function AlarmRow({ alarm, onChange }: Props) {
  const update = (partial: Partial<AlarmConfig>) => onChange({ ...alarm, ...partial });

  const preview = () => {
    const type = alarm.bellType ?? 'chime1';
    if (alarm.soundType === 'bell') {
      playBell(alarm.bellCount, type);
    } else if (alarm.soundType === 'voice') {
      speakTTS(alarm.ttsMessage, alarm.ttsVoiceIndex);
    } else {
      playBell(alarm.bellCount, type);
      setTimeout(() => speakTTS(alarm.ttsMessage, alarm.ttsVoiceIndex), alarm.bellCount * 1200 + 200);
    }
  };

  const { bg } = TYPE_LABELS[alarm.type];
  const hasVoice = alarm.soundType === 'voice' || alarm.soundType === 'bell+voice';
  const hasBell = alarm.soundType === 'bell' || alarm.soundType === 'bell+voice';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${bg}`}>
            {TYPE_LABELS[alarm.type].text}
          </span>
          <span className="text-xs text-slate-400">{TIMING_LABELS[alarm.type]}</span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={alarm.enabled}
            onChange={e => update({ enabled: e.target.checked })}
            className="accent-blue-600 w-4 h-4"
          />
          <span className="text-xs font-medium text-slate-500">有効</span>
        </label>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Timing */}
        {(alarm.type === 'warning' || alarm.type === 'overtime') && (
          <TimeInput
            label={alarm.type === 'overtime' ? 'インターバル' : '残り時間'}
            seconds={alarm.triggerAtSeconds}
            onChange={v => update({ triggerAtSeconds: v })}
          />
        )}

        {/* Sound type + Bell count */}
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">サウンド</label>
            <select
              value={alarm.soundType}
              onChange={e => update({ soundType: e.target.value as AlarmConfig['soundType'] })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {Object.entries(SOUND_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {hasBell && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ベルの種類</label>
                <select
                  value={alarm.bellType ?? 'chime1'}
                  onChange={e => update({ bellType: e.target.value as AlarmConfig['bellType'] })}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {BELL_TYPES.map(t => (
                    <option key={t} value={t}>{getBellTypeName(t)}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">回数</label>
                <select
                  value={alarm.bellCount}
                  onChange={e => update({ bellCount: Number(e.target.value) as 1 | 2 | 3 })}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value={1}>1回</option>
                  <option value={2}>2回</option>
                  <option value={3}>3回</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Voice settings */}
        {hasVoice && (
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">音声</label>
              <select
                value={alarm.ttsVoiceIndex}
                onChange={e => update({ ttsVoiceIndex: Number(e.target.value) })}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {VOICE_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-44">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">メッセージ</label>
              <input
                type="text"
                value={alarm.ttsMessage}
                onChange={e => update({ ttsMessage: e.target.value })}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        {/* Preview button */}
        <div className="flex justify-end">
          <button
            onClick={preview}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
          >
            <span>▶</span> プレビュー
          </button>
        </div>
      </div>
    </div>
  );
}
