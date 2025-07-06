'use client';

import { ApiClient } from '@/lib/api-client';
import { Button } from '@repo/ui/components/button';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Clock, FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type SuggestedActionItem = {
  id: string;
  description: string;
  category?: string;
  target?: string;
  frequency?: string;
  weeklyRepetitions?: number;
  isMandatory?: boolean;
  whyImportant?: string;
  recommendedActions?: string;
  toolsToHelp?: string;
  status: string;
};

type SessionDetail = {
  id: string;
  status: string;
  title?: string;
  transcript?: string;
  filteredTranscript?: string;
  aiSummary?: string;
  recordedAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  practitioner: {
    id: string;
    firstName: string;
    lastName: string;
    profession: string;
  };
  plan?: {
    id: string;
    status: string;
    actionItems?: Array<{
      id: string;
      description: string;
      category?: string;
      target?: string;
      frequency?: string;
      weeklyRepetitions?: number;
      isMandatory?: boolean;
      whyImportant?: string;
      recommendedActions?: string;
      toolsToHelp?: string;
    }>;
    suggestedActionItems?: SuggestedActionItem[];
  };
  audioFileUrl?: string;
  notes?: string;
  durationSeconds?: number;
  summary?: string;
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(true);

  const {
    data: session,
    isLoading,
    error,
    refetch,
  } = useQuery<SessionDetail, Error>({
    queryKey: ['session', sessionId],
    queryFn: async (): Promise<SessionDetail> => {
      const result = await ApiClient.get<SessionDetail>(`/api/sessions/${sessionId}`);
      return result;
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!session) return;
    if (session.status === 'TRANSCRIBING' || session.status === 'AI_PROCESSING') {
      setShowProcessingModal(true);
    } else {
      setShowProcessingModal(false);
    }
  }, [session]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REVIEW_READY':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'TRANSCRIBING':
      case 'AI_PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'TRANSCRIPTION_FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REVIEW_READY':
        return <CheckCircle className='h-4 w-4' />;
      case 'COMPLETED':
        return <CheckCircle className='h-4 w-4' />;
      case 'TRANSCRIBING':
      case 'AI_PROCESSING':
        return <Clock className='h-4 w-4' />;
      case 'TRANSCRIPTION_FAILED':
        return <FileText className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-2 text-sm text-muted-foreground'>Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-600'>Error loading session: {error.message}</p>
          <Button onClick={() => refetch()} className='mt-4'>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-muted-foreground'>No session found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background relative'>
      {/* Processing Modal Overlay */}
      {showProcessingModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm'>
          <div className='bg-white rounded-xl shadow-xl px-8 py-10 flex flex-col items-center min-w-[320px]'>
            <h2 className='text-2xl font-semibold mb-2'>Session Ended</h2>
            <div className='text-3xl font-bold mb-2'>
              {/* Show session duration if available, else 00:00 */}
              {session && session.recordedAt
                ? (() => {
                    const now = new Date();
                    const start = new Date(session.recordedAt);
                    const diff = Math.max(0, now.getTime() - start.getTime());
                    const mins = Math.floor(diff / 60000);
                    const secs = Math.floor((diff % 60000) / 1000);
                    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
                  })()
                : '00:00'}
            </div>
            <div className='text-base text-muted-foreground mb-1'>Processing Audio & Transcript...</div>
          </div>
        </div>
      )}
      {/* Header with Audio Player */}
      <div className='border-b bg-background px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={() => router.back()} className='h-8 w-8'>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div className='flex-1'>
            <h1 className='text-xl font-bold'>{session.title || 'Session Details'}</h1>
            <p className='text-sm text-muted-foreground'>
              {new Date(session.recordedAt).toLocaleDateString()} • {session.client.firstName} {session.client.lastName}
              {session.durationSeconds ? ` • Duration: ${formatDuration(session.durationSeconds)}` : ''}
            </p>
          </div>
        </div>
        {/* Audio Player */}
        {session.audioFileUrl && (
          <div className='mt-6 flex items-center gap-4'>
            <audio controls src={session.audioFileUrl} className='w-full max-w-xl' />
          </div>
        )}
      </div>

      {/* Main Content: Summary, Notes, Transcript */}
      <div className='p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Session Summary */}
        <div className='md:col-span-3'>
          <div className='border rounded-lg p-6 mb-6'>
            <h2 className='text-lg font-semibold mb-2'>Session Summary</h2>
            <div className='text-sm whitespace-pre-line'>
              {session.summary || session.aiSummary || 'No summary available.'}
            </div>
          </div>
        </div>
        {/* Session Notes */}
        <div className='border rounded-lg p-6'>
          <h3 className='font-semibold mb-2'>Session Notes</h3>
          <div className='text-sm whitespace-pre-line'>{session.notes || 'No notes available.'}</div>
        </div>
        {/* Transcript */}
        <div className='border rounded-lg p-6 md:col-span-2'>
          <h3 className='font-semibold mb-2'>Transcript</h3>
          <div className='bg-muted p-4 rounded-lg max-h-96 overflow-y-auto'>
            <pre className='text-sm whitespace-pre-wrap font-sans'>
              {session.transcript || 'No transcript available.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
