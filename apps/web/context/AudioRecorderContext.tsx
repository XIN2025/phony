'use client';

import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import { ApiClient } from '@/lib/api-client';

type RecordingStatus = 'idle' | 'permission' | 'recording' | 'paused' | 'stopped' | 'error';

interface AudioRecorderContextType {
  status: RecordingStatus;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  audioBlob: Blob | null;
  error: string | null;
  recordingTime: number;
}

const AudioRecorderContext = createContext<AudioRecorderContextType | undefined>(undefined);

const getSupportedMimeType = () => {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
};

export const AudioRecorderProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupStreams = () => {
    if (combinedStreamRef.current) {
      combinedStreamRef.current.getTracks().forEach((track) => track.stop());
      combinedStreamRef.current = null;
    }
  };

  const startRecording = async () => {
    setStatus('permission');
    setError(null);
    setAudioBlob(null);

    try {
      const systemStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (systemStream.getAudioTracks().length === 0) {
        toast.error('Tab audio not shared', {
          description: 'Please ensure you check "Share tab audio" in the browser prompt.',
        });
        systemStream.getTracks().forEach((track) => track.stop());
        userStream.getTracks().forEach((track) => track.stop());
        setStatus('error');
        setError('Tab audio permission denied.');
        return;
      }

      const audioContext = new AudioContext();
      const systemSource = audioContext.createMediaStreamSource(systemStream);
      const userSource = audioContext.createMediaStreamSource(userStream);
      const destination = audioContext.createMediaStreamDestination();

      systemSource.connect(destination);
      userSource.connect(destination);

      combinedStreamRef.current = destination.stream;

      audioChunksRef.current = [];
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(combinedStreamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setStatus('stopped');
        cleanupStreams();
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError(`Recording error: ${event.type}`);
        setStatus('error');
        cleanupStreams();
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };

      console.log('Inspecting combined stream before recording...');
      console.log(`Stream is active: ${combinedStreamRef.current.active}`);
      const audioTracks = combinedStreamRef.current.getAudioTracks();
      console.log(`Found ${audioTracks.length} audio tracks in combined stream.`);
      if (audioTracks.length === 0) {
        throw new Error('The combined stream has no audio tracks. Recording cannot start.');
      }
      audioTracks.forEach((track, index) => {
        console.log(`Audio Track ${index + 1} readyState: ${track.readyState}`);
      });

      recorder.start();
      setStatus('recording');

      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to start recording: ${message}`);
      toast.error('Permission Denied', {
        description: 'Could not start recording. Please ensure you grant all permissions.',
      });
      setStatus('error');
      cleanupStreams();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const value = {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    audioBlob,
    error,
    recordingTime,
  };

  return <AudioRecorderContext.Provider value={value}>{children}</AudioRecorderContext.Provider>;
};

export const useAudioRecorder = () => {
  const context = useContext(AudioRecorderContext);
  if (context === undefined) {
    throw new Error('useAudioRecorder must be used within an AudioRecorderProvider');
  }
  return context;
};
