import { useCallback, useRef, useState } from 'react';
import type { ZoomConfig } from '../types';
import { generateZoomSignature } from '../utils/signature';
import { getVirtualAudioStream } from '../utils/audioEngine';

export type ZoomStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useZoomBot() {
  const [status, setStatus] = useState<ZoomStatus>('disconnected');
  const [errorMsg, setErrorMsg] = useState('');
  const clientRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const join = useCallback(async (config: ZoomConfig) => {
    if (!config.clientId || !config.clientSecret) {
      setErrorMsg('Zoom SDK credentials are not configured. Please add them in Settings.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMsg('');

    try {
      const { default: ZoomMtgEmbedded } = await import('@zoom/meetingsdk/embedded');

      const client = ZoomMtgEmbedded.createClient() as any;
      clientRef.current = client;

      // Create an invisible container for Zoom SDK UI
      let container = document.getElementById('zoom-sdk-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'zoom-sdk-container';
        container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(container);
      }

      await client.init({
        zoomAppRoot: container as HTMLElement,
        language: 'en-US',
        customize: {
          meetingInfo: [],
          toolbar: { buttons: [] },
          video: { isResizable: false, viewSizes: { default: { width: 1, height: 1 } } },
        },
      });

      const signature = generateZoomSignature(
        config.clientId,
        config.clientSecret,
        config.meetingNumber,
        0
      );

      await client.join({
        signature,
        sdkKey: config.clientId,
        meetingNumber: config.meetingNumber,
        password: config.passcode,
        userName: config.displayName || 'Meeting Timer',
      });

      setStatus('connected');

      // Start virtual video from canvas
      setTimeout(async () => {
        try {
          const mediaStream = client.getMediaStream();

          if (canvasRef.current) {
            const videoStream = (canvasRef.current as any).captureStream(30) as MediaStream;
            await mediaStream.startVideo({ videoElement: canvasRef.current });
            void videoStream; // used implicitly by SDK
          }

          // Inject virtual audio stream
          const audioStream = getVirtualAudioStream();
          if (audioStream) {
            await mediaStream.startAudio({ stream: audioStream });
          } else {
            await mediaStream.startAudio();
          }
        } catch (e) {
          console.warn('Media setup error (non-fatal):', e);
        }
      }, 2000);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message ?? 'Failed to join meeting');
    }
  }, []);

  const leave = useCallback(async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.leaveMeeting();
      }
    } catch {
      // ignore
    } finally {
      clientRef.current = null;
      setStatus('disconnected');
    }
  }, []);

  return { status, errorMsg, join, leave, canvasRef };
}
