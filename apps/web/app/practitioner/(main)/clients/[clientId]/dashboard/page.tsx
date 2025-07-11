'use client';
import { TaskDetailModal } from '@/components/practitioner/TaskDetailModal';
import { AudioRecorder, AudioRecorderHandle } from '@/components/recorder/AudioRecorder';
import { AudioRecorderProvider, useAudioRecorder } from '@/context/AudioRecorderContext';
import {
  useGetClient,
  useGetSessionsByClient,
  useGetSessionForPolling,
  useCreateSession,
  useUploadSessionAudio,
  useGetPlan,
  usePublishPlan,
  useGetPlanStatus,
  useGetClientJournalEntries,
} from '@/lib/hooks/use-api';
import { ActionItem, ActionItemCompletion, Plan, Resource, Session, User } from '@repo/db';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@repo/ui/components/table';
import { Tabs, TabsContent, TabsList } from '@repo/ui/components/tabs';
import { TabTrigger } from '@/components/TabTrigger';
import { ArrowLeft, MessageCircle, Plus, Target, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'sonner';
import { PlanEditor } from '@/components/practitioner/PlanEditor';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '@repo/ui/components/dialog';

import type { Session as DBSession } from '@repo/db';

type PopulatedActionItem = ActionItem & { resources: Resource[]; completions: ActionItemCompletion[] };
type PopulatedPlan = Plan & { actionItems: PopulatedActionItem[] };
type PopulatedSession = Session & { plan: PopulatedPlan | null };

const ClientDashboardContent = ({ clientId }: { clientId: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTask, setSelectedTask] = useState<PopulatedActionItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showJournalDetail, setShowJournalDetail] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('');

  const [newSessionId, setNewSessionId] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionTranscript, setSessionTranscript] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<'idle' | 'uploading' | 'polling' | 'done' | 'error'>('idle');
  const [processingError, setProcessingError] = useState<string | null>(null);

  const audioRecorderRef = useRef<AudioRecorderHandle>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);

  // Handle editPlan parameter
  const editPlanId = searchParams.get('editPlan');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(editPlanId);

  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null);

  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState<string>('');
  const [isPublishingPlan, setIsPublishingPlan] = useState(false);

  // React Query hooks
  const { data: client, isLoading: isClientLoading } = useGetClient(clientId);
  const { data: sessions = [], isLoading: isSessionsLoading } = useGetSessionsByClient(clientId);
  const { data: processingSession } = useGetSessionForPolling(processingSessionId || '');
  const { data: editingPlan, isLoading: isEditingPlanLoading } = useGetPlan(editingPlanId || '') as {
    data: PopulatedPlan | undefined;
    isLoading: boolean;
  };
  const { data: planStatus } = useGetPlanStatus(editingPlanId || '');
  const { data: journalEntries = [] } = useGetClientJournalEntries(clientId);
  const createSessionMutation = useCreateSession();
  const uploadAudioMutation = useUploadSessionAudio();
  const publishPlanMutation = usePublishPlan();

  const isLoading = isClientLoading || isSessionsLoading;

  // Sync tab state with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['dashboard', 'sessions', 'plans', 'journal'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);

    // Update URL with shallow routing
    const newUrl = new URL(window.location.href);
    if (newTab === 'dashboard') {
      newUrl.searchParams.delete('tab');
    } else {
      newUrl.searchParams.set('tab', newTab);
    }
    router.replace(newUrl.pathname + newUrl.search);
  };

  // Update editingPlanId when searchParams changes
  useEffect(() => {
    const newEditPlanId = searchParams.get('editPlan');
    setEditingPlanId(newEditPlanId);
  }, [searchParams]);

  useEffect(() => {
    if (processingSession && processingSession.status === 'REVIEW_READY') {
      setShowProcessingModal(false);
      router.push(`/practitioner/sessions/${processingSessionId}`);
    }
  }, [processingSession, processingSessionId, router]);

  const { stats, allTasks } = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { stats: { completion: 0, pending: 0 }, allTasks: [] };
    }

    const tasks = sessions.flatMap((s) => s.plan?.actionItems || []);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completions && t.completions.length > 0).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      stats: {
        completion: completionPercentage,
        pending: pendingTasks,
      },
      allTasks: tasks,
    };
  }, [sessions]);

  const handleSaveAndTranscribe = async () => {
    if (!sessionTitle) {
      toast.error('Session title is required.');
      return;
    }
    toast.info('Saving session...');
    try {
      // 1. Create the session metadata
      const newSession = await createSessionMutation.mutateAsync({
        clientId: clientId,
        title: sessionTitle,
        notes: sessionNotes,
      });
      setNewSessionId(newSession.id);
      toast.success('Session saved and sent for transcription!');
      setSessionTitle('');
      setSessionNotes('');
    } catch (error: any) {
      console.error('Failed to save session', error);
      setErrorMessage('Failed to create session. Please check your internet connection and try again.');
      setShowErrorModal(true);
    }
  };

  const handleTaskClick = (task: PopulatedActionItem) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleViewProfile = () => {
    router.push(`/practitioner/clients/${clientId}/profile`);
  };

  const handleNewSession = () => {
    handleTabChange('sessions');
    setShowNewSession(true);
    // Reset form state
    setSessionTitle('');
    setSessionNotes('');
    setShowErrorModal(false);
    setErrorMessage('');
    setProcessingStep('uploading');
  };

  const handlePlanClick = (plan: any) => {
    setSelectedPlan(plan);
    setShowActionPlan(true);
  };

  const handleJournalClick = (journal: any) => {
    setSelectedJournal(journal);
    setShowJournalDetail(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRequestEndSession = (audioBlob: Blob, duration: string) => {
    setPendingAudioBlob(audioBlob);
    setPendingDuration(duration);
    setShowEndSessionModal(true);
  };

  const handleEndSession = async (audioBlob: Blob, duration: string) => {
    setSessionDuration(duration);
    setProcessingStep('uploading');
    setProcessingError(null);
    setSessionTranscript(null);
    try {
      // 1. Create the session
      const newSession = await createSessionMutation.mutateAsync({
        clientId: clientId,
        title: sessionTitle,
        notes: sessionNotes,
      });
      setNewSessionId(newSession.id);
      // 2. Upload the audio
      const formData = new FormData();
      formData.append('audio', audioBlob, `session_${newSession.id}.webm`);
      // Parse duration (e.g., '56:27') to seconds
      let durationSeconds = undefined;
      const match = duration.match(/(\d+):(\d+)/);
      if (match && match[1] && match[2]) {
        durationSeconds = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
      if (typeof durationSeconds === 'number' && !isNaN(durationSeconds) && durationSeconds > 0) {
        formData.append('durationSeconds', String(durationSeconds));
      }
      setProcessingStep('uploading');
      await uploadAudioMutation.mutateAsync({ sessionId: newSession.id, formData });
      setProcessingSessionId(newSession.id);
      setShowProcessingModal(true);
    } catch (err: any) {
      setProcessingStep('error');
      setProcessingError(err.message || 'Failed to upload audio or create session');
      toast.error(err.message || 'Failed to upload audio or create session');
    }
  };

  const handleConfirmEndSession = () => {
    setShowEndSessionModal(false);
    if (pendingAudioBlob && pendingDuration) {
      handleEndSession(pendingAudioBlob, pendingDuration);
      setPendingAudioBlob(null);
      setPendingDuration('');
    }
  };

  // Intercept navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (audioRecorderRef.current && ['paused', 'recording'].includes(audioRecorderRef.current.getStatus())) {
        e.preventDefault();
        e.returnValue = '';
        setShowUnsavedModal(true);
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleBack = () => {
    if (audioRecorderRef.current && ['paused', 'recording'].includes(audioRecorderRef.current.getStatus())) {
      setShowUnsavedModal(true);
      setPendingNavigation(() => () => router.back());
    } else {
      router.back();
    }
  };

  const handleSaveUnsaved = () => {
    setShowUnsavedModal(false);
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
    }
    // Navigation will proceed after save completes in handleEndSession
  };

  const handleDiscardUnsaved = () => {
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleClosePlanEditor = () => {
    setEditingPlanId(null);
    // Remove the editPlan parameter from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('editPlan');
    router.replace(newUrl.pathname + newUrl.search);
  };

  const handlePublishPlan = () => {
    if (!editingPlanId) return;

    setIsPublishingPlan(true);
    publishPlanMutation.mutate(editingPlanId, {
      onSuccess: () => {
        toast.success('Plan published to client!');
        setIsPublishingPlan(false);
        // Navigate to the plan view
        router.push(`/practitioner/clients/${clientId}/plans/${editingPlanId}`);
      },
      onError: () => {
        toast.error('Failed to publish plan');
        setIsPublishingPlan(false);
      },
    });
  };

  // --- Plans Tab Table State ---
  const [planSearch, setPlanSearch] = useState('');

  // Helper to get plans from sessions
  const plans = useMemo(() => {
    return sessions
      .filter((s) => s.plan)
      .map((s) => ({
        sessionId: s.id,
        sessionTitle: s.title,
        recordedAt: s.recordedAt,
        plan: s.plan as PopulatedPlan,
      }));
  }, [sessions]);

  // Filter plans by search
  const filteredPlans = useMemo(() => {
    if (!planSearch.trim()) return plans;
    return plans.filter((p) => (p.sessionTitle || '').toLowerCase().includes(planSearch.trim().toLowerCase()));
  }, [plans, planSearch]);

  // Dummy feedback calculation (replace with real logic if available)
  function getAvgFeedback(plan: PopulatedPlan) {
    // TODO: Replace with real feedback logic
    // For now, cycle through options for demo
    const idx = plans.findIndex((p) => p.plan && p.plan.id === plan.id);
    const options = ['Nil', 'Happy', 'Neutral', 'Sad'];
    return options[idx % options.length];
  }

  // --- Feedback and Journal Badge Helpers ---
  const feedbackBadge = (feedback: string) => {
    let badgeClass = 'bg-gray-200 text-gray-700';
    let emoji = '';
    if (feedback === 'Happy') {
      badgeClass = 'bg-green-100 text-green-800';
      emoji = '😊';
    } else if (feedback === 'Neutral') {
      badgeClass = 'bg-yellow-100 text-yellow-800';
      emoji = '😐';
    } else if (feedback === 'Sad') {
      badgeClass = 'bg-red-100 text-red-800';
      emoji = '🙁';
    } else if (feedback === 'Nil') {
      badgeClass = 'bg-gray-200 text-gray-700';
      emoji = '';
    }
    return (
      <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ${badgeClass}`}>
        {emoji && <span className='mr-1'>{emoji}</span>}
        {feedback}
      </span>
    );
  };

  const journalBadge = (journal: string) => {
    if (journal === 'Yes') {
      return (
        <span className='inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800'>
          Yes
        </span>
      );
    }
    return (
      <span className='inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600'>
        No
      </span>
    );
  };

  // --- Plans Tab Table ---
  const renderPlansTab = () => (
    <TabsContent value='plans' className='mt-0'>
      <div className='flex flex-col gap-6'>
        <div className='flex justify-between items-center mb-2'>
          <h2 className='text-lg sm:text-xl font-semibold'>Plans</h2>
          <input
            type='text'
            placeholder='Search Plan'
            value={planSearch}
            onChange={(e) => setPlanSearch(e.target.value)}
            className='border rounded-full px-4 py-2 w-60 text-sm outline-none focus:ring-2 focus:ring-black/10'
            style={{ minWidth: 180 }}
          />
        </div>
        <div className='overflow-x-auto'>
          <div className='bg-white rounded-2xl shadow-md p-0'>
            <Table className='min-w-full bg-white rounded-2xl overflow-hidden'>
              <TableHeader>
                <TableRow className='bg-white'>
                  <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Date
                  </TableHead>
                  <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Session Title
                  </TableHead>
                  <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Tasks
                  </TableHead>
                  <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Avg Task Feedback
                  </TableHead>
                  <TableHead className='px-7 py-4 text-center text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center text-gray-400 py-8'>
                      No plans found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map(({ sessionId, sessionTitle, recordedAt, plan }) => {
                    if (!plan) return null;
                    const completed = plan.actionItems.filter((t) => t.completions && t.completions.length > 0).length;
                    const total = plan.actionItems.length;
                    const avgFeedback = getAvgFeedback(plan);
                    // Badge color and icon logic
                    let badgeClass = 'bg-gray-200 text-gray-700';
                    let badgeIcon = null;
                    if (avgFeedback === 'Happy') {
                      badgeClass = 'bg-green-100 text-green-800';
                      badgeIcon = <span className='mr-1'>😊</span>;
                    } else if (avgFeedback === 'Neutral') {
                      badgeClass = 'bg-yellow-100 text-yellow-800';
                      badgeIcon = <span className='mr-1'>😐</span>;
                    } else if (avgFeedback === 'Sad') {
                      badgeClass = 'bg-red-100 text-red-800';
                      badgeIcon = <span className='mr-1'>🙁</span>;
                    } else if (avgFeedback === 'Nil') {
                      badgeClass = 'bg-gray-200 text-gray-700';
                      badgeIcon = null;
                    }
                    return (
                      <TableRow
                        key={plan.id}
                        className='hover:bg-gray-50 transition-colors border-b last:border-b-0 border-[#ececec]'
                      >
                        <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>
                          {recordedAt
                            ? new Date(recordedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit',
                              })
                            : '--'}
                        </TableCell>
                        <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>
                          {sessionTitle || 'Untitled Session'}
                        </TableCell>
                        <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>{total}</TableCell>
                        <TableCell className='px-7 py-5 whitespace-nowrap'>
                          <span
                            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ${badgeClass}`}
                          >
                            {badgeIcon}
                            {avgFeedback}
                          </span>
                        </TableCell>
                        <TableCell className='px-7 py-5 whitespace-nowrap text-center'>
                          <button
                            className='inline-flex items-center justify-center rounded-full p-2 hover:bg-gray-100 transition-colors mr-2 border border-transparent focus:outline-none focus:ring-2 focus:ring-gray-200'
                            title='View Plan'
                            onClick={() => router.push(`/practitioner/clients/${clientId}/plans/${plan.id}`)}
                          >
                            <svg
                              width='18'
                              height='18'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <circle cx='12' cy='12' r='10' />
                              <circle cx='12' cy='12' r='4' />
                            </svg>
                          </button>
                          <button
                            className='inline-flex items-center justify-center rounded-full p-2 hover:bg-gray-100 transition-colors border border-transparent focus:outline-none focus:ring-2 focus:ring-gray-200'
                            title='Edit Plan'
                            onClick={() =>
                              router.replace(`/practitioner/clients/${clientId}/dashboard?editPlan=${plan.id}`)
                            }
                          >
                            <svg
                              width='18'
                              height='18'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <path d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6v-2H5v-2H3v4z' />
                            </svg>
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </TabsContent>
  );

  const renderDashboardTab = () => (
    <TabsContent value='dashboard' className='mt-0'>
      <div className='flex flex-col gap-4 w-full mb-6 sm:mb-8'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between w-full gap-3 md:gap-0'>
          <h2 className='text-lg sm:text-xl font-semibold mb-0'>Tasks Overview</h2>
        </div>
        <div className='flex flex-col sm:flex-row gap-4 w-full'>
          <Card className='flex-1 min-w-[180px] border border-border rounded-2xl shadow-none bg-background'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm sm:text-base font-semibold'>Avg Tasks Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl sm:text-3xl font-extrabold'>{stats.completion}%</div>
            </CardContent>
          </Card>
          <Card className='flex-1 min-w-[180px] border border-border rounded-2xl shadow-none bg-background'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm sm:text-base font-semibold'>Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl sm:text-3xl font-extrabold'>3</div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Daily Stats Table */}
      <div className='mt-8'>
        <div className='bg-white rounded-2xl shadow-md p-0 border border-[#ececec]'>
          <Table className='min-w-full bg-white rounded-2xl overflow-hidden'>
            <TableHeader>
              <TableRow className='bg-white'>
                <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Date
                </TableHead>
                <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Tasks
                </TableHead>
                <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  All Mandatory Tasks
                </TableHead>
                <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Avg Task Feedback
                </TableHead>
                <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Journal Entry
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Mock data for now */}
              {[
                { date: '2025-06-16', tasks: '0/7', mandatory: 'Not Done', feedback: 'Nil', journal: 'No' },
                { date: '2025-06-15', tasks: '4/6', mandatory: 'Done', feedback: 'Happy', journal: 'No' },
                { date: '2025-06-14', tasks: '5/5', mandatory: 'Done', feedback: 'Neutral', journal: 'Yes' },
                { date: '2025-06-13', tasks: '3/5', mandatory: 'Not Done', feedback: 'Sad', journal: 'Yes' },
              ].map((row) => (
                <TableRow
                  key={row.date}
                  className='cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0 border-[#ececec]'
                  onClick={() => router.push(`/practitioner/clients/${clientId}/tasks/${row.date}`)}
                >
                  <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>
                    {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>{row.tasks}</TableCell>
                  <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>{row.mandatory}</TableCell>
                  <TableCell className='px-7 py-5 whitespace-nowrap'>{feedbackBadge(row.feedback)}</TableCell>
                  <TableCell className='px-7 py-5 whitespace-nowrap'>{journalBadge(row.journal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TabsContent>
  );

  const renderSessionsTab = () => (
    <TabsContent value='sessions' className='mt-0'>
      <div className='flex flex-col gap-6'>
        <div className='flex justify-between items-center mb-2'>
          <h2 className='text-lg sm:text-xl font-semibold'>Past Sessions</h2>
          <Button
            onClick={handleNewSession}
            className='bg-foreground text-background hover:bg-foreground/90 rounded-full px-4 sm:px-6 py-2 text-sm sm:text-base'
          >
            + New Session
          </Button>
        </div>
        <div className='overflow-x-auto'>
          <div className='bg-white rounded-2xl shadow-md p-0 min-w-[400px] sm:min-w-0'>
            <Table className='min-w-[600px] sm:min-w-full bg-white rounded-2xl overflow-hidden'>
              <TableHeader>
                <TableRow className='bg-white'>
                  <TableHead className='px-3 sm:px-7 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Session Title
                  </TableHead>
                  <TableHead className='px-3 sm:px-7 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Date
                  </TableHead>
                  <TableHead className='px-3 sm:px-7 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Duration
                  </TableHead>
                  <TableHead className='px-3 sm:px-7 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Summary
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center text-muted-foreground py-8'>
                      <Skeleton className='h-8 w-full' />
                    </TableCell>
                  </TableRow>
                ) : sessions.length > 0 ? (
                  sessions.map((session) => {
                    let duration = '—';
                    if (
                      typeof session.durationSeconds === 'number' &&
                      !isNaN(session.durationSeconds) &&
                      session.durationSeconds > 0
                    ) {
                      const mins = Math.floor(session.durationSeconds / 60);
                      const secs = session.durationSeconds % 60;
                      duration = `${mins}m ${secs.toString().padStart(2, '0')}s`;
                    }
                    const summary = session.summaryTitle || session.title || 'No summary available.';
                    return (
                      <TableRow
                        key={session.id}
                        className='cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0 border-[#ececec]'
                        onClick={() => router.push(`/practitioner/sessions/${session.id}`)}
                      >
                        <TableCell className='px-3 sm:px-7 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900'>
                          {session.title || 'Untitled Session'}
                        </TableCell>
                        <TableCell className='px-3 sm:px-7 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900'>
                          {new Date(session.recordedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className='px-3 sm:px-7 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900'>
                          {duration}
                        </TableCell>
                        <TableCell className='px-3 sm:px-7 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900'>
                          {summary}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center text-muted-foreground'>
                      No sessions recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </TabsContent>
  );

  const renderJournalTab = () => (
    <TabsContent value='journal' className='mt-0'>
      {journalEntries.length === 0 ? (
        <div className='text-center text-muted-foreground py-8'>No journal entries found for this client.</div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0'>
          {journalEntries.map((entry) => (
            <Card
              key={entry.id}
              className='flex flex-col p-0 overflow-hidden h-48 sm:h-56 min-w-0 w-96 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50 hover:shadow-xl transition-shadow'
            >
              <div className='flex-1 p-4 overflow-hidden'>
                <div className='font-semibold text-sm leading-tight text-gray-800 mb-2'>
                  {entry.title || 'Untitled Entry'}
                </div>
                <div className='text-xs text-gray-500 mb-2'>
                  {new Date(entry.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className='text-sm text-gray-600 line-clamp-3'>
                  {/* Remove HTML tags for preview */}
                  {entry.content.replace(/<[^>]*>/g, '').length > 100
                    ? entry.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
                    : entry.content.replace(/<[^>]*>/g, '')}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </TabsContent>
  );

  const renderContent = () => {
    console.log('[Dashboard] render', { showNewSession, activeTab, isLoading, editingPlanId, editingPlan });

    // Show PlanEditor if editing a plan
    if (editingPlanId) {
      if (isEditingPlanLoading) {
        return (
          <div className='min-h-screen bg-transparent flex flex-col'>
            <div className='w-full max-w-[1350px] mx-auto px-2 sm:px-6 md:px-10'>
              <div className='flex flex-col gap-0 border-b pt-1 sm:pt-2 pb-3 sm:pb-4'>
                <div className='flex items-center'>
                  <button
                    type='button'
                    aria-label='Back'
                    onClick={handleClosePlanEditor}
                    className='text-muted-foreground hover:text-foreground focus:outline-none'
                    style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
                  </button>
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2'>
                  <div>
                    <h1 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'>Edit Action Plan</h1>
                  </div>
                  {planStatus === 'DRAFT' &&
                    editingPlan &&
                    (editingPlan as any).actionItems &&
                    (editingPlan as any).actionItems.length > 0 && (
                      <Button
                        onClick={handlePublishPlan}
                        disabled={isPublishingPlan || publishPlanMutation.isPending}
                        className='bg-black text-white rounded-full px-6 py-2 text-base font-semibold shadow-md hover:bg-neutral-800 transition-all'
                      >
                        {isPublishingPlan || publishPlanMutation.isPending ? 'Publishing...' : 'Publish Plan'}
                      </Button>
                    )}
                </div>
              </div>
              <div className='flex items-center justify-center py-8'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
                  <p className='mt-2 text-sm text-muted-foreground'>Loading plan editor...</p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className='min-h-screen bg-transparent flex flex-col'>
          <div className='w-full   mx-auto px-2 sm:px-6 md:px-10'>
            <div className='flex flex-col gap-0 border-b pt-1 mb-10 sm:pt-2 pb-3 sm:pb-4'>
              <div className='flex items-center'>
                <button
                  type='button'
                  aria-label='Back'
                  onClick={handleClosePlanEditor}
                  className='text-muted-foreground hover:text-foreground focus:outline-none'
                  style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
                </button>
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2'>
                <div>
                  <h1 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'>Edit Action Plan</h1>
                </div>
                {planStatus === 'DRAFT' &&
                  editingPlan &&
                  (editingPlan as any).actionItems &&
                  (editingPlan as any).actionItems.length > 0 && (
                    <Button
                      onClick={handlePublishPlan}
                      disabled={isPublishingPlan || publishPlanMutation.isPending}
                      className='bg-black text-white rounded-full px-6 py-2 text-base font-semibold shadow-md hover:bg-neutral-800 transition-all'
                    >
                      {isPublishingPlan || publishPlanMutation.isPending ? 'Publishing...' : 'Publish Plan'}
                    </Button>
                  )}
              </div>
            </div>
            <PlanEditor
              planId={editingPlanId}
              sessionId={editingPlan?.sessionId || ''}
              clientId={clientId}
              onPublishClick={handlePublishPlan}
              isPublishing={isPublishingPlan || publishPlanMutation.isPending}
            />
          </div>
        </div>
      );
    }

    if (showNewSession) {
      return (
        <div className='min-h-screen flex flex-col'>
          <div className='px-2 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b'>
            <button
              type='button'
              aria-label='Back'
              onClick={handleBack}
              className='text-muted-foreground hover:text-foreground focus:outline-none'
              style={{ width: 44, height: 44, display: 'flex' }}
            >
              <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
            </button>
            <h2 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight mt-2'>New Session</h2>
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
                  onRequestEndSession={handleRequestEndSession}
                  clientId={clientId}
                  sessionTitle={sessionTitle}
                  sessionNotes={sessionNotes}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
    }

    return (
      <>
        <div className='flex flex-col min-h-screen'>
          <div className='flex flex-col gap-0 border-b px-2  pt-6 sm:pt- pb-3 sm:pb-4'>
            <div className='w-full flex items-center'>
              <button
                type='button'
                aria-label='Back'
                onClick={handleBack}
                className='text-muted-foreground hover:text-foreground focus:outline-none'
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
              </button>
            </div>
            <div className='flex justify-between items-start sm:items-center gap-2 px-2 sm:px-0 mt-2'>
              {isLoading ? (
                <div>
                  <Skeleton className='h-8 w-48' />
                  <Skeleton className='h-4 w-32 mt-2' />
                </div>
              ) : client ? (
                <div>
                  <h1 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'>
                    {client.firstName} {client.lastName}
                  </h1>
                  <p className='text-xs sm:text-sm text-muted-foreground'>
                    Client since {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'>Client Not Found</h1>
                </div>
              )}

              <div className='flex items-center gap-2 sm:gap-3'>
                <Link href={`/practitioner/clients/${clientId}/messages`}>
                  <Button variant='outline' className='rounded-full p-2 border border-border'>
                    <MessageCircle className='h-4 w-4' />
                  </Button>
                </Link>
                <Button
                  variant='outline'
                  className='rounded-full px-4 sm:px-6 py-2 text-sm font-medium border border-border'
                  onClick={handleViewProfile}
                >
                  View Profile
                </Button>
              </div>
            </div>
          </div>

          <div className='flex-1 w-full flex py-4 sm:py-8'>
            <div className='w-full px-4 sm:px-8 lg:px-16 flex flex-col gap-6 sm:gap-8'>
              <div className='w-full'>
                <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
                  <TabsList className='flex gap-1 bg-transparent p-0 justify-start w-full sm:w-fit mb-6 overflow-x-auto'>
                    <TabTrigger value='dashboard'>Dashboard</TabTrigger>
                    <TabTrigger value='sessions'>Sessions</TabTrigger>
                    <TabTrigger value='plans'>Plans</TabTrigger>
                    <TabTrigger value='journal'>Journal</TabTrigger>
                  </TabsList>

                  {renderDashboardTab()}
                  {renderSessionsTab()}
                  {renderPlansTab()}
                  {renderJournalTab()}
                </Tabs>
              </div>
            </div>
          </div>
        </div>
        {selectedTask && (
          <TaskDetailModal
            open={isTaskModalOpen}
            onOpenChange={setIsTaskModalOpen}
            task={{
              title: selectedTask.description,
              target: selectedTask.target ?? 'N/A',
              frequency: selectedTask.frequency ?? 'N/A',
              feedback: 'N/A',
              achieved: selectedTask.completions.length > 0 ? 'Completed' : 'Pending',
              toolsToHelp: selectedTask.resources.map((r) => ({
                title: r.title || r.url,
                type: r.type === 'LINK' ? 'hyperlink' : 'PDF Doc',
                url: r.url,
              })),
            }}
          />
        )}
        {showUnsavedModal && (
          <Dialog open={showUnsavedModal} onOpenChange={setShowUnsavedModal}>
            <DialogOverlay className='backdrop-blur-[6px] bg-black/5' />
            <DialogContent showCloseButton className='max-w-md w-full max-h-[90vh] p-6'>
              <DialogHeader>
                <DialogTitle>Unsaved Recording</DialogTitle>
                <DialogDescription>
                  You have an unsaved recording. Would you like to save or discard it?
                </DialogDescription>
              </DialogHeader>
              <div className='mb-4'>You have an unsaved recording. Would you like to save or discard it?</div>
              <div className='flex gap-4 justify-end'>
                <Button variant='outline' onClick={handleDiscardUnsaved}>
                  Discard
                </Button>
                <Button className='bg-black text-white' onClick={handleSaveUnsaved}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {showEndSessionModal && (
          <Dialog open={showEndSessionModal} onOpenChange={setShowEndSessionModal}>
            <DialogOverlay className='backdrop-blur-[6px] bg-black/5' />
            <DialogContent
              showCloseButton={false}
              className='max-w-sm w-full max-h-[90vh] p-8 flex flex-col items-center text-center'
            >
              <DialogHeader>
                <DialogTitle className='text-xl font-semibold mb-2'>End Session?</DialogTitle>
                <DialogDescription className='mb-6 text-base'>
                  Are you sure you want to stop and end this session?
                </DialogDescription>
              </DialogHeader>
              <div className='flex gap-4 w-full justify-center mt-2'>
                <Button variant='outline' className='flex-1 py-2' onClick={() => setShowEndSessionModal(false)}>
                  Cancel
                </Button>
                <Button className='flex-1 py-2 bg-black text-white' onClick={handleConfirmEndSession}>
                  Stop
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {showProcessingModal && (
          <Dialog open={showProcessingModal}>
            <DialogOverlay className='backdrop-blur-[6px] bg-black/5' />
            <DialogContent
              showCloseButton={false}
              className='max-w-sm w-full max-h-[90vh] p-8 flex flex-col items-center text-center'
            >
              <DialogHeader>
                <DialogTitle className='text-xl font-semibold mb-2'>Session Ended</DialogTitle>
              </DialogHeader>
              <div className='text-4xl font-mono font-bold my-4'>
                {(() => {
                  // Convert sessionDuration (e.g. '56:27') to '56m 27s'
                  const match = sessionDuration.match(/(\d+):(\d+)/);
                  if (match && match[1] && match[2]) {
                    return `${parseInt(match[1], 10)}m ${match[2]}s`;
                  }
                  return sessionDuration;
                })()}
              </div>
              <div className='text-muted-foreground mb-2'>Processing Audio & Transcript...</div>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  };

  return <>{renderContent()}</>;
};

export default function ClientDashboardPage({ params }: { params: Promise<{ clientId: string }> }) {
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

  console.log('[DashboardPage] render', { clientId });

  if (!clientId) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  return (
    <AudioRecorderProvider>
      <ClientDashboardContent clientId={clientId} />
    </AudioRecorderProvider>
  );
}
