'use client';
import { useRouter, useParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { AudioRecorder, AudioRecorderHandle } from '@/components/recorder/AudioRecorder';
import { useGetClient, useCreateSession, useUploadSessionAudio } from '@/lib/hooks/use-api';
import { Button } from '@repo/ui/components/button';
import Image from 'next/image';
import { AudioRecorderProvider } from '@/context/AudioRecorderContext';

export default function NewSessionPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const { data: client } = useGetClient(clientId);
  const createSessionMutation = useCreateSession();
  const uploadAudioMutation = useUploadSessionAudio();
  const audioRecorderRef = useRef<AudioRecorderHandle>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  return (
    <AudioRecorderProvider>
      <div className='min-h-screen flex flex-col'>
        <div className='flex flex-col gap-0 border-b px-2 lg:px-10 pt-2 pb-3 sm:pb-4'>
          <button
            type='button'
            aria-label='Back'
            onClick={() => router.back()}
            className='text-muted-foreground hover:text-foreground focus:outline-none'
            style={{ width: 44, height: 44, display: 'flex' }}
          >
            <Image src='/arrow-right.svg' alt='Back' width={54} height={54} className='h-14 w-14' />
          </button>
          <h2
            className='text-lg sm:text-xl md:text-3xl font-bold leading-tight mt-2'
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            New Session
          </h2>
        </div>
        <div className='flex flex-col md:flex-row gap-6 p-8 flex-1'>
          <div className='flex-1 space-y-6'>
            <div className='bg-white rounded-2xl shadow-lg p-6'>
              <div className='font-semibold mb-2'>Session Details</div>
              <div className='mb-2'>
                Client:{' '}
                <span className='font-bold'>
                  {client?.firstName} {client?.lastName}
                </span>
              </div>
              <input
                className='border rounded px-2 py-1 w-full mb-2'
                placeholder='Session Title'
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
              />
            </div>
            <div className='bg-white rounded-2xl shadow-lg p-6'>
              <div className='font-semibold mb-2'>Session Notes</div>
              <textarea
                className='border rounded px-2 py-1 w-full min-h-[120px]'
                placeholder='Start typing your session notes here'
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
          </div>
          <div className='flex-1 space-y-6'>
            <div className='bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center'>
              <AudioRecorder
                ref={audioRecorderRef}
                clientId={clientId}
                sessionTitle={sessionTitle}
                sessionNotes={sessionNotes}
              />
            </div>
          </div>
        </div>
      </div>
    </AudioRecorderProvider>
  );
}
