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
} from '@repo/ui/components/dialog';
import { ApiClient } from '@/lib/api-client';

export interface AudioRecorderHandle {
  getStatus: () => string;
  stop: () => void;
}

export const AudioRecorder = forwardRef<AudioRecorderHandle, { onStop?: (audioBlob: Blob, duration: string) => void }>(
  ({ onStop }, ref) => {
    const { status, startRecording, stopRecording, pauseRecording, resumeRecording, recordingTime, error, audioBlob } =
      useAudioRecorder();
    const [showConsentModal, setShowConsentModal] = React.useState(false);
    const [consentGiven, setConsentGiven] = React.useState(false);
    const [showEndModal, setShowEndModal] = React.useState(false);
    const [finalDuration, setFinalDuration] = React.useState('');
    const [showConfirmStopModal, setShowConfirmStopModal] = React.useState(false);
    const [pendingStop, setPendingStop] = React.useState(false);

    const handleStart = async () => {
      setShowConsentModal(true);
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

    const handleStop = () => {
      setShowConfirmStopModal(true);
    };

    const confirmStopRecording = () => {
      setShowConfirmStopModal(false);
      const duration = formatTime(recordingTime);
      if (status !== 'stopped') {
        setPendingStop(true);
        stopRecording();
      } else {
        if (onStop && audioBlob) onStop(audioBlob, duration);
      }
    };

    const cancelStopRecording = () => {
      setShowConfirmStopModal(false);
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
      if (pendingStop && status === 'stopped' && audioBlob) {
        const duration = formatTime(recordingTime);
        if (onStop) onStop(audioBlob, duration);
        setPendingStop(false);
      }
    }, [pendingStop, status, audioBlob, onStop, recordingTime]);

    return (
      <>
        <div className='bg-white border border-border rounded-2xl shadow-sm flex flex-col w-full h-full px-6 py-8'>
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
                  className='flex-1 rounded-full bg-black text-white hover:bg-black/90 focus:ring-2 focus:ring-offset-2 focus:ring-black'
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
                    className='flex-1 rounded-full bg-black text-white hover:bg-black/90 focus:ring-2 focus:ring-offset-2 focus:ring-black'
                    size='lg'
                  >
                    <Pause className='mr-2 h-5 w-5' />
                    Pause
                  </Button>
                  <Button
                    aria-label='Stop Recording'
                    variant='outline'
                    onClick={handleStop}
                    className='flex-1 rounded-full border border-black text-black hover:bg-black hover:text-white focus:ring-2 focus:ring-offset-2 focus:ring-black'
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
                    className='flex-1 rounded-full bg-black text-white hover:bg-black/90 focus:ring-2 focus:ring-offset-2 focus:ring-black'
                    size='lg'
                  >
                    <RotateCcw className='mr-2 h-5 w-5' />
                    Resume
                  </Button>
                  <Button
                    aria-label='Stop Recording'
                    variant='outline'
                    onClick={handleStop}
                    className='flex-1 rounded-full border border-black text-black hover:bg-black hover:text-white focus:ring-2 focus:ring-offset-2 focus:ring-black'
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
                className='bg-black text-white px-4 py-2 rounded-full w-full text-base font-semibold transition disabled:opacity-60'
                disabled={!consentGiven}
                onClick={handleConsentAndStart}
              >
                Start Recording
              </button>
            </DialogContent>
          </Dialog>
        )}
        {showConfirmStopModal && (
          <Dialog open={showConfirmStopModal} onOpenChange={setShowConfirmStopModal}>
            <DialogOverlay className='backdrop-blur-[6px] bg-black/5' />
            <DialogContent showCloseButton className='max-w-md w-full max-h-[90vh] p-6 test-center-modal'>
              <DialogHeader>
                <DialogTitle>End Session?</DialogTitle>
              </DialogHeader>
              <div className='mb-4'>Are you sure you want to end the session and stop recording?</div>
              <div className='flex gap-4 justify-end'>
                <Button variant='outline' onClick={cancelStopRecording}>
                  Cancel
                </Button>
                <Button className='bg-black text-white' onClick={confirmStopRecording}>
                  End Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  },
);
