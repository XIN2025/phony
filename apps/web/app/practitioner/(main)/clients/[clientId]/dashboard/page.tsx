'use client';
import { JournalDetailModal } from '@/components/practitioner/JournalDetailModal';
import { ComprehensiveSummaryModal } from '@/components/practitioner/ComprehensiveSummaryModal';
import { PlanEditor } from '@/components/practitioner/PlanEditor';
import { TaskDetailModal } from '@/components/practitioner/TaskDetailModal';
import { AudioRecorder, AudioRecorderHandle } from '@/components/recorder/AudioRecorder';
import { TabTrigger } from '@/components/TabTrigger';
import { AudioRecorderProvider } from '@/context/AudioRecorderContext';
import {
  useCreateSession,
  useGetClient,
  useGetClientActionItemsInRange,
  useGetClientJournalEntries,
  useGetPlan,
  useGetPlanStatus,
  useGetSessionForPolling,
  useGetSessionsByClient,
  usePublishPlan,
  useUploadSessionAudio,
  useGenerateComprehensiveSummary,
} from '@/lib/hooks/use-api';
import { ActionItem, ActionItemCompletion, Plan, Resource, Session } from '@repo/db';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Tabs, TabsContent, TabsList } from '@repo/ui/components/tabs';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from '@repo/ui/components/dialog';

import { isSameDay } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { DateRange } from 'react-date-range';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

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
  const [selectedPlan, setSelectedPlan] = useState<PopulatedPlan | null>(null);
  const [showJournalDetail, setShowJournalDetail] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<{
    id: string;
    title?: string;
    content: string;
    createdAt: Date;
  } | null>(null);
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

  const editPlanId = searchParams.get('editPlan');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(editPlanId);

  const [processingSessionId, setProcessingSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('processingSessionId');
    }
    return null;
  });

  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null);
  const [pendingDuration, setPendingDuration] = useState<string>('');
  const [isPublishingPlan, setIsPublishingPlan] = useState(false);
  const [showComprehensiveSummary, setShowComprehensiveSummary] = useState(false);
  const [comprehensiveSummary, setComprehensiveSummary] = useState<any>(null);
  const [isSummaryCached, setIsSummaryCached] = useState(false);
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
  const generateComprehensiveSummaryMutation = useGenerateComprehensiveSummary();
  const queryClient = useQueryClient();

  const isLoading = isClientLoading || isSessionsLoading;
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['dashboard', 'sessions', 'plans', 'journal'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);

    const newUrl = new URL(window.location.href);
    if (newTab === 'dashboard') {
      newUrl.searchParams.delete('tab');
    } else {
      newUrl.searchParams.set('tab', newTab);
    }
    router.replace(newUrl.pathname + newUrl.search);
  };

  useEffect(() => {
    const newEditPlanId = searchParams.get('editPlan');
    setEditingPlanId(newEditPlanId);
  }, [searchParams]);

  useEffect(() => {
    if (editingPlanId) {
      setShowDatePicker(false);
    }
  }, [editingPlanId]);

  useEffect(() => {
    if (processingSession && processingSession.status === 'REVIEW_READY') {
      setShowProcessingModal(false);
      setIsRedirecting(true);
      setTimeout(() => {
        router.push(`/practitioner/sessions/${processingSessionId}`);
      }, 300); // slight delay for UX smoothness
    }
  }, [processingSession, processingSessionId, router]);

  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 6);
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
    key: string;
  }>({
    startDate: lastWeek,
    endDate: today,
    key: 'selection',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMounted, setDatePickerMounted] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    setDatePickerMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (showDatePicker && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      const pickerHeight = 380;
      const pickerWidth = 350;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      let top = rect.bottom + window.scrollY;
      if (spaceBelow < pickerHeight && spaceAbove > pickerHeight) {
        top = rect.top + window.scrollY - pickerHeight;
      }
      let left = rect.left + window.scrollX;
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 8;
      }
      setPickerPosition({ top, left, width: rect.width });
    }
  }, [showDatePicker]);

  useEffect(() => {
    if (!showDatePicker) return;
    const handleClick = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node) &&
        dateButtonRef.current &&
        !dateButtonRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowDatePicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showDatePicker]);

  const {
    data: rangedActionItems = [],
    isLoading: isActionItemsLoading,
    error: actionItemsError,
  } = useGetClientActionItemsInRange(
    clientId,
    dateRange.startDate.toISOString().split('T')[0] || '',
    dateRange.endDate.toISOString().split('T')[0] || '',
  );

  const filteredTasks = rangedActionItems;

  const [planSearch, setPlanSearch] = useState('');

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

  const filteredPlans = useMemo(() => {
    if (!planSearch.trim()) return plans;
    return plans.filter((p) => (p.sessionTitle || '').toLowerCase().includes(planSearch.trim().toLowerCase()));
  }, [plans, planSearch]);

  const filteredJournals = useMemo(() => {
    const { startDate, endDate } = dateRange;
    return (journalEntries || []).filter((j) => {
      const d = new Date(j.createdAt);
      return d >= startDate && d <= endDate;
    });
  }, [journalEntries, dateRange]);

  const completion = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    const completed = filteredTasks.filter((t) => t.completions && t.completions.length > 0).length;
    return Math.round((completed / filteredTasks.length) * 100);
  }, [filteredTasks]);

  const handleSaveAndTranscribe = async () => {
    if (!sessionTitle) {
      toast.error('Session title is required.');
      return;
    }
    toast.info('Saving session...');
    try {
      const newSession = await createSessionMutation.mutateAsync({
        clientId: clientId,
        title: sessionTitle,
        notes: sessionNotes,
      });
      setNewSessionId(newSession.id);
      toast.success('Session saved and sent for transcription!');
      setSessionTitle('');
      setSessionNotes('');
    } catch (error) {
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

    setSessionTitle('');
    setSessionNotes('');
    setShowErrorModal(false);
    setErrorMessage('');
    setProcessingStep('uploading');
  };

  const handlePlanClick = (plan: PopulatedPlan) => {
    setSelectedPlan(plan);
    setShowActionPlan(true);
  };

  const handleJournalClick = (journal: { id: string; title?: string; content: string; createdAt: Date }) => {
    setSelectedJournal(journal);
    setShowJournalDetail(true);
  };

  const handleGenerateComprehensiveSummary = async () => {
    try {
      setShowComprehensiveSummary(true);
      setIsSummaryCached(false);
      const summary = await generateComprehensiveSummaryMutation.mutateAsync(clientId);
      setComprehensiveSummary(summary);
      setIsSummaryCached(summary.isCached || false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate comprehensive summary');
      setShowComprehensiveSummary(false);
    }
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
      const newSession = await createSessionMutation.mutateAsync({
        clientId: clientId,
        title: sessionTitle,
        notes: sessionNotes,
      });
      setNewSessionId(newSession.id);

      const formData = new FormData();
      formData.append('audio', audioBlob, `session_${newSession.id}.webm`);

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
    } catch (err) {
      setProcessingStep('error');
      setProcessingError(err instanceof Error ? err.message : 'Failed to upload audio or create session');
      toast.error(err instanceof Error ? err.message : 'Failed to upload audio or create session');
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
    if (showDatePicker) {
      setShowDatePicker(false);
      return;
    }

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

        queryClient.invalidateQueries({ queryKey: ['plans'] });
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        queryClient.invalidateQueries({ queryKey: ['plan', editingPlanId] });
        queryClient.invalidateQueries({ queryKey: ['client', clientId] });
        queryClient.invalidateQueries();
        router.push(`/practitioner/clients/${clientId}/plans/${editingPlanId}`);
      },
      onError: () => {
        toast.error('Failed to publish plan');
        setIsPublishingPlan(false);
      },
    });
  };

  function getAvgFeedback(plan: PopulatedPlan) {
    const allCompletions = plan.actionItems.flatMap((item) => item.completions || []);

    if (allCompletions.length === 0) return 'Nil';

    const completionsWithRating = allCompletions.filter((c) => typeof c.rating === 'number');
    if (completionsWithRating.length === 0) return 'Nil';

    const totalRating = completionsWithRating.reduce((sum, c) => sum + (c.rating ?? 0), 0);
    const avgRating = totalRating / completionsWithRating.length;

    if (avgRating >= 4) return 'Happy';
    if (avgRating >= 2.5) return 'Neutral';
    return 'Sad';
  }

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

  const renderPlansTab = () => (
    <TabsContent value='plans' className='mt-0'>
      <div className='flex flex-col gap-6'>
        <div className='flex justify-between items-center mb-2'>
          <h2 className='text-lg sm:text-xl font-semibold' style={{ fontFamily: "'Playfair Display', serif" }}>
            Plans
          </h2>
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
                  <TableHead className='px-0 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                    Avg Task Feedback
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center text-gray-400 py-8'>
                      No plans found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map(({ sessionId, sessionTitle, recordedAt, plan }) => {
                    if (!plan) return null;
                    const completed = plan.actionItems.filter((t) => t.completions && t.completions.length > 0).length;
                    const total = plan.actionItems.length;
                    const avgFeedback = getAvgFeedback(plan);

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
                        className='hover:bg-gray-50 transition-colors border-b last:border-b-0 border-[#ececec] cursor-pointer'
                        onClick={() => router.push(`/practitioner/clients/${clientId}/plans/${plan.id}`)}
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
                        <TableCell className='px-4 py-5 whitespace-nowrap'>
                          <span
                            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ${badgeClass}`}
                          >
                            {badgeIcon}
                            {avgFeedback}
                          </span>
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
          <h2 className='text-lg sm:text-xl font-semibold mb-0' style={{ fontFamily: "'Playfair Display', serif" }}>
            Summary
          </h2>
          <div className='flex items-center gap-2'>
            <button
              ref={dateButtonRef}
              className='rounded-full border border-gray-300 px-4 py-2 text-sm bg-white shadow hover:bg-gray-50 transition'
              onClick={() => setShowDatePicker((v) => !v)}
              type='button'
            >
              {dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} –{' '}
              {dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
            {datePickerMounted &&
              showDatePicker &&
              createPortal(
                <div
                  ref={datePickerRef}
                  className='absolute z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-full max-h-[90vh] w-[350px] sm:w-auto overflow-auto flex flex-col items-center animate-fadeIn'
                  style={{
                    top: pickerPosition.top,
                    left: pickerPosition.left,
                    position: 'absolute',
                    minWidth: pickerPosition.width,
                  }}
                  role='dialog'
                  aria-modal='true'
                >
                  <DateRange
                    editableDateInputs={true}
                    onChange={(ranges) => {
                      const selection = ranges.selection;
                      if (selection) {
                        setDateRange({
                          startDate: selection.startDate || dateRange.startDate,
                          endDate: selection.endDate || selection.startDate || dateRange.endDate,
                          key: 'selection',
                        });
                      }
                    }}
                    moveRangeOnFirstSelection={false}
                    ranges={[dateRange]}
                    maxDate={new Date()}
                    rangeColors={['#2563eb']}
                  />
                </div>,
                document.body,
              )}
          </div>
        </div>
        <div className='flex flex-col sm:flex-row gap-4 w-full'>
          <Card className='flex-1 min-w-[180px] border border-border rounded-2xl shadow-none bg-background gap-0'>
            <CardHeader className=''>
              <CardTitle className='text-sm sm:text-base font-semibold'>Avg Daily Tasks Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl sm:text-3xl font-extrabold' style={{ fontFamily: "'Playfair Display', serif" }}>
                {completion}%
              </div>
            </CardContent>
          </Card>
          <Card className='flex-1 min-w-[180px] border border-border rounded-2xl shadow-none bg-background gap-0'>
            <CardHeader className=''>
              <CardTitle className='text-sm sm:text-base font-semibold'>Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl sm:text-3xl font-extrabold' style={{ fontFamily: "'Playfair Display', serif" }}>
                {filteredJournals.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {}
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
                  Avg Task Feedback
                </TableHead>
                <TableHead className='px-7 py-4 text-left text-sm font-bold text-gray-800 border-b border-[#e5e5e5]'>
                  Journal Entry
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getDateRangeArray(dateRange.startDate, dateRange.endDate)
                .reverse()
                .map((date) => {
                  const dayTasks = filteredTasks.filter((t) => {
                    const dayOfWeek = date.getDay();
                    const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
                    const selectedDayShort = dayMap[dayOfWeek];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Reset time to start of day
                    const selectedDate = new Date(date);
                    selectedDate.setHours(0, 0, 0, 0); // Reset time to start of day

                    if (t.isMandatory) {
                      const isCompleted = t.completions && t.completions.length > 0;
                      if (isCompleted) {
                        // If task is completed, only show on its configured days
                        if (t.daysOfWeek && t.daysOfWeek.length > 0) {
                          return t.daysOfWeek.some((day: string) => day === selectedDayShort);
                        }
                        return true;
                      } else {
                        // If task is NOT completed, show on ALL future dates until completed
                        // This makes mandatory tasks persist until they're done
                        if (selectedDate >= today) {
                          return true;
                        }

                        // For past dates, only show if it was scheduled for that day
                        if (t.daysOfWeek && t.daysOfWeek.length > 0) {
                          return t.daysOfWeek.some((day: string) => day === selectedDayShort);
                        }
                        return true;
                      }
                    } else {
                      // For non-mandatory tasks, only show on their configured days
                      if (t.daysOfWeek && t.daysOfWeek.length > 0) {
                        return t.daysOfWeek.some((day: string) => day === selectedDayShort);
                      }
                      return true;
                    }
                  });
                  const completed = dayTasks.filter((t) => t.completions && t.completions.length > 0).length;
                  const feedback = getAvgFeedbackForDay(dayTasks);
                  const journal = filteredJournals.some((j) => isSameDay(new Date(j.createdAt), date)) ? 'Yes' : 'No';
                  return (
                    <TableRow
                      key={date.toISOString()}
                      className='cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0 border-[#ececec]'
                      onClick={() => router.push(`/practitioner/clients/${clientId}/tasks/${formatDateForUrl(date)}`)}
                    >
                      <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className='px-7 py-5 whitespace-nowrap text-sm text-gray-900'>
                        {`${completed}/${dayTasks.length}`}
                      </TableCell>
                      <TableCell className='px-7 py-5 whitespace-nowrap'>{feedbackBadge(feedback)}</TableCell>
                      <TableCell className='px-7 py-5 whitespace-nowrap'>{journalBadge(journal)}</TableCell>
                    </TableRow>
                  );
                })}
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
          <h2 className='text-lg sm:text-xl font-semibold' style={{ fontFamily: "'Playfair Display', serif" }}>
            Past Sessions
          </h2>
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
      {filteredJournals.length === 0 ? (
        <div className='text-center text-muted-foreground py-8'>No journal entries found for this client.</div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 min-w-0'>
          {filteredJournals.map((entry) => {
            const previewText = (() => {
              const sections = entry.content.split('<hr>').filter((section) => section.trim());
              const contentSnippets: string[] = [];

              sections.forEach((section) => {
                const cleanContent = section.replace(/<h3>.*?<\/h3>/, '').trim();
                if (cleanContent) {
                  const textContent = cleanContent.replace(/<[^>]*>/g, '');
                  if (textContent.length > 0) {
                    const snippet = textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent;
                    contentSnippets.push(snippet);
                  }
                }
              });

              if (contentSnippets.length > 0) {
                return contentSnippets.slice(0, 2).join(' • ');
              }

              const textContent = entry.content.replace(/<[^>]*>/g, '');
              return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
            })();

            return (
              <Card
                key={entry.id}
                className='flex flex-col p-0 overflow-hidden h-48 sm:h-56 lg:h-64 xl:h-72 min-w-0 w-full bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50 hover:shadow-xl transition-shadow cursor-pointer'
                onClick={() => handleJournalClick(entry)}
              >
                <div className='flex-1 p-3 sm:p-4 lg:p-5 overflow-hidden'>
                  <div className='font-semibold text-sm sm:text-base leading-tight text-gray-800 mb-2'>
                    {entry.title || 'Untitled Entry'}
                  </div>
                  <div className='text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3'>
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>

                  <div className='text-sm sm:text-base text-gray-600 line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 xl:line-clamp-6'>
                    {previewText}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </TabsContent>
  );

  const renderContent = () => {
    if (editingPlanId) {
      if (isEditingPlanLoading) {
        return (
          <div className='min-h-screen flex items-center justify-center'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
              <p className='mt-2 text-sm text-muted-foreground'>Loading plan editor...</p>
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
                  <h1
                    className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
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

              <div className='flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full xs:w-auto'>
                <Link href={`/practitioner/clients/${clientId}/messages`}>
                  <Button variant='outline' className='rounded-full p-2 border border-border'>
                    <MessageCircle className='h-4 w-4' />
                  </Button>
                </Link>
                <Button
                  onClick={handleGenerateComprehensiveSummary}
                  disabled={sessions.length === 0 || generateComprehensiveSummaryMutation.isPending}
                  variant='outline'
                  className='rounded-full px-4 sm:px-6 py-2 text-sm font-medium border border-border'
                >
                  {generateComprehensiveSummaryMutation.isPending ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Taking Snapshot...
                    </>
                  ) : (
                    'Take a Snapshot'
                  )}
                </Button>
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
                  <TabsList className='flex flex-wrap gap-1 bg-transparent p-0 justify-start w-full sm:w-fit mb-6'>
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
            onClose={() => setIsTaskModalOpen(false)}
            task={{
              id: selectedTask.id,
              description: selectedTask.description,
              target: selectedTask.target ?? 'N/A',
              weeklyRepetitions: selectedTask.weeklyRepetitions ?? undefined,
              isMandatory: selectedTask.isMandatory,
              isCompleted: selectedTask.completions.length > 0,
              whyImportant: selectedTask.whyImportant ?? undefined,
              recommendedActions: selectedTask.recommendedActions ?? undefined,
              toolsToHelp: selectedTask.resources
                .map((r) => `${r.title || r.url} (${r.type === 'LINK' ? 'hyperlink' : 'PDF Doc'})`)
                .join(', '),
              resources: selectedTask.resources.map((r) => ({
                type: r.type as 'LINK' | 'PDF',
                url: r.url,
                title: r.title ?? undefined,
              })),
            }}
          />
        )}

        {selectedJournal && (
          <JournalDetailModal
            open={showJournalDetail}
            onClose={() => {
              setShowJournalDetail(false);
              setSelectedJournal(null);
            }}
            journal={selectedJournal}
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
        <ComprehensiveSummaryModal
          isOpen={showComprehensiveSummary}
          onClose={() => setShowComprehensiveSummary(false)}
          summary={comprehensiveSummary}
          isLoading={generateComprehensiveSummaryMutation.isPending}
          clientName={`${client?.firstName} ${client?.lastName}`}
        />
      </>
    );
  };

  return (
    <>
      {isRedirecting && (
        <div className='fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm'>
          <Loader2 className='h-10 w-10 animate-spin text-black mb-4' />
          <div className='text-lg font-semibold text-black'>Redirecting to review...</div>
        </div>
      )}
      {renderContent()}
    </>
  );
};

export default function ClientDashboardPage({ params }: { params: Promise<{ clientId: string }> }) {
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

  if (!clientId) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  return (
    <AudioRecorderProvider>
      <ClientDashboardContent clientId={clientId} />
    </AudioRecorderProvider>
  );
}

function getLast7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days.reverse();
}

function formatDateForUrl(date: Date) {
  return date.toISOString().split('T')[0];
}

function getAvgFeedbackForDay(tasks: PopulatedActionItem[]) {
  if (!tasks || tasks.length === 0) return 'Nil';

  const allCompletions = tasks.flatMap((task) => task.completions || []);

  if (allCompletions.length === 0) return 'Nil';

  const totalRating = allCompletions.reduce((sum, completion) => sum + (completion.rating || 0), 0);
  const avgRating = totalRating / allCompletions.length;

  if (avgRating >= 4) return 'Happy';
  if (avgRating >= 2.5) return 'Neutral';
  return 'Sad';
}

function getDateRangeArray(start: Date, end: Date) {
  const arr = [];
  let dt = new Date(start);
  while (dt <= end) {
    arr.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}
