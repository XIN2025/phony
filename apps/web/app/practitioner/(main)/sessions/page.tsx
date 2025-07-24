'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AudioRecorder } from '@/components/recorder/AudioRecorder';
import { useGetMySessions, useUploadSessionAudio } from '@/lib/hooks/use-api';

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

  // Use React Query hooks from use-api.ts
  const { data: sessions, refetch } = useGetMySessions();
  const uploadAudioMutation = useUploadSessionAudio();

  const handleFileChange = (sessionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('audio', file);
      uploadAudioMutation.mutate({ sessionId, formData });
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
    <div className='min-h-screen'>
      {/* Consent Modal */}
      {showConsentModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm p-4'>
          <div className='bg-white rounded-xl shadow-xl px-4 sm:px-8 py-6 sm:py-10 flex flex-col items-center w-full max-w-sm'>
            <h2 className='text-lg sm:text-xl font-semibold mb-2 text-center'>Consent</h2>
            <div className='mb-4 text-sm sm:text-base text-center'>Client Consent</div>
            <label className='flex items-center mb-4 text-sm sm:text-base'>
              <input
                type='checkbox'
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className='mr-2'
              />
              Client has consented for session recording
            </label>
            <button
              className='bg-black text-white px-4 py-2  rounded w-full text-sm sm:text-base'
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm p-4'>
          <div className='bg-white rounded-xl shadow-xl px-4 sm:px-8 py-6 sm:py-10 flex flex-col items-center w-full max-w-sm'>
            <h2 className='text-xl sm:text-2xl font-semibold mb-2 text-center'>Session Ended</h2>
            <div className='text-2xl sm:text-3xl font-bold mb-2 text-center'>56m 27s</div>
            <div className='text-sm sm:text-base text-muted-foreground mb-1 text-center'>
              Processing Audio & Transcript...
            </div>
          </div>
        </div>
      )}
      {/* Main UI */}
      <div className='flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8'>
        <div className='flex-1 space-y-4 sm:space-y-6'>
          <div className='bg-white rounded-2xl shadow-lg p-4 sm:p-6'>
            <div className='font-semibold mb-2 text-sm sm:text-base'>Session Details</div>
            <div className='mb-2 text-sm sm:text-base'>
              Client: <span className='font-bold'>Sophie Bennett</span>
            </div>
            <input className='border rounded px-2 py-1 w-full mb-2 text-sm sm:text-base' placeholder='Session Title' />
          </div>
          <div className='bg-white rounded-2xl shadow-lg p-4 sm:p-6'>
            <div className='font-semibold mb-2 text-sm sm:text-base'>Session Notes</div>
            <textarea
              className='border rounded px-2 py-1 w-full min-h-[120px] text-sm sm:text-base'
              placeholder='Start typing your session notes here'
            />
          </div>
        </div>
        <div className='flex-1 space-y-4 sm:space-y-6'>
          <div className='bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center'>
            <AudioRecorder />
          </div>
          <div className='bg-white rounded-2xl shadow-lg p-4 sm:p-6'>
            <div className='font-semibold mb-2 text-sm sm:text-base'>Transcript</div>
            <div className='text-muted-foreground text-sm sm:text-base'>
              Once recording starts, the transcript will appear here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
