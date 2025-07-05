'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';

type SuggestedActionItem = {
  id: string;
  description: string;
  category?: string;
  target?: string;
  frequency?: string;
  status: string;
};

type SessionDetail = {
  id: string;
  status: string;
  title?: string;
  transcript?: string;
  filteredTranscript?: string;
  aiSummary?: string;
  plan?: {
    suggestedActionItems?: SuggestedActionItem[];
  };
};

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  console.log('SessionDetailPage - sessionId:', sessionId);
  console.log('SessionDetailPage - params:', params);

  const {
    data: session,
    isLoading,
    error,
  } = useQuery<SessionDetail, Error>({
    queryKey: ['session', sessionId],
    queryFn: async (): Promise<SessionDetail> => {
      console.log('Fetching session data for ID:', sessionId);
      const result = await ApiClient.get<SessionDetail>(`/sessions/${sessionId}`);
      console.log('Session data received:', result);
      return result;
    },
    enabled: !!sessionId,
  });

  console.log('SessionDetailPage - session:', session);
  console.log('SessionDetailPage - isLoading:', isLoading);
  console.log('SessionDetailPage - error:', error);

  if (isLoading) return <div>Loading session details...</div>;
  if (error) return <div>Error loading session: {error.message}</div>;
  if (!session) return <div>No session found</div>;

  return (
    <div className='max-w-2xl mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-4'>Session Details</h1>
      <div className='mb-2'>
        Status: <span className='font-mono'>{session.status}</span>
      </div>
      <div className='mb-2'>Title: {session.title}</div>
      <div className='mb-2'>
        Transcript:{' '}
        <pre className='bg-gray-100 p-2 rounded overflow-x-auto'>{session.transcript || 'No transcript yet.'}</pre>
      </div>
      <div className='mb-2'>
        Filtered Transcript:{' '}
        <pre className='bg-gray-100 p-2 rounded overflow-x-auto'>
          {session.filteredTranscript || 'No filtered transcript yet.'}
        </pre>
      </div>
      <div className='mb-2'>
        AI Summary:{' '}
        <pre className='bg-gray-100 p-2 rounded overflow-x-auto'>{session.aiSummary || 'No summary yet.'}</pre>
      </div>
      <div className='mt-6'>
        <h2 className='text-xl font-semibold mb-2'>Suggested Action Items</h2>
        {session.plan?.suggestedActionItems?.length ? (
          <ul className='space-y-2'>
            {session.plan.suggestedActionItems.map((item: SuggestedActionItem) => (
              <li key={item.id} className='border p-2 rounded'>
                <div className='font-medium'>{item.description}</div>
                {item.category && <div className='text-xs text-gray-500'>Category: {item.category}</div>}
                {item.target && <div className='text-xs text-gray-500'>Target: {item.target}</div>}
                {item.frequency && <div className='text-xs text-gray-500'>Frequency: {item.frequency}</div>}
                <div className='text-xs text-gray-400'>Status: {item.status}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className='text-gray-500'>No suggested action items yet.</div>
        )}
      </div>
    </div>
  );
}
