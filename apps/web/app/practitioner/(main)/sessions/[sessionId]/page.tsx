'use client';

import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { PlanEditor } from '@/components/practitioner/PlanEditor';
import { useGeneratePlan, useGetSession, usePublishPlan, useUpdateSession } from '@/lib/hooks/use-api';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { ArrowLeft, Check, Edit2, Pause, Play, SkipBack, SkipForward, Sparkles, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { ClientPageHeader } from '@/components/practitioner/ClientPageHeader';
import { useGetClient } from '@/lib/hooks/use-api';

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
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  practitioner?: {
    id: string;
    firstName: string;
    lastName: string;
    profession: string;
  };
  plan?: any;
  audioFileUrl?: string;
  notes?: string;
  durationSeconds?: number;
  summary?: string;
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState<string | undefined>(undefined);
  const [notesDraft, setNotesDraft] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [complianceChecked, setComplianceChecked] = useState(false);

  const { data: session, isLoading, error, refetch } = useGetSession(sessionId);
  const { data: client, isLoading: isClientLoading } = useGetClient(session?.client?.id || '');

  const updateSessionMutation = useUpdateSession();
  const publishPlanMutation = usePublishPlan();
  const generatePlanMutation = useGeneratePlan();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => {
      setAudioProgress(audio.currentTime);
    };
    audio.addEventListener('timeupdate', updateProgress);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, [audioRef.current]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };
  const handleSkip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };
  const handleProgressBar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(e.target.value);
    audio.currentTime = value;
    setAudioProgress(value);
  };

  const formatDuration = (seconds?: number) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isSupportedAudio = (url?: string) => {
    if (!url) return false;
    return /\.(mp3|wav|ogg|webm)$/i.test(url);
  };
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    if (session) {
      setSummaryDraft(session.aiSummary);
      setNotesDraft(session.notes);
    }
  }, [session]);

  const handleSaveEdits = async () => {
    if (!session) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateSessionMutation.mutateAsync({
        sessionId: session.id,
        data: {
          aiSummary: summaryDraft,
          notes: notesDraft,
        },
      });
      setEditingSummary(false);
      setEditingNotes(false);
      await refetch();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save edits');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateActionPlan = async () => {
    if (!session) return;
    setIsGenerating(true);
    setSaveError(null);
    if ((editingSummary && summaryDraft !== session.aiSummary) || (editingNotes && notesDraft !== session.notes)) {
      try {
        await updateSessionMutation.mutateAsync({
          sessionId: session.id,
          data: {
            aiSummary: summaryDraft,
            notes: notesDraft,
          },
        });
        setEditingSummary(false);
        setEditingNotes(false);
        await refetch();
      } catch (err: any) {
        setSaveError(err.message || 'Failed to save edits');
        setIsGenerating(false);
        return;
      }
    }
    try {
      const plan = await generatePlanMutation.mutateAsync({ sessionId: session.id });
      if (!plan || typeof plan !== 'object' || !('id' in plan)) {
        setSaveError('Failed to generate action plan. Please try again.');
        setIsGenerating(false);
        return;
      }
      await refetch();
      router.push(`/practitioner/clients/${session.client?.id || ''}/plans/${plan.id}`);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to generate action plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishPlan = () => {
    setShowPublishModal(true);
  };

  const handleConfirmPublish = () => {
    if (!generatedPlan?.id) {
      toast.error('No plan to publish');
      return;
    }
    publishPlanMutation.mutate(generatedPlan.id, {
      onSuccess: () => {
        toast.success('Plan published to client!');
        setShowPublishModal(false);
        setComplianceChecked(false);
        router.push(`/practitioner/clients/${session?.client?.id}/plans/${generatedPlan.id}`);
      },
      onError: () => {
        toast.error('Failed to publish plan');
      },
    });
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

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const audioUrl = session.audioFileUrl
    ? session.audioFileUrl.startsWith('http')
      ? session.audioFileUrl
      : `${backendUrl}${session.audioFileUrl.startsWith('/') ? '' : '/'}${session.audioFileUrl}`
    : undefined;

  const duration = session.durationSeconds || (audioRef.current?.duration ?? 0);
  const formattedCurrent = formatDuration(audioProgress);
  const formattedTotal = formatDuration(duration);

  if (isGenerating) {
    return (
      <div
        className='fixed inset-0 z-[9999] flex flex-col items-center justify-center min-h-screen w-full'
        style={{
          background:
            'radial-gradient(ellipse at 20% 80%, #fbeee6 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #eaf2f8 0%, transparent 60%), #fcfcfc',
        }}
      >
        <div className='flex flex-col items-center justify-center'>
          <div className='mb-4 flex items-center justify-center'>
            <span className='inline-flex items-center justify-center rounded-full bg-[#d6d1ce] h-16 w-16'>
              <Sparkles className='h-10 w-10 text-[#8c8681]' />
            </span>
          </div>
          <div className='text-center'>
            <div className='text-lg font-medium text-gray-900'>Generating Action Plan</div>
          </div>
        </div>
      </div>
    );
  }
  if (showActionPlan && generatedPlan) {
    return (
      <div className='min-h-screen bg-background flex flex-col'>
        <div className='flex items-center justify-between px-8 pt-8 pb-4 border-b bg-background'>
          <div className='flex items-center gap-4 min-w-0'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setShowActionPlan(false)}
              className='h-8 w-8'
              aria-label='Back'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div className='flex flex-col min-w-0'>
              <h1 className='text-2xl font-bold truncate'>Action Plan</h1>
            </div>
          </div>
          <Button
            className='rounded-full px-6 py-2 font-medium bg-[#807171]  text-background hover:bg-foreground/90'
            onClick={handlePublishPlan}
            disabled={publishPlanMutation.isPending}
          >
            {publishPlanMutation.isPending ? 'Publishing...' : 'Publish Plan'}
          </Button>
        </div>
        <div className='flex-1 w-full px-4 sm:px-8 py-4 max-w-6xl mx-auto flex flex-col gap-8'>
          <PlanEditor planId={generatedPlan.id} sessionId={session.id} clientId={session.client?.id || ''} />
        </div>
        {}
        <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
          <DialogContent className='test-center-modal max-w-md w-full rounded-2xl p-8'>
            <DialogHeader>
              <DialogTitle className='text-xl font-bold mb-4 text-center'>Confirm Plan?</DialogTitle>
            </DialogHeader>
            <div className='flex flex-col items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  checked={complianceChecked}
                  onCheckedChange={(checked) => setComplianceChecked(checked === true)}
                  id='compliance-check'
                />
                <label htmlFor='compliance-check' className='text-base font-medium'>
                  Compliance check
                </label>
              </div>
              <div className='flex gap-4 mt-6 w-full justify-center'>
                <Button
                  variant='outline'
                  className='rounded-full px-6 py-2 font-medium'
                  onClick={() => setShowPublishModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className='rounded-full px-6 py-2 font-medium bg-black text-white'
                  onClick={handleConfirmPublish}
                  disabled={!complianceChecked || publishPlanMutation.isPending}
                >
                  {publishPlanMutation.isPending ? 'Publishing...' : 'Publish'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const rightActions = session?.plan ? (
    <Button
      className='rounded-full px-6 py-2 font-medium bg-[#807171] text-background hover:bg-foreground/90'
      onClick={() => router.push(`/practitioner/clients/${session.client?.id}/plans/${session.plan.id}`)}
    >
      View Action Plan
    </Button>
  ) : (
    <Button
      className='rounded-full px-6 py-2 font-medium bg-[#807171] text-background hover:bg-foreground/90'
      onClick={handleGenerateActionPlan}
    >
      Generate Action Plan
    </Button>
  );

  return (
    <div className='min-h-screen flex flex-col'>
      {!isLoading && client && (
        <ClientPageHeader
          client={client}
          title={session.title || 'Session'}
          subtitle={session.recordedAt ? new Date(session.recordedAt).toLocaleDateString() : ''}
          rightActions={rightActions}
          showAvatar={false}
          showMessagesButton={false}
        />
      )}

      <div className='flex flex-col items-center justify-center w-full px-4 mt-6 mb-2'>
        {isSupportedAudio(audioUrl) ? (
          <>
            <audio
              ref={audioRef}
              src={audioUrl}
              preload='auto'
              className='hidden'
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onError={() => setAudioError(true)}
              aria-label='Session audio playback'
            />
            <div className='flex items-center gap-4 w-full max-w-xl'>
              <span className='text-xs text-muted-foreground w-10 text-right'>{formattedCurrent}</span>
              <input
                type='range'
                min={0}
                max={duration}
                value={audioProgress}
                onChange={handleProgressBar}
                className='flex-1 accent-foreground h-1 rounded-lg bg-gray-200'
                style={{ accentColor: 'var(--foreground)' }}
                aria-label='Audio progress bar'
              />
              <span className='text-xs text-muted-foreground w-10 text-left'>{formattedTotal}</span>
            </div>
            <div className='flex items-center gap-6 mt-2'>
              <Button variant='ghost' size='icon' onClick={() => handleSkip(-10)} aria-label='Skip back 10 seconds'>
                <SkipBack className='h-6 w-6' />
              </Button>
              <Button variant='ghost' size='icon' onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause className='h-8 w-8' /> : <Play className='h-8 w-8' />}
              </Button>
              <Button variant='ghost' size='icon' onClick={() => handleSkip(10)} aria-label='Skip forward 10 seconds'>
                <SkipForward className='h-6 w-6' />
              </Button>
            </div>
            {audioError && (
              <div className='text-destructive text-xs mt-2'>
                Failed to load audio. Please check the file format or try again later.
              </div>
            )}
          </>
        ) : (
          <div className='text-muted-foreground text-xs mt-2'>Audio not available or unsupported format.</div>
        )}
      </div>

      <div className='flex-1 w-full flex mx-auto px-10 max-w-[1450px] flex-col pt-6 sm:pt-8'>
        {/* Add spacing below summary card */}
        <div className='bg-white rounded-2xl shadow-lg p-6 mb-8'>
          <div className='flex items-center justify-between mb-2'>
            <div className='font-extrabold text-2xl mb-2'>Session Summary</div>
            {!editingSummary && (
              <button onClick={() => setEditingSummary(true)} aria-label='Edit summary'>
                <Edit2 className='h-4 w-4 text-muted-foreground' />
              </button>
            )}
          </div>
          {editingSummary ? (
            <div className='flex flex-col gap-2'>
              <textarea
                className='border border-gray-300 rounded px-2 py-1 w-full min-h-[120px] text-sm'
                value={summaryDraft || ''}
                onChange={(e) => setSummaryDraft(e.target.value)}
                autoFocus
              />
              <div className='flex gap-2'>
                <Button size='sm' onClick={handleSaveEdits} disabled={isSaving}>
                  <Check className='h-4 w-4 mr-1' /> Save
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setEditingSummary(false);
                    setSummaryDraft(session.aiSummary);
                  }}
                >
                  <X className='h-4 w-4 mr-1' /> Cancel
                </Button>
              </div>
              {saveError && <div className='text-destructive text-xs'>{saveError}</div>}
            </div>
          ) : (
            <MarkdownRenderer content={session.aiSummary || ''} className='text-sm' />
          )}
        </div>
        {/* Add grid gap and responsive margin */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8'>
          {}
          <div className='bg-white rounded-2xl shadow-lg p-6 flex flex-col'>
            <div className='flex items-center justify-between mb-2'>
              <div className='font-bold text-base'>Session Notes</div>
              {!editingNotes && (
                <button onClick={() => setEditingNotes(true)} aria-label='Edit notes'>
                  <Edit2 className='h-4 w-4 text-muted-foreground' />
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className='flex flex-col gap-2'>
                <textarea
                  className='border border-gray-300 rounded px-2 py-1 w-full min-h-[120px] text-sm'
                  value={notesDraft || ''}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  autoFocus
                />
                <div className='flex gap-2'>
                  <Button size='sm' onClick={handleSaveEdits} disabled={isSaving}>
                    <Check className='h-4 w-4 mr-1' /> Save
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setEditingNotes(false);
                      setNotesDraft(session.notes);
                    }}
                  >
                    <X className='h-4 w-4 mr-1' /> Cancel
                  </Button>
                </div>
                {saveError && <div className='text-destructive text-xs'>{saveError}</div>}
              </div>
            ) : (
              <div className='text-sm leading-relaxed flex-1'>
                {session.notes ? (
                  <ul className='list-disc pl-5 space-y-2'>
                    {(session.notes as string).split(/\n\s*\n|\n- /).map((note: string, i: number) => (
                      <li key={i}>{note.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <span className='text-muted-foreground'>No notes available.</span>
                )}
              </div>
            )}
          </div>
          {}
          <div className='bg-white rounded-2xl shadow-lg p-6 flex flex-col'>
            <div className='font-bold text-base mb-2'>Transcript</div>
            <div className='text-sm leading-relaxed flex-1 overflow-y-auto'>
              {session.filteredTranscript ? (
                (() => {
                  let parsed: any = null;
                  try {
                    parsed =
                      typeof session.filteredTranscript === 'string'
                        ? JSON.parse(session.filteredTranscript)
                        : session.filteredTranscript;
                  } catch (e) {
                    parsed = null;
                  }
                  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    // Render structured transcript
                    return (
                      <div>
                        {Object.entries(parsed).map(([speaker, content]: [string, any]) => (
                          <div key={speaker} className='mb-4'>
                            <div className='font-semibold mb-1'>{speaker}</div>
                            {content['Therapeutic Content'] &&
                            content['Therapeutic Content']['Action Items'] &&
                            Array.isArray(content['Therapeutic Content']['Action Items']) ? (
                              <ul className='list-disc pl-5'>
                                {content['Therapeutic Content']['Action Items'].map((item: string, idx: number) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <pre className='bg-gray-100 rounded p-2 text-xs'>{JSON.stringify(content, null, 2)}</pre>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    // Fallback: render as Markdown
                    return <MarkdownRenderer content={session.filteredTranscript} className='text-sm' />;
                  }
                })()
              ) : (
                <span className='text-muted-foreground'>No transcript available.</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {saveError && <div className='text-destructive text-center mt-4'>{saveError}</div>}
    </div>
  );
}
