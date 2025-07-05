'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

// Define the Session type once for consistency
interface Session {
  id: string;
  title?: string;
  status: string;
  // Add other fields as needed
}

export default function PractitionerSessionsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

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

  if (!sessions) return <div>Loading...</div>;

  console.log('Rendering sessions:', sessions);

  return (
    <div className='max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-4'>Your Sessions</h1>
      <ul className='space-y-4'>
        {sessions.map((session) => (
          <li key={session.id} className='border p-4 rounded'>
            <div className='flex justify-between items-center'>
              <div>
                <button
                  onClick={() => handleSessionClick(session.id)}
                  className='text-blue-600 underline hover:text-blue-800'
                >
                  {session.title || 'Untitled Session'}
                </button>
                <div className='text-sm text-gray-500'>Status: {session.status}</div>
                <div className='text-xs text-gray-400'>ID: {session.id}</div>
              </div>
              <div>
                <input
                  type='file'
                  accept='audio/*'
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(session.id, e)}
                />
                <button
                  className='bg-blue-500 text-white px-3 py-1 rounded'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.status === 'pending'}
                >
                  Upload Audio
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
