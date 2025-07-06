'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { AudioRecorder } from '@/components/recorder/AudioRecorder';

interface Session {
  id: string;
  title?: string;
  status: string;
}

export default function PractitionerSessionsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [recordingEnded, setRecordingEnded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mockSummary, setMockSummary] = useState<string>('');
  const [mockNotes, setMockNotes] = useState<string>('');
  const [mockTranscript, setMockTranscript] = useState<string>('');

  const { data: sessions, refetch } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const result = await ApiClient.get<Session[]>('/sessions/practitioner/me');
      console.log('Sessions data:', result);
      return result;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ sessionId, file }: { sessionId: string; file: File }) => {
      const formData = new FormData();
      formData.append('audio', file);
      await ApiClient.post(`/sessions/${sessionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => refetch(),
  });

  const handleFileChange = (sessionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate({ sessionId, file });
    }
  };

  const handleSessionClick = (sessionId: string) => {
    console.log('Clicking session:', sessionId);
    router.push(`/practitioner/(main)/sessions/${sessionId}`);
  };

  useEffect(() => {
    setShowConsentModal(true);
  }, []);

  // When recording ends, show processing modal
  const handleRecordingEnd = (id: string) => {
    setRecordingEnded(true);
    setShowProcessingModal(true);
    setSessionId(id);
    // Simulate processing, then redirect
    setTimeout(() => {
      setShowProcessingModal(false);
      router.push(`/practitioner/(main)/sessions/${id}`);
    }, 3000); // Simulate 3s processing
  };

  if (!sessions) return <div>Loading...</div>;

  console.log('Rendering sessions:', sessions);

  return (
    <div className='min-h-screen bg-background relative'>
      {/* Consent Modal */}
      {showConsentModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm'>
          <div className='bg-white rounded-xl shadow-xl px-8 py-10 flex flex-col items-center min-w-[320px]'>
            <h2 className='text-xl font-semibold mb-2'>Consent</h2>
            <div className='mb-4'>Client Consent</div>
            <label className='flex items-center mb-4'>
              <input
                type='checkbox'
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className='mr-2'
              />
              Client has consented for session recording
            </label>
            <button
              className='bg-black text-white px-4 py-2 rounded w-full'
              disabled={!consentGiven}
              onClick={() => setShowConsentModal(false)}
            >
              Start Recording
            </button>
          </div>
        </div>
      )}
      {/* Processing Modal */}
      {showProcessingModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm'>
          <div className='bg-white rounded-xl shadow-xl px-8 py-10 flex flex-col items-center min-w-[320px]'>
            <h2 className='text-2xl font-semibold mb-2'>Session Ended</h2>
            <div className='text-3xl font-bold mb-2'>56m 27s</div>
            <div className='text-base text-muted-foreground mb-1'>Processing Audio & Transcript...</div>
          </div>
        </div>
      )}
      {/* Main UI */}
      <div className='flex flex-col md:flex-row gap-6 p-8'>
        <div className='flex-1 space-y-6'>
          <div className='border rounded-lg p-6'>
            <div className='font-semibold mb-2'>Session Details</div>
            <div className='mb-2'>
              Client: <span className='font-bold'>Sophie Bennett</span>
            </div>
            <input className='border rounded px-2 py-1 w-full mb-2' placeholder='Session Title' />
          </div>
          <div className='border rounded-lg p-6'>
            <div className='font-semibold mb-2'>Session Notes</div>
            <textarea
              className='border rounded px-2 py-1 w-full min-h-[120px]'
              placeholder='Start typing your session notes here'
            />
          </div>
        </div>
        <div className='flex-1 space-y-6'>
          <div className='border rounded-lg p-6 flex flex-col items-center'>
            <AudioRecorder />
          </div>
          <div className='border rounded-lg p-6'>
            <div className='font-semibold mb-2'>Transcript</div>
            <div className='text-muted-foreground'>Once recording starts, the transcript will appear here</div>
          </div>
        </div>
      </div>
    </div>
  );
}
