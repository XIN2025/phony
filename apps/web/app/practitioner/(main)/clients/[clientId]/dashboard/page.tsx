'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/tabs';
import { ArrowLeft, MessageCircle, Plus, Play, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@repo/ui/components/checkbox';
import Link from 'next/link';
import { TaskDetailModal } from '@/components/practitioner/TaskDetailModal';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar';
import { AudioRecorderProvider, useAudioRecorder } from '@/context/AudioRecorderContext';
import { AudioRecorder } from '@/components/recorder/AudioRecorder';
import { ApiClient } from '@/lib/api-client';
import { User, Session, Plan, ActionItem, ActionItemCompletion, Resource } from '@repo/db';
import { Skeleton } from '@repo/ui/components/skeleton';
import { toast } from 'sonner';

// Define more specific types for our data
type PopulatedActionItem = ActionItem & { resources: Resource[]; completions: ActionItemCompletion[] };
type PopulatedPlan = Plan & { actionItems: PopulatedActionItem[] };
type PopulatedSession = Session & { plan: PopulatedPlan | null };

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
  const [consentGiven, setConsentGiven] = useState(false);

  const [client, setClient] = useState<User | null>(null);
  const [sessions, setSessions] = useState<PopulatedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { audioBlob } = useAudioRecorder();

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

      // 2. If there's an audio recording, upload it
      if (audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, `session_${newSession.id}.webm`);
        await ApiClient.post(`/api/sessions/${newSession.id}/upload`, formData);
      }

      toast.success('Session saved and sent for transcription!');
      setShowNewSession(false);
      setSessionTitle('');
      setSessionNotes('');
      // Optionally, refetch sessions to update the list
      const sessionsData = await ApiClient.get<PopulatedSession[]>(`/api/sessions/client/${clientId}`);
      setSessions(sessionsData);
    } catch (error) {
      toast.error('Failed to save session.', {
        description: 'Please try again.',
      });
      console.error('Failed to save session', error);
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
                <TableHead>Session Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tasks Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Skeleton className='h-8 w-full' />
                  </TableCell>
                </TableRow>
              ) : sessions.length > 0 ? (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{new Date(session.recordedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          session.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {session.status}
                      </span>
                    </TableCell>
                    <TableCell>{session.plan?.actionItems?.length || 0}</TableCell>
                    <TableCell>
                      <Button variant='ghost' size='sm' className='p-1 h-8 w-8' disabled>
                        ...
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className='text-center text-muted-foreground'>
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
      <div className='text-center text-muted-foreground'>Action Plan history will be shown here.</div>
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
        <div className='flex flex-col min-h-screen bg-background'>
          <div className='flex flex-col gap-0 border-b bg-background px-2 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
            <div className='flex items-center justify-between'>
              <Button variant='ghost' size='icon' onClick={() => setShowNewSession(false)}>
                <ArrowLeft className='h-5 w-5' />
              </Button>
              <h1 className='text-lg sm:text-xl font-semibold'>New Session</h1>
              <div className='w-8' />
            </div>
          </div>
          <div className='flex-grow overflow-auto p-4 sm:p-6 md:p-8'>
            <div className='max-w-4xl mx-auto'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <div className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Session Details</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <Input
                        placeholder='Session Title (e.g., "Weekly Check-in")'
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder='Add any notes or observations here...'
                        className='min-h-[150px]'
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                      />
                    </CardContent>
                  </Card>
                </div>
                <div className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Record Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='flex items-center space-x-2 mb-4'>
                        <Checkbox
                          id='consent'
                          checked={consentGiven}
                          onCheckedChange={(checked) => setConsentGiven(Boolean(checked))}
                        />
                        <label
                          htmlFor='consent'
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                        >
                          I have obtained verbal consent from my client to record this session.
                        </label>
                      </div>
                      <AudioRecorder consentGiven={consentGiven} />
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className='mt-8 flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setShowNewSession(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAndTranscribe}>Save and Transcribe</Button>
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
                onClick={() => router.push('/practitioner/clients')}
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
                    <TabsTrigger
                      value='dashboard'
                      className='rounded-full px-4 sm:px-7 py-2 text-sm sm:text-base font-semibold border border-border data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=inactive]:bg-background data-[state=inactive]:text-foreground whitespace-nowrap flex-shrink-0'
                    >
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                      value='sessions'
                      className='rounded-full px-4 sm:px-7 py-2 text-sm sm:text-base font-semibold border border-border data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=inactive]:bg-background data-[state=inactive]:text-foreground whitespace-nowrap flex-shrink-0'
                    >
                      Sessions
                    </TabsTrigger>
                    <TabsTrigger
                      value='plans'
                      className='rounded-full px-4 sm:px-7 py-2 text-sm sm:text-base font-semibold border border-border data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=inactive]:bg-background data-[state=inactive]:text-foreground whitespace-nowrap flex-shrink-0'
                    >
                      Plans
                    </TabsTrigger>
                    <TabsTrigger
                      value='journal'
                      className='rounded-full px-4 sm:px-7 py-2 text-sm sm:text-base font-semibold border border-border data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=inactive]:bg-background data-[state=inactive]:text-foreground whitespace-nowrap flex-shrink-0'
                    >
                      Journal
                    </TabsTrigger>
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
