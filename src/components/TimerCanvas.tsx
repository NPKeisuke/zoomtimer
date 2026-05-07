import { useEffect, useRef } from 'react';
import type { TimerState } from '../types';

interface Props {
  state: TimerState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  size?: number;
}

function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TimerCanvas({ state, canvasRef, size = 480 }: Props) {
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.38;
      const lineW = Math.min(w, h) * 0.05;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Progress arc
      const isWarning = state.phase === 'warning';
      const isOvertime = state.isOvertime;
      const progress = state.isOvertime
        ? 0
        : state.totalSeconds > 0
          ? state.remainingSeconds / state.totalSeconds
          : 0;

      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + 2 * Math.PI * progress;

      // Track (background circle)
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = lineW;
      ctx.stroke();

      // Progress arc
      if (!isOvertime && progress > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.strokeStyle = isWarning ? '#ef4444' : '#3b82f6';
        ctx.lineWidth = lineW;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Overtime pulsing red arc
      if (isOvertime) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(239,68,68,${0.3 + pulse * 0.4})`;
        ctx.lineWidth = lineW;
        ctx.stroke();
      }

      // Time display
      const displaySeconds = isOvertime ? state.overtimeSeconds : state.remainingSeconds;
      const timeStr = isOvertime ? `+${formatTime(displaySeconds)}` : formatTime(displaySeconds);

      const textColor = isWarning || isOvertime ? '#dc2626' : '#1e293b';
      const fontSize = w * 0.16;
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeStr, cx, cy);

      // Status label
      const labelSize = w * 0.055;
      ctx.font = `${labelSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = isWarning ? '#ef4444' : isOvertime ? '#dc2626' : '#94a3b8';
      const label = isOvertime ? 'OVERTIME' : isWarning ? 'WARNING' : state.phase === 'idle' ? 'READY' : '';
      if (label) ctx.fillText(label, cx, cy + fontSize * 0.78);

      // "Meeting Timer" branding at bottom
      ctx.font = `${w * 0.042}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('Meeting Timer', cx, h - w * 0.07);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, canvasRef]);

  return (
    <canvas
      ref={canvasRef as React.RefObject<HTMLCanvasElement>}
      width={size}
      height={size}
      className="rounded-2xl shadow-lg"
      style={{ width: size, height: size }}
    />
  );
}
