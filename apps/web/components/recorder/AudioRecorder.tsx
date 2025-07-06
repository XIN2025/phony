'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { Button } from '@repo/ui/components/button';
import { Play, Square, Loader2, AlertCircle, Pause, RotateCcw } from 'lucide-react';
import { useAudioRecorder } from '@/context/AudioRecorderContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogClose,
  DialogDescription,
} from '@repo/ui/components/dialog';
import { ApiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export interface AudioRecorderHandle {
  getStatus: () => string;
  stop: () => void;
}

export const AudioRecorder = forwardRef<
  AudioRecorderHandle,
  {
    onRequestEndSession?: (audioBlob: Blob, duration: string) => void;
    clientId?: string;
    sessionTitle?: string;
    sessionNotes?: string;
  }
>(({ onRequestEndSession, clientId, sessionTitle, sessionNotes }, ref) => {
  const { status, startRecording, stopRecording, pauseRecording, resumeRecording, recordingTime, error, audioBlob } =
    useAudioRecorder();
  const [showConsentModal, setShowConsentModal] = React.useState(false);
  const [showStopConfirmationModal, setShowStopConfirmationModal] = React.useState(false);
  const [showProcessingModal, setShowProcessingModal] = React.useState(false);
  const [processingError, setProcessingError] = React.useState<string | null>(null);
  const [processingDuration, setProcessingDuration] = React.useState('');
  const [consentGiven, setConsentGiven] = React.useState(false);
  const [pendingStop, setPendingStop] = React.useState(false);
  const hasCalledOnStop = React.useRef(false);
  const router = useRouter();
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);
  const [processingSessionId, setProcessingSessionId] = React.useState<string | null>(null);
  const [stopModalError, setStopModalError] = React.useState<string | null>(null);

  const handleStart = async () => {
    // Always attempt to start recording, do not block for permissions
    setShowConsentModal(false);
    await startRecording();
  };

  const handleConsentAndStart = async () => {
    setShowConsentModal(false);
    await startRecording();
  };

  const handlePause = () => {
    pauseRecording && pauseRecording();
  };

  const handleResume = () => {
    resumeRecording && resumeRecording();
  };

  const handleStopClick = () => {
    console.log('[AudioRecorder] Stop button clicked, showing confirmation modal');
    setShowStopConfirmationModal(true);
  };

  const handleStopConfirm = async () => {
    if (!sessionTitle || sessionTitle.trim() === '') {
      setStopModalError('Please enter a session title before ending the session.');
      return;
    }
    setStopModalError(null);
    setShowStopConfirmationModal(false);
    if (status === 'recording' || status === 'paused') {
      stopRecording();
    }
  };

  const handleStopCancel = () => {
    console.log('[AudioRecorder] Stop cancelled');
    setShowStopConfirmationModal(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useImperativeHandle(
    ref,
    () => ({
      getStatus: () => status,
      stop: () => {
        if (status === 'recording' || status === 'paused') {
          stopRecording();
        }
      },
    }),
    [status, stopRecording],
  );

  React.useEffect(() => {
    console.log('[AudioRecorder] upload/useEffect', {
      status,
      audioBlob,
      hasCalledOnStop: hasCalledOnStop.current,
      clientId,
      sessionTitle,
      sessionNotes,
    });
    if (status === 'stopped' && audioBlob && !hasCalledOnStop.current) {
      const duration = formatTime(recordingTime);
      setProcessingDuration(duration);
      setShowProcessingModal(true);
      (async () => {
        setProcessingError(null);
        if (!clientId || !sessionTitle) {
          setProcessingError('Missing client or session information.');
          console.error('[AudioRecorder] Missing clientId or sessionTitle', { clientId, sessionTitle });
          return;
        }
        try {
          console.log('[AudioRecorder] Creating session', { clientId, sessionTitle, sessionNotes });
          const res = await ApiClient.post<{ id: string }>('/api/sessions', {
            clientId,
            title: sessionTitle,
            notes: sessionNotes || '',
          });
          const sessionId = res.id;
          setProcessingSessionId(sessionId);
          console.log('[AudioRecorder] Session created', { sessionId });
          // 2. Upload audio
          const formData = new FormData();
          formData.append('audio', audioBlob, `session_${sessionId}.webm`);
          // Parse duration (e.g., '56:27') to seconds
          let durationSeconds = undefined;
          const match = duration.match(/(\d+):(\d+)/);
          if (match && match[1] && match[2]) {
            durationSeconds = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
          }
          if (typeof durationSeconds === 'number' && !isNaN(durationSeconds) && durationSeconds > 0) {
            formData.append('durationSeconds', String(durationSeconds));
          }
          console.log('[AudioRecorder] Uploading audio', { sessionId, durationSeconds });
          await ApiClient.post(`/api/sessions/${sessionId}/upload`, formData, {});
          console.log('[AudioRecorder] Audio uploaded successfully');
          // Start polling for REVIEW_READY
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = setInterval(async () => {
            try {
              console.log('[AudioRecorder] Polling session status', { sessionId });
              const session = (await ApiClient.get(`/api/sessions/${sessionId}`)) as any;
              console.log('[AudioRecorder] Polled session object', session);
              if (session && session.status === 'REVIEW_READY') {
                console.log('[AudioRecorder] Session is REVIEW_READY, redirecting', { sessionId });
                if (pollingRef.current) clearInterval(pollingRef.current);
                setShowProcessingModal(false);
                router.push(`/practitioner/sessions/${sessionId}`);
              }
            } catch (err) {
              console.error('[AudioRecorder] Polling error', err);
            }
          }, 2000);
        } catch (err: any) {
          setProcessingError(err.message || 'Failed to upload audio or create session');
          console.error('[AudioRecorder] Upload error', err);
        }
      })();
      hasCalledOnStop.current = true;
    }
    if (status === 'recording' || status === 'paused') {
      hasCalledOnStop.current = false;
    }
  }, [status, audioBlob, recordingTime, clientId, sessionTitle, sessionNotes]);

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <>
      {console.log('[AudioRecorder] render', { status, audioBlob, recordingTime })}
      <div className='bg-background border border-border rounded-2xl shadow-none flex flex-col w-full h-full px-6 py-8'>
        <div className='flex flex-col flex-grow justify-between h-full'>
          <div className='w-full text-center'>
            <p className='text-lg font-semibold mb-2'>Audio Recording</p>
            <div className='text-5xl font-mono font-bold text-foreground text-center mb-2 mt-6'>
              {formatTime(recordingTime)}
            </div>
          </div>
          <div className='flex-1' />
          <div className='w-full flex flex-row gap-4 items-center justify-center mt-8'>
            {(status === 'idle' || status === 'stopped' || status === 'error') && (
              <Button
                aria-label='Start Recording'
                onClick={handleStart}
                className='flex-1 rounded-full bg-foreground text-background hover:bg-foreground/90 focus:ring-2 focus:ring-offset-2 focus:ring-foreground'
                size='lg'
              >
                <Play className='mr-2 h-5 w-5' />
                Start Recording
              </Button>
            )}
            {status === 'recording' && (
              <>
                <Button
                  aria-label='Pause Recording'
                  onClick={handlePause}
                  className='flex-1 rounded-full bg-foreground text-background hover:bg-foreground/90 focus:ring-2 focus:ring-offset-2 focus:ring-foreground'
                  size='lg'
                >
                  <Pause className='mr-2 h-5 w-5' />
                  Pause
                </Button>
                <Button
                  aria-label='Stop Recording'
                  variant='outline'
                  onClick={handleStopClick}
                  className='flex-1 rounded-full border border-foreground text-foreground hover:bg-foreground hover:text-background focus:ring-2 focus:ring-offset-2 focus:ring-foreground'
                  size='lg'
                >
                  <Square className='mr-2 h-5 w-5' />
                  Stop
                </Button>
              </>
            )}
            {status === 'paused' && (
              <>
                <Button
                  aria-label='Resume Recording'
                  onClick={handleResume}
                  className='flex-1 rounded-full bg-foreground text-background hover:bg-foreground/90 focus:ring-2 focus:ring-offset-2 focus:ring-foreground'
                  size='lg'
                >
                  <RotateCcw className='mr-2 h-5 w-5' />
                  Resume
                </Button>
                <Button
                  aria-label='Stop Recording'
                  variant='outline'
                  onClick={handleStopClick}
                  className='flex-1 rounded-full border border-foreground text-foreground hover:bg-foreground hover:text-background focus:ring-2 focus:ring-offset-2 focus:ring-foreground'
                  size='lg'
                >
                  <Square className='mr-2 h-5 w-5' />
                  Stop
                </Button>
              </>
            )}
            {status === 'permission' && (
              <Button disabled className='flex-1 rounded-full bg-gray-200 text-gray-500' size='lg'>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                Awaiting Permissions...
              </Button>
            )}
          </div>
          {status === 'error' && (
            <div className='flex items-center text-destructive mt-2 text-sm w-full justify-center'>
              <AlertCircle className='mr-2 h-4 w-4' />
              <p>
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Consent Modal */}
      {showConsentModal && (
        <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
          <DialogOverlay className='backdrop-blur-[6px] bg-black/5' />
          <DialogContent showCloseButton className='max-w-md w-full max-h-[90vh] p-6 test-center-modal'>
            <DialogHeader>
              <DialogTitle>Consent</DialogTitle>
            </DialogHeader>
            <div className='w-full border rounded-xl p-4 mb-6'>
              <div className='mb-3 font-medium'>Client Consent</div>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className='accent-black w-5 h-5'
                />
                <span className='text-sm'>Client has consented for session recording</span>
              </label>
            </div>
            <button
              className='bg-foreground text-background px-4 py-2 rounded-full w-full text-base font-semibold transition disabled:opacity-60'
              disabled={!consentGiven}
              onClick={handleConsentAndStart}
            >
              Start Recording
            </button>
          </DialogContent>
        </Dialog>
      )}

      {/* Stop Confirmation Modal */}
      {showStopConfirmationModal && (
        <Dialog open={showStopConfirmationModal} onOpenChange={setShowStopConfirmationModal}>
          <DialogOverlay className='backdrop-blur-[6px] bg-black/5' />
          <DialogContent
            showCloseButton={false}
            className='max-w-sm w-full max-h-[90vh] p-8 flex flex-col items-center text-center test-center-modal'
          >
            <DialogHeader>
              <DialogTitle className='text-xl font-semibold mb-2'>End Session?</DialogTitle>
              <DialogDescription className='mb-6 text-base'>
                Are you sure you want to stop and end this session?
              </DialogDescription>
            </DialogHeader>
            {stopModalError && <div className='text-destructive mb-4'>{stopModalError}</div>}
            <div className='flex gap-4 w-full justify-center mt-2'>
              <Button variant='outline' className='flex-1 py-2' onClick={handleStopCancel}>
                Cancel
              </Button>
              <Button className='flex-1 py-2 bg-black text-white' onClick={handleStopConfirm}>
                Stop
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Processing Modal */}
      {showProcessingModal && (
        <Dialog open={showProcessingModal}>
          <DialogOverlay className='backdrop-blur-[6px] bg-black/5' />
          <DialogContent
            showCloseButton={false}
            className='max-w-sm w-full max-h-[90vh] p-8 flex flex-col items-center text-center test-center-modal'
          >
            <DialogHeader>
              <DialogTitle className='text-xl font-semibold mb-2'>Session Ended</DialogTitle>
            </DialogHeader>
            <div className='text-4xl font-mono font-bold my-4'>
              {(() => {
                // Convert processingDuration (e.g. '56:27') to '56m 27s'
                const match = processingDuration.match(/(\d+):(\d+)/);
                if (match && match[1] && match[2]) {
                  return `${parseInt(match[1], 10)}m ${match[2]}s`;
                }
                return processingDuration;
              })()}
            </div>
            <div className='text-muted-foreground mb-2'>Processing Audio & Transcript...</div>
            {processingError && <div className='text-destructive mt-2'>{processingError}</div>}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});
