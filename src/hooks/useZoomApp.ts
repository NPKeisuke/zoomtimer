import { useCallback, useEffect, useState } from 'react';
import zoomSdk from '@zoom/appssdk';

export type ZoomAppStatus = 'initializing' | 'ready' | 'sharing' | 'error' | 'not-in-zoom';

export function useZoomApp() {
  const [status, setStatus] = useState<ZoomAppStatus>('initializing');
  const [errorMsg, setErrorMsg] = useState('');
  const [context, setContext] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await zoomSdk.config({
          capabilities: ['shareApp', 'getRunningContext', 'getMeetingContext'],
        });
        if (cancelled) return;
        const ctx = (config as unknown as { runningContext?: string })?.runningContext ?? '';
        setContext(ctx);
        if (ctx === 'inMeeting' || ctx === 'inImmersive') {
          setStatus('ready');
        } else {
          setStatus('ready'); // still allow timer to run, sharing won't work though
        }
      } catch (e: unknown) {
        if (cancelled) return;
        // If config fails, we're probably not running inside Zoom
        setStatus('not-in-zoom');
        const msg = e instanceof Error ? e.message : 'Zoom App SDK の初期化に失敗しました';
        setErrorMsg(msg);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const share = useCallback(async () => {
    try {
      await zoomSdk.shareApp({ action: 'start', withSound: true });
      setStatus('sharing');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '共有開始に失敗しました';
      setErrorMsg(msg);
      setStatus('error');
    }
  }, []);

  const stopShare = useCallback(async () => {
    try {
      await zoomSdk.shareApp({ action: 'stop' });
      setStatus('ready');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '共有停止に失敗しました';
      setErrorMsg(msg);
    }
  }, []);

  return { status, errorMsg, context, share, stopShare };
}
