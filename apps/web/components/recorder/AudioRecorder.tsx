'use client';

import React from 'react';
import { Button } from '@repo/ui/components/button';
import { Play, Square, Loader2, AlertCircle } from 'lucide-react';
import { useAudioRecorder } from '@/context/AudioRecorderContext';

export const AudioRecorder = ({ consentGiven }: { consentGiven: boolean }) => {
  const { status, startRecording, stopRecording, recordingTime, error } = useAudioRecorder();

  const handleStart = async () => {
    await startRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='flex flex-col items-center justify-center gap-4 p-4 border rounded-lg bg-background'>
      <div className='text-center'>
        <p className='text-lg font-semibold'>Session Recording</p>
        <p className='text-sm text-muted-foreground mt-1'>
          Record your virtual session to generate a transcript and AI-powered action plan.
        </p>
      </div>

      <div className='my-4'>
        <div className='text-5xl font-mono font-bold text-foreground'>{formatTime(recordingTime)}</div>
      </div>

      <div className='w-full'>
        {status === 'idle' || status === 'stopped' || status === 'error' ? (
          <Button onClick={handleStart} className='w-full' size='lg' disabled={!consentGiven}>
            <Play className='mr-2 h-5 w-5' />
            Start Session
          </Button>
        ) : status === 'permission' ? (
          <Button disabled className='w-full' size='lg'>
            <Loader2 className='mr-2 h-5 w-5 animate-spin' />
            Awaiting Permissions...
          </Button>
        ) : (
          <Button variant='destructive' onClick={stopRecording} className='w-full' size='lg'>
            <Square className='mr-2 h-5 w-5' />
            Stop Recording
          </Button>
        )}
      </div>

      {status === 'error' && (
        <div className='flex items-center text-destructive mt-2 text-sm'>
          <AlertCircle className='mr-2 h-4 w-4' />
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}
    </div>
  );
};
