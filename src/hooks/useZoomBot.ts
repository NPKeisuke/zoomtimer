import { useCallback, useRef, useState } from 'react';
import type { ZoomConfig } from '../types';
import { generateZoomSignature } from '../utils/signature';
import { getAudioContext, getVirtualAudioStream } from '../utils/audioEngine';

export type ZoomStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

let originalGetUserMedia: typeof navigator.mediaDevices.getUserMedia | null = null;

function installVirtualMedia(canvas: HTMLCanvasElement, audioStream: MediaStream | null) {
  if (originalGetUserMedia) return;
  originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  navigator.mediaDevices.getUserMedia = async (
    constraints?: MediaStreamConstraints
  ): Promise<MediaStream> => {
    console.log('[VirtualMedia] getUserMedia intercepted:', constraints);
    const stream = new MediaStream();

    if (constraints?.video) {
      try {
        const canvasStream = (canvas as HTMLCanvasElement & {
          captureStream: (fps?: number) => MediaStream;
        }).captureStream(30);
        canvasStream.getVideoTracks().forEach(t => stream.addTrack(t));
        console.log('[VirtualMedia] canvas video added');
      } catch (e) {
        console.warn('[VirtualMedia] canvas capture failed:', e);
      }
    }

    if (constraints?.audio && audioStream) {
      audioStream.getAudioTracks().forEach(t => stream.addTrack(t.clone()));
      console.log('[VirtualMedia] virtual audio added');
    }

    if (stream.getTracks().length === 0 && originalGetUserMedia) {
      console.log('[VirtualMedia] no virtual tracks, using real device');
      return originalGetUserMedia(constraints);
    }
    return stream;
  };

  console.log('[VirtualMedia] hook installed');
}

function uninstallVirtualMedia() {
  if (originalGetUserMedia) {
    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    originalGetUserMedia = null;
    console.log('[VirtualMedia] hook uninstalled');
  }
}

export function useZoomBot() {
  const [status, setStatus] = useState<ZoomStatus>('disconnected');
  const [errorMsg, setErrorMsg] = useState('');
  const clientRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const join = useCallback(async (config: ZoomConfig) => {
    if (!config.clientId || !config.clientSecret) {
      setErrorMsg('Zoom SDK の認証情報が未設定です。');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMsg('');

    try {
      // Initialize audio context (needs user gesture; this counts because join is triggered by click)
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      // Install virtual media BEFORE the SDK loads, so any getUserMedia call is intercepted
      const canvas = canvasRef.current;
      const audioStream = getVirtualAudioStream();
      if (canvas) {
        installVirtualMedia(canvas, audioStream);
      } else {
        console.warn('[VirtualMedia] canvas ref not yet available');
      }

      const { default: ZoomMtgEmbedded } = await import('@zoom/meetingsdk/embedded');
      const client = ZoomMtgEmbedded.createClient() as any;
      clientRef.current = client;

      let container = document.getElementById('zoom-sdk-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'zoom-sdk-container';
        container.style.cssText =
          'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;';
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

      // Start video and audio — the SDK will call getUserMedia, which is now hooked
      setTimeout(async () => {
        try {
          const mediaStream = client.getMediaStream();

          try {
            await mediaStream.startVideo();
            console.log('[VirtualMedia] startVideo OK');
          } catch (e) {
            console.warn('[VirtualMedia] startVideo failed:', e);
          }

          try {
            await mediaStream.startAudio();
            console.log('[VirtualMedia] startAudio OK');
          } catch (e) {
            console.warn('[VirtualMedia] startAudio failed:', e);
          }

          // Unmute (some SDK versions start muted)
          try {
            await mediaStream.unmuteAudio();
          } catch {
            /* ignore */
          }
        } catch (e) {
          console.warn('media setup error:', e);
        }
      }, 2500);
    } catch (e: any) {
      uninstallVirtualMedia();
      setStatus('error');
      setErrorMsg(e?.message ?? 'ミーティング参加に失敗しました');
    }
  }, []);

  const leave = useCallback(async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.leaveMeeting();
      }
    } catch {
      /* ignore */
    } finally {
      uninstallVirtualMedia();
      clientRef.current = null;
      setStatus('disconnected');
    }
  }, []);

  return { status, errorMsg, join, leave, canvasRef };
}
