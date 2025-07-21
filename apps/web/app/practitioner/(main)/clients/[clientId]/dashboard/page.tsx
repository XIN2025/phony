'use client';
import { JournalDetailModal } from '@/components/practitioner/JournalDetailModal';
import { PlanEditor } from '@/components/practitioner/PlanEditor';
import { TaskDetailModal } from '@/components/practitioner/TaskDetailModal';
import { AudioRecorder, AudioRecorderHandle } from '@/components/recorder/AudioRecorder';
import { TabTrigger } from '@/components/TabTrigger';
import { AudioRecorderProvider } from '@/context/AudioRecorderContext';
import {
  useCreateSession,
  useGenerateComprehensiveSummary,
  useGetClient,
  useGetClientActionItemsInRange,
  useGetClientJournalEntries,
  useGetPlan,
  useGetPlanStatus,
  useGetSessionForPolling,
  useGetSessionsByClient,
  usePublishPlan,
  useUploadSessionAudio,
} from '@/lib/hooks/use-api';
import { ActionItem, ActionItemCompletion, Plan, Resource, Session } from '@repo/db';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Tabs, TabsContent, TabsList } from '@repo/ui/components/tabs';
import { BookText, ClipboardList } from 'lucide-react';
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

import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ClientPageHeader } from '@/components/practitioner/ClientPageHeader';
import { getAvatarUrl, getFileUrl, getInitials, isSameDay } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { DateRange } from 'react-date-range';
import { createPortal } from 'react-dom';
import Link from 'next/link';

import SummaryTab from './summary';
import SessionsTab from './sessions';
import PlansTab from './plans';
import JournalTab from './journal';
import ProfileTab from './profile';

type PopulatedActionItem = ActionItem & { resources: Resource[]; completions: ActionItemCompletion[] };
type PopulatedPlan = Plan & { actionItems: PopulatedActionItem[] };
type PopulatedSession = Session & { plan: PopulatedPlan | null };

const TABS = [
  { key: 'dashboard', label: 'Summary' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'plans', label: 'Plans' },
  { key: 'journal', label: 'Journal' },
  { key: 'profile', label: 'Profile' },
];

const ClientDashboardContent = ({ clientId }: { clientId: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTask, setSelectedTask] = useState<PopulatedActionItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
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

  const [showIntakeSurvey, setShowIntakeSurvey] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['dashboard', 'sessions', 'plans', 'journal', 'profile'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('dashboard');
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

  const weekDates = getDateRangeArray(dateRange.startDate, dateRange.endDate);
  const totalTasks = weekDates.reduce((sum, date) => {
    return (
      sum +
      filteredTasks.filter((t) => {
        const dayOfWeek = date.getDay();
        const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
        const selectedDayShort = dayMap[dayOfWeek];
        if (t.isMandatory) {
          if (t.daysOfWeek && t.daysOfWeek.length > 0) {
            return t.daysOfWeek.some((day: string) => day === selectedDayShort);
          }
          return true;
        } else {
          if (t.daysOfWeek && t.daysOfWeek.length > 0) {
            return t.daysOfWeek.some((day: string) => day === selectedDayShort);
          }
          return true;
        }
      }).length
    );
  }, 0);
  const completedTasks = weekDates.reduce((sum, date) => {
    return (
      sum +
      filteredTasks.filter((t) => {
        const dayOfWeek = date.getDay();
        const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
        const selectedDayShort = dayMap[dayOfWeek];
        if (t.completions && t.completions.length > 0) {
          if (t.daysOfWeek && t.daysOfWeek.length > 0) {
            return t.daysOfWeek.some((day: string) => day === selectedDayShort);
          }
          return true;
        }
        return false;
      }).length
    );
  }, 0);

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
    router.push(`/practitioner/clients/${clientId}/dashboard/new-session`);
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
    // Check if summary is cached and up to date
    if (isSummaryCached && comprehensiveSummary && comprehensiveSummary.lastSessionCount === sessions.length) {
      setShowComprehensiveSummary(true);
      toast.info('Showing cached summary (no new sessions).');
      return;
    }
    try {
      setShowComprehensiveSummary(true);
      setIsSummaryCached(false);
      const summary = await generateComprehensiveSummaryMutation.mutateAsync(clientId);
      setComprehensiveSummary({ ...summary, lastSessionCount: sessions.length });
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
      // Always go back to dashboard with correct tab in URL
      const newUrl = new URL(window.location.href);
      let targetTab = searchParams.get('tab');
      // If no tab, default to summary
      if (!targetTab) {
        targetTab = 'summary';
      }
      newUrl.searchParams.set('tab', targetTab);
      router.push(newUrl.pathname + newUrl.search);
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
      badgeClass = 'bg-[#C7E8D4] text-black';
      emoji = '😊';
    } else if (feedback === 'Neutral') {
      badgeClass = 'bg-[#F8EFC7] text-black';
      emoji = '😐';
    } else if (feedback === 'Sad') {
      badgeClass = 'bg-[#F8D7D7] text-black';
      emoji = '🙁';
    } else if (feedback === 'Nil') {
      badgeClass = 'bg-[#D1CDCB] text-black';
      emoji = '';
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-5 py-1.5 text-sm font-semibold ${badgeClass}`}
        style={{ minWidth: 80, justifyContent: 'center' }}
      >
        {emoji && <span className='mr-1'>{emoji}</span>}
        {feedback}
      </span>
    );
  };

  const journalBadge = (journal: string) => {
    return journal;
  };

  const renderPlansTab = () => (
    <TabsContent value='plans' className='mt-0'>
      <div className='flex flex-col gap-6'>
        <div className='flex justify-between items-center mb-2'>
          <h2 className='text-lg sm:text-3xl font-semibold' style={{ fontFamily: "'DM Serif Display', serif" }}>
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

  const renderDashboardTab = () => {
    const weekTasks = weekDates.flatMap((date) => {
      const dayOfWeek = date.getDay();
      const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
      const selectedDayShort = dayMap[dayOfWeek];
      return filteredTasks.filter((t) => {
        if (t.daysOfWeek && t.daysOfWeek.length > 0) {
          return t.daysOfWeek.some((day: string) => day === selectedDayShort);
        }
        return true;
      });
    });
    const avgFeedback = getAvgFeedbackForDay(weekTasks);
    let feedbackEmoji = '';
    let feedbackText = '';
    if (avgFeedback === 'Happy') {
      feedbackEmoji = '😊';
      feedbackText = 'Happy';
    } else if (avgFeedback === 'Neutral') {
      feedbackEmoji = '😐';
      feedbackText = 'Neutral';
    } else if (avgFeedback === 'Sad') {
      feedbackEmoji = '🙁';
      feedbackText = 'Sad';
    } else {
      feedbackEmoji = '';
      feedbackText = 'Nil';
    }

    return (
      <TabsContent value='dashboard' className='mt-0'>
        <div className='flex flex-col gap-6 w-full mb-8'>
          {/* Date Picker Button */}
          <div className='flex justify-between mb-2'>
            <h2 className='text-lg sm:text-3xl font-semibold' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Summary
            </h2>
            <button
              ref={dateButtonRef}
              className='flex items-center gap-2 px-4 py-2 rounded-full border border-[#ececec] border-gray-700 shadow-sm text-base font-semibold hover:bg-[#f6f5f4] transition-all min-w-[220px]'
              onClick={() => setShowDatePicker((v) => !v)}
              aria-label='Select date range'
              type='button'
            >
              <span className='mr-2'>
                <svg width='20' height='20' fill='none' viewBox='0 0 24 24'>
                  <rect x='3' y='5' width='18' height='16' rx='3' stroke='#222' strokeWidth='1.5' />
                  <path d='M16 3v4M8 3v4' stroke='#222' strokeWidth='1.5' strokeLinecap='round' />
                </svg>
              </span>
              {dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              <span className='mx-1'>-</span>
              {dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
          </div>
          {/* Calendar Overlay */}
          {datePickerMounted &&
            showDatePicker &&
            createPortal(
              <div
                ref={datePickerRef}
                style={{
                  position: 'absolute',
                  top: pickerPosition.top,
                  left: pickerPosition.left,
                  zIndex: 50,
                  width: 350,
                  background: 'white',
                  borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid #ececec',
                  padding: 16,
                }}
                className='calendar-float'
              >
                <DateRange
                  ranges={[dateRange]}
                  onChange={(ranges) => {
                    const range = ranges.selection || {};
                    setDateRange({
                      startDate: range.startDate || dateRange.startDate,
                      endDate: range.endDate || dateRange.endDate,
                      key: 'selection',
                    });
                    setShowDatePicker(false);
                  }}
                  moveRangeOnFirstSelection={false}
                  months={1}
                  direction='horizontal'
                  rangeColors={['#222']}
                  editableDateInputs={false}
                  showMonthAndYearPickers={true}
                />
              </div>,
              document.body,
            )}
          {/* End Date Picker */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-full'>
            <div className='bg-white rounded-2xl shadow-md border border-[#ececec] p-6 flex flex-col items-start gap-2'>
              <div className='flex items-center justify-between w-full'>
                <div
                  className='text-[2rem] font-extrabold'
                  style={{ fontFamily: "'DM Serif Display', serif", color: '#807171' }}
                >
                  {completion}%
                </div>
                <ClipboardList className='h-10 w-10 text-[#807171]' />
              </div>
              <div className='text-base font-semibold text-black/80'>Avg Daily Tasks Completion</div>
            </div>
            <div className='bg-white rounded-2xl shadow-md border border-[#ececec] p-6 flex flex-col items-start gap-2'>
              <div className='flex items-center justify-between w-full'>
                <div
                  className='text-[2rem] font-extrabold'
                  style={{ fontFamily: "'DM Serif Display', serif", color: '#807171' }}
                >
                  {filteredJournals.length}
                </div>
                <BookText className='h-10 w-10 text-[#807171]' />
              </div>
              <div className='text-base font-semibold text-black/80'>Journal Entries</div>
            </div>
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-full'>
            <div className='bg-white rounded-2xl shadow-md border border-[#ececec] p-0 flex-1 min-w-0'>
              <div className='p-6 pb-2'>
                <div className='text-2xl font-bold mb-4' style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Last Week's Overview
                </div>
              </div>
              <div className='overflow-x-auto w-full'>
                <Table className='min-w-[320px] sm:min-w-[600px] bg-white rounded-2xl overflow-hidden text-xs sm:text-sm'>
                  <TableHeader>
                    <TableRow className='bg-white'>
                      <TableHead className='px-7 py-4 text-left text-base font-bold text-black border-b border-[#e5e5e5]'>
                        Date
                      </TableHead>
                      <TableHead className='px-7 py-4 text-left text-base font-bold text-black border-b border-[#e5e5e5]'>
                        Tasks
                      </TableHead>
                      <TableHead className='px-7 py-4 text-left text-base font-bold text-black border-b border-[#e5e5e5]'>
                        Avg Task Feedback
                      </TableHead>
                      <TableHead className='px-7 py-4 text-left text-base font-bold text-black border-b border-[#e5e5e5]'>
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
                          today.setHours(0, 0, 0, 0);
                          const selectedDate = new Date(date);
                          selectedDate.setHours(0, 0, 0, 0);
                          if (t.isMandatory) {
                            const isCompleted = t.completions && t.completions.length > 0;
                            if (isCompleted) {
                              if (t.daysOfWeek && t.daysOfWeek.length > 0) {
                                return t.daysOfWeek.some((day: string) => day === selectedDayShort);
                              }
                              return true;
                            } else {
                              if (selectedDate >= today) {
                                return true;
                              }
                              if (t.daysOfWeek && t.daysOfWeek.length > 0) {
                                return t.daysOfWeek.some((day: string) => day === selectedDayShort);
                              }
                              return true;
                            }
                          } else {
                            if (t.daysOfWeek && t.daysOfWeek.length > 0) {
                              return t.daysOfWeek.some((day: string) => day === selectedDayShort);
                            }
                            return true;
                          }
                        });
                        const completed = dayTasks.filter((t) => t.completions && t.completions.length > 0).length;
                        const feedback = getAvgFeedbackForDay(dayTasks);
                        const journal = filteredJournals.some((j) => isSameDay(new Date(j.createdAt), date))
                          ? 'Yes'
                          : 'No';
                        return (
                          <TableRow
                            key={date.toISOString()}
                            className='border-b last:border-b-0 border-[#ececec] bg-white hover:bg-[#f6f5f4] transition-colors cursor-pointer'
                            onClick={() =>
                              router.push(`/practitioner/clients/${clientId}/tasks/${formatDateForUrl(date)}`)
                            }
                          >
                            <TableCell className='px-7 py-4 whitespace-nowrap text-base text-black'>
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </TableCell>
                            <TableCell className='px-7 py-4 whitespace-nowrap text-base text-black'>{`${completed}/${dayTasks.length}`}</TableCell>
                            <TableCell className='px-7 py-4 whitespace-nowrap'>{feedbackBadge(feedback)}</TableCell>
                            <TableCell className='px-7 py-4 whitespace-nowrap'>{journalBadge(journal)}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className='bg-white rounded-2xl shadow-md border border-[#ececec] p-4 sm:p-6 flex flex-col gap-4 w-full min-w-0'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
                <div
                  className='text-2xl font-bold flex items-center'
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  Snapshot
                  {isSummaryCached && (
                    <span className='ml-2 px-2 py-0.5 text-xs rounded-full bg-[#f6f5f4] text-gray-600 border border-gray-300'>
                      Cached
                    </span>
                  )}
                </div>
                <Button
                  variant='outline'
                  className='rounded-full border border-black px-4 py-1.5 text-base font-semibold hover:bg-[#f6f5f4] transition-all w-full sm:w-auto mt-2 sm:mt-0'
                  onClick={handleGenerateComprehensiveSummary}
                  disabled={generateComprehensiveSummaryMutation.isPending}
                >
                  {generateComprehensiveSummaryMutation.isPending ? 'Generating...' : 'Generate Snapshot'}
                </Button>
              </div>
              <div className='text-lg font-semibold text-[#2d4739] mb-2'>Last Week's Progress</div>
              <div className='flex flex-col sm:flex-row gap-3 mb-2'>
                <div className='flex-1 bg-white border border-[#ececec] rounded-xl p-3 sm:p-4 flex flex-col items-center mb-2 sm:mb-0'>
                  <div className='text-xs text-gray-500 mb-1'>Tasks Done</div>
                  <div className='text-xl font-bold'>
                    {completedTasks}/{totalTasks}
                  </div>
                </div>
                <div className='flex-1 bg-white border border-[#ececec] rounded-xl p-3 sm:p-4 flex flex-col items-center'>
                  <div className='text-xs text-gray-500 mb-1'>Avg Task Feedback</div>
                  <div className='text-xl font-bold flex items-center gap-1'>
                    <span>{feedbackEmoji}</span>
                    <span>{feedbackText}</span>
                  </div>
                </div>
              </div>
              <div className='bg-white border border-[#ececec] rounded-xl p-3 sm:p-4 mb-2 overflow-x-auto'>
                <div className='text-xs font-semibold mb-1'>Previous Session Summary</div>
                <div className='text-sm text-gray-700'>
                  {comprehensiveSummary?.summary ? (
                    <MarkdownRenderer content={comprehensiveSummary.summary} />
                  ) : (
                    'No summary available.'
                  )}
                </div>
              </div>
              <div className='bg-white border border-[#ececec] rounded-xl p-3 sm:p-4'>
                <div className='text-xs font-semibold mb-1'>Insights</div>
                <div className='text-sm text-gray-700'>
                  {Array.isArray(comprehensiveSummary?.keyInsights)
                    ? comprehensiveSummary.keyInsights.map((insight: string, idx: number) => (
                        <div key={idx} className='mb-1'>
                          • {insight}
                        </div>
                      ))
                    : 'No insights available.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    );
  };

  const renderSessionsTab = () => (
    <TabsContent value='sessions' className='mt-0'>
      <div className='flex flex-col gap-6'>
        <div className='flex justify-between items-center mb-2'>
          <h2 className='text-lg sm:text-3xl font-semibold' style={{ fontFamily: "'DM Serif Display', serif" }}>
            Past Sessions
          </h2>
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
                  <Image src='/arrow-right.svg' alt='Back' width={54} height={54} className='h-14 w-14' />
                </button>
              </div>
              <div className='flex flex-row items-center justify-between gap-2 mt-2'>
                <h1
                  className='text-lg sm:text-xl md:text-4xl font-bold leading-tight'
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  Edit Action Plan
                </h1>
                {planStatus === 'DRAFT' &&
                  editingPlan &&
                  (editingPlan as any).actionItems &&
                  (editingPlan as any).actionItems.length > 0 && (
                    <Button
                      onClick={handlePublishPlan}
                      disabled={isPublishingPlan || publishPlanMutation.isPending}
                      className='bg-black text-white rounded-full px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold shadow-md hover:bg-neutral-800 transition-all whitespace-nowrap'
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
              showHeader={false}
            />
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
          {/* Removed duplicate custom header. Only ClientPageHeader is rendered at the top. */}
          <div className='flex-1 w-full flex py-4 sm:py-8'>
            <div className='w-full px-4 sm:px-8 lg:px-16 flex flex-col gap-6 sm:gap-8'>
              <div className='w-full'>
                <div className='flex flex-row gap-0 bg-[#f6f5f4] border border-[#d1d1d1] rounded-full shadow-sm w-full sm:w-fit mb-6 overflow-x-auto whitespace-nowrap'>
                  {TABS.map((tab) => (
                    <Link
                      key={tab.key}
                      href={
                        tab.key === 'dashboard'
                          ? `/practitioner/clients/${clientId}/dashboard?tab=dashboard`
                          : `/practitioner/clients/${clientId}/dashboard?tab=${tab.key}`
                      }
                      className={`rounded-full px-7 py-2 text-base font-normal transition-colors ${activeTab === tab.key ? 'bg-[#d1cdcb] text-black' : ''}`}
                      scroll={false}
                      replace
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
                {activeTab === 'dashboard' && <SummaryTab clientId={clientId} />}
                {activeTab === 'sessions' && <SessionsTab clientId={clientId} />}
                {activeTab === 'plans' && <PlansTab clientId={clientId} />}
                {activeTab === 'journal' && (
                  <JournalTab clientId={clientId} dateRange={dateRange} handleJournalClick={handleJournalClick} />
                )}
                {activeTab === 'profile' && <ProfileTab clientId={clientId} />}
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
      </>
    );
  };

  const rightActions = (
    <Button
      onClick={handleNewSession}
      className='bg-black text-white rounded-full px-6 py-2 text-base font-semibold shadow-md hover:bg-neutral-800 transition-all w-full sm:w-auto min-w-0'
    >
      + New Session
    </Button>
  );

  return (
    <>
      {isRedirecting && (
        <div className='fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm'>
          <Loader2 className='h-10 w-10 animate-spin text-black mb-4' />
          <div className='text-lg font-semibold text-black'>Redirecting to review...</div>
        </div>
      )}
      {/* Only render ClientPageHeader if not editing plan or showing new session */}
      {!isLoading && client && !editingPlanId && <ClientPageHeader client={client} rightActions={rightActions} />}
      {/* Render new session screen as a top-level overlay, independent of tab */}
      {renderContent()}
    </>
  );
};

export default function ClientDashboardPage({ params }: { params: Promise<{ clientId: string }> }) {
  const [clientId, setClientId] = useState<string>('');
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined;

  useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

  // Ensure ?tab=summary is always present by default
  useEffect(() => {
    if (clientId && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (!url.searchParams.get('tab')) {
        url.searchParams.set('tab', 'summary');
        router.replace(url.pathname + url.search);
      }
    }
  }, [clientId, router]);

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
