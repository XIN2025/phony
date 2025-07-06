'use client';
import { TaskDetailModal } from '@/components/practitioner/TaskDetailModal';
import { AudioRecorder, AudioRecorderHandle } from '@/components/recorder/AudioRecorder';
import { AudioRecorderProvider, useAudioRecorder } from '@/context/AudioRecorderContext';
import { ApiClient } from '@/lib/api-client';
import { ActionItem, ActionItemCompletion, Plan, Resource, Session, User } from '@repo/db';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Tabs, TabsContent, TabsList } from '@repo/ui/components/tabs';
import { TabTrigger } from '@/components/TabTrigger';
import { ArrowLeft, MessageCircle, Plus, Target, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from '@repo/ui/components/dialog';
import { useSessionPolling } from '@/context/SessionPollingContext';

type PopulatedActionItem = ActionItem & { resources: Resource[]; completions: ActionItemCompletion[] };
type PopulatedPlan = Plan & { actionItems: PopulatedActionItem[] };
type PopulatedSession = Session & { plan: PopulatedPlan | null };

type SessionDetail = {
  id: string;
  status: string;
  title?: string;
  transcript?: string;
  filteredTranscript?: string;
  aiSummary?: string;
  plan?: {
    suggestedActionItems?: Array<{
      id: string;
      description: string;
      category?: string;
      target?: string;
      frequency?: string;
      status: string;
    }>;
  };
};

const ClientDashboardContent = ({ clientId }: { clientId: string }) => {
  const router = useRouter();
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

  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false);

  const [client, setClient] = useState<User | null>(null);
  const [sessions, setSessions] = useState<PopulatedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { audioBlob } = useAudioRecorder();

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

  const { addPendingSession } = useSessionPolling();

  useEffect(() => {
    if (clientId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const clientData = await ApiClient.get<User>(`/api/users/${clientId}`);
          setClient(clientData);
          const sessionsData = await ApiClient.get<PopulatedSession[]>(`/api/sessions/client/${clientId}`);
          setSessions(sessionsData);
        } catch (error) {
          console.error('Failed to fetch client data', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [clientId]);

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
      const newSession = await ApiClient.post<{ id: string }>('/api/sessions', {
        clientId: clientId,
        title: sessionTitle,
        notes: sessionNotes,
      });
      setNewSessionId(newSession.id);

      // 2. If there's an audio recording, upload it
      if (audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, `session_${newSession.id}.webm`);
        // Parse sessionDuration (e.g., '56m 27s') to seconds
        let durationSeconds = undefined;
        if (sessionDuration) {
          const match = sessionDuration.match(/(\d+)m\s*(\d+)s/);
          if (match && match[1] && match[2]) {
            durationSeconds = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
          }
        }
        if (typeof durationSeconds === 'number' && !isNaN(durationSeconds) && durationSeconds > 0) {
          formData.append('durationSeconds', String(durationSeconds));
        }
        try {
          await ApiClient.post(`/api/sessions/${newSession.id}/upload`, formData, {});
          addPendingSession(newSession.id);
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          setShowProcessingModal(false);
          setErrorMessage(
            'Failed to upload audio. The session was created but the audio recording could not be uploaded. You can try recording again.',
          );
          setShowErrorModal(true);
          return;
        }
      }

      toast.success('Session saved and sent for transcription!');
      setSessionTitle('');
      setSessionNotes('');
      // Optionally, refetch sessions to update the list
      const sessionsData = await ApiClient.get<PopulatedSession[]>(`/api/sessions/client/${clientId}`);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Failed to save session', error);
      setShowProcessingModal(false);
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
    setActiveTab('sessions');
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

  const handleSessionClick = async (sessionId: string) => {
    setIsLoadingSessionDetail(true);
    setIsSessionModalOpen(true);
    try {
      const sessionDetail = await ApiClient.get<SessionDetail>(`/api/sessions/${sessionId}`);
      setSelectedSession(sessionDetail);
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      toast.error('Failed to load session details');
    } finally {
      setIsLoadingSessionDetail(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndSession = async (audioBlob: Blob, duration: string) => {
    setSessionDuration(duration);
    setShowEndSessionModal(true);
    setProcessingStep('uploading');
    setProcessingError(null);
    setSessionTranscript(null);

    try {
      // 1. Create the session
      const newSession = await ApiClient.post<{ id: string }>('/api/sessions', {
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
      await ApiClient.post(`/api/sessions/${newSession.id}/upload`, formData, {});
      addPendingSession(newSession.id);
      toast.success('Your audio is being processed. The transcript will be available shortly.');
      setShowEndSessionModal(false);
      // Optionally refresh session list
      const sessionsData = await ApiClient.get<PopulatedSession[]>(`/api/sessions/client/${clientId}`);
      setSessions(sessionsData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload audio or create session');
      setProcessingError(err.message || 'Failed to upload audio or fetch transcript');
      setProcessingStep('error');
      setShowEndSessionModal(false);
    }
  };

  const handleConfirmEndSession = () => {
    setShowEndSessionModal(false);
    setShowProcessingModal(true);
    handleSaveAndTranscribe();
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
    if (pendingNavigation) pendingNavigation();
  };

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
              <CardTitle className='text-sm sm:text-base font-semibold'>Tasks Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl sm:text-3xl font-extrabold'>{stats.pending}</div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className='w-full border border-border rounded-2xl shadow-none bg-background'>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent className='p-4 sm:p-6 lg:p-8'>
          <div className='space-y-4 sm:space-y-5'>
            {isLoading ? (
              <Skeleton className='h-24 w-full' />
            ) : allTasks.length > 0 ? (
              allTasks.map((task) => (
                <Card
                  key={task.id}
                  className='border border-border rounded-xl bg-background shadow-none cursor-pointer hover:bg-gray-50 transition-colors'
                  onClick={() => handleTaskClick(task)}
                >
                  <CardContent className='p-4 sm:p-5 flex gap-3 sm:gap-4 items-start'>
                    <Checkbox className='mt-1 flex-shrink-0' checked={task.completions.length > 0} />
                    <div className='flex-1 min-w-0'>
                      <div className='font-semibold mb-1 text-sm sm:text-base'>{task.description}</div>
                      <div className='text-xs text-muted-foreground mb-1'>{task.description}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className='text-muted-foreground text-center'>No tasks have been assigned to this client yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );

  const renderSessionsTab = () => (
    <TabsContent value='sessions' className='mt-0'>
      <div className='w-full'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
          <h2 className='text-lg sm:text-xl font-semibold'>Past Sessions</h2>
          <Button
            onClick={handleNewSession}
            className='w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 py-2'
          >
            + New Session
          </Button>
        </div>
        <Card className='w-full border border-border rounded-2xl shadow-none bg-background'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Action Plan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className='h-8 w-full' />
                  </TableCell>
                </TableRow>
              ) : sessions.length > 0 ? (
                sessions.map((session) => {
                  // Format duration from durationSeconds
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
                  // Use summary, aiSummary, or fallback
                  const summary =
                    session.summary || session.aiSummary || 'More control on anxiety than in past sessions.';
                  return (
                    <TableRow key={session.id}>
                      <TableCell>{session.title || 'Untitled Session'}</TableCell>
                      <TableCell>{new Date(session.recordedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{duration}</TableCell>
                      <TableCell>{summary}</TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label='View Action Plan'
                          onClick={() => handleSessionClick(session.id)}
                        >
                          <span role='img' aria-label='View'>
                            👁️
                          </span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className='text-center text-muted-foreground'>
                    No sessions recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </TabsContent>
  );

  const renderPlansTab = () => (
    <TabsContent value='plans' className='mt-0'>
      <div className='space-y-6'>
        {sessions && sessions.length > 0 ? (
          sessions
            .filter((session) => session.plan)
            .map((session) => (
              <Card key={session.id} className='bg-background border border-border rounded-xl shadow-none'>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div>
                      <h3 className='font-semibold text-lg'>{session.title || 'Untitled Session'}</h3>
                      <p className='text-sm text-muted-foreground'>
                        {new Date(session.recordedAt).toLocaleDateString()}
                      </p>
                      <div className='flex items-center gap-2 mt-2'>
                        <Badge
                          variant={
                            session.plan?.status === 'PUBLISHED'
                              ? 'default'
                              : session.plan?.status === 'DRAFT'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {session.plan?.status || 'No Plan'}
                        </Badge>
                        {session.plan?.actionItems && (
                          <span className='text-sm text-muted-foreground'>
                            {session.plan.actionItems.length} action items
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => router.push(`/practitioner/sessions/${session.id}`)}
                    >
                      View Details
                    </Button>
                  </div>

                  {session.plan?.actionItems && session.plan.actionItems.length > 0 && (
                    <div className='space-y-2'>
                      <h4 className='font-medium text-sm'>Action Items:</h4>
                      <div className='space-y-1'>
                        {session.plan.actionItems.slice(0, 3).map((item) => (
                          <div key={item.id} className='flex items-center gap-2 text-sm'>
                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                            <span className='flex-1'>{item.description}</span>
                            {item.isMandatory && (
                              <Badge variant='destructive' className='text-xs'>
                                Mandatory
                              </Badge>
                            )}
                          </div>
                        ))}
                        {session.plan.actionItems.length > 3 && (
                          <p className='text-xs text-muted-foreground'>
                            +{session.plan.actionItems.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
        ) : (
          <div className='text-center py-12'>
            <div className='max-w-md mx-auto'>
              <Target className='h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50' />
              <h3 className='text-lg font-semibold mb-2'>No action plans yet</h3>
              <p className='text-muted-foreground mb-6'>
                Create your first session to start building action plans for your client.
              </p>
              <Button onClick={handleNewSession} className='bg-foreground text-background hover:bg-foreground/90'>
                <Plus className='h-4 w-4 mr-2' />
                Record First Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  );
  const renderJournalTab = () => (
    <TabsContent value='journal' className='mt-0'>
      <div className='text-center text-muted-foreground'>Journal entries will be shown here.</div>
    </TabsContent>
  );

  const renderContent = () => {
    if (showNewSession) {
      return (
        <div className='min-h-screen bg-background flex flex-col'>
          <div className='px-2 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b bg-background'>
            <button
              type='button'
              aria-label='Back'
              onClick={handleBack}
              className='text-muted-foreground hover:text-foreground focus:outline-none'
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
            </button>
            <h2 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight mt-2'>New Session</h2>
          </div>
          <div className='flex flex-col md:flex-row gap-6 p-8 flex-1'>
            <div className='flex-1 space-y-6'>
              <div className='border rounded-lg p-6'>
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
              <div className='border rounded-lg p-6'>
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
              <div className='border rounded-lg p-6 flex flex-col items-center'>
                <AudioRecorder ref={audioRecorderRef} onStop={handleEndSession} />
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

    if (isLoading) {
      return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
    }

    return (
      <>
        <div className='flex flex-col min-h-screen bg-background'>
          <div className='flex flex-col gap-0 border-b bg-background px-2 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
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
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 sm:px-0 mt-2'>
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

              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0'>
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
                <Button className='rounded-full px-4 sm:px-6 py-2 text-sm font-medium border border-border bg-foreground text-background hover:bg-foreground/90'>
                  Take Progress Snapshot
                </Button>
              </div>
            </div>
          </div>

          <div className='flex-1 w-full flex py-4 sm:py-8 bg-background'>
            <div className='w-full px-4 sm:px-8 lg:px-16 flex flex-col gap-6 sm:gap-8'>
              <div className='w-full'>
                <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
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

        {/* Session Detail Modal */}
        {isSessionModalOpen && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
              <div className='flex items-center justify-between p-6 border-b'>
                <h2 className='text-xl font-semibold'>{selectedSession?.title || 'Session Details'}</h2>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => {
                    setIsSessionModalOpen(false);
                    setSelectedSession(null);
                  }}
                >
                  <X className='h-5 w-5' />
                </Button>
              </div>

              <div className='p-6 space-y-6'>
                {isLoadingSessionDetail ? (
                  <div className='flex items-center justify-center py-8'>
                    <Skeleton className='h-8 w-full' />
                  </div>
                ) : selectedSession ? (
                  <>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <h3 className='font-semibold mb-2'>Status</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedSession.status === 'REVIEW_READY'
                              ? 'bg-green-100 text-green-800'
                              : selectedSession.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {selectedSession.status}
                        </span>
                      </div>
                      <div>
                        <h3 className='font-semibold mb-2'>Title</h3>
                        <p className='text-sm text-gray-600'>{selectedSession.title || 'Untitled Session'}</p>
                      </div>
                    </div>

                    {selectedSession.transcript && (
                      <div>
                        <h3 className='font-semibold mb-2'>Transcript</h3>
                        <div className='bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto'>
                          <pre className='text-sm whitespace-pre-wrap'>{selectedSession.transcript}</pre>
                        </div>
                      </div>
                    )}

                    {selectedSession.filteredTranscript && (
                      <div>
                        <h3 className='font-semibold mb-2'>Filtered Transcript</h3>
                        <div className='bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto'>
                          <pre className='text-sm whitespace-pre-wrap'>{selectedSession.filteredTranscript}</pre>
                        </div>
                      </div>
                    )}

                    {selectedSession.aiSummary && (
                      <div>
                        <h3 className='font-semibold mb-2'>AI Summary</h3>
                        <div className='bg-blue-50 p-4 rounded-lg'>
                          <p className='text-sm'>{selectedSession.aiSummary}</p>
                        </div>
                      </div>
                    )}

                    {selectedSession.plan?.suggestedActionItems &&
                      selectedSession.plan.suggestedActionItems.length > 0 && (
                        <div>
                          <h3 className='font-semibold mb-2'>Suggested Action Items</h3>
                          <div className='space-y-3'>
                            {selectedSession.plan.suggestedActionItems.map((item) => (
                              <div key={item.id} className='border p-3 rounded-lg'>
                                <p className='font-medium text-sm'>{item.description}</p>
                                <div className='flex flex-wrap gap-2 mt-2'>
                                  {item.category && (
                                    <span className='text-xs bg-gray-100 px-2 py-1 rounded'>
                                      Category: {item.category}
                                    </span>
                                  )}
                                  {item.target && (
                                    <span className='text-xs bg-gray-100 px-2 py-1 rounded'>Target: {item.target}</span>
                                  )}
                                  {item.frequency && (
                                    <span className='text-xs bg-gray-100 px-2 py-1 rounded'>
                                      Frequency: {item.frequency}
                                    </span>
                                  )}
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      item.status === 'PENDING'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : item.status === 'APPROVED'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  <div className='text-center text-gray-500 py-8'>No session details available</div>
                )}
              </div>
            </div>
          </div>
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

  if (!clientId) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  return (
    <AudioRecorderProvider>
      <ClientDashboardContent clientId={clientId} />
    </AudioRecorderProvider>
  );
}
