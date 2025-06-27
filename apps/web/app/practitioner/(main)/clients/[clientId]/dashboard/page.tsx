'use client';
import React, { useState, useEffect } from 'react';
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

const mockClient = {
  name: 'Sophie Bennett',
  since: 'Jan 1, 2025',
  avatarUrl: '',
};
const mockStats = {
  completion: 85,
  pending: 4,
};
const mockGoals = {
  daily: [
    {
      title: 'Spend Time Outdoors',
      target: '30 Mins',
      frequency: '2/day',
      feedback: 'This makes me feel calm and collected.',
      achieved: '40 mins',
      potentialActions: [
        'Try different outdoor activities like walking, gardening, or sitting in a park',
        'Set reminders to go outside during lunch breaks',
        'Find outdoor spaces near your home or workplace',
      ],
      whyThisHelps:
        'Spending time outdoors has been scientifically proven to reduce stress, improve mood, and enhance mental clarity. Natural environments help regulate cortisol levels and provide a mental reset from daily stressors.',
      toolsToHelp: [
        { title: 'Nature Apps for Meditation', type: 'hyperlink', url: 'https://example.com' },
        { title: 'Outdoor Activity Guide', type: 'PDF Doc' },
      ],
    },
    {
      title: 'Engage in Cardio Exercise',
      target: '30 Mins',
      frequency: '1/day',
      feedback: '',
      achieved: '-',
      potentialActions: [
        'Start with light exercises like brisk walking or cycling',
        'Join a fitness class or find workout videos online',
        'Set a consistent time each day for exercise',
      ],
      whyThisHelps:
        'Regular cardio exercise releases endorphins, improves cardiovascular health, and helps manage anxiety and depression. It also improves sleep quality and cognitive function.',
      toolsToHelp: [
        { title: 'Beginner Workout Plans', type: 'PDF Doc' },
        { title: 'Fitness Tracking App', type: 'hyperlink', url: 'https://example.com' },
      ],
    },
    {
      title: 'Check in with a friend or family member',
      target: '1 person',
      frequency: '1/day',
      feedback: '',
      achieved: '-',
      whyThisHelps:
        'Social connections are crucial for mental health. Regular check-ins help maintain relationships, provide emotional support, and reduce feelings of isolation.',
      toolsToHelp: [{ title: 'Communication Tips Guide', type: 'PDF Doc' }],
    },
  ],
  consistent: [
    {
      title: 'Sleep Routine',
      target: '8 hrs',
      frequency: '1/day',
      feedback: 'Sleeping is still very troublesome',
      achieved: '4 hrs',
      potentialActions: [
        'Establish a consistent bedtime and wake-up time',
        'Create a relaxing bedtime routine',
        'Limit screen time before bed',
        'Consider sleep hygiene practices',
      ],
      whyThisHelps:
        'Quality sleep is essential for mental health, emotional regulation, and cognitive function. Poor sleep can exacerbate anxiety and depression.',
      toolsToHelp: [
        { title: 'Sleep Hygiene Guide', type: 'PDF Doc' },
        { title: 'Meditation for Sleep', type: 'hyperlink', url: 'https://example.com' },
      ],
    },
    {
      title: 'Water',
      target: '4 L',
      frequency: '1/day',
      feedback: '',
      achieved: '-',
      potentialActions: [
        'Keep a water bottle with you throughout the day',
        'Set reminders to drink water regularly',
        'Track your daily water intake',
      ],
      whyThisHelps:
        'Proper hydration is crucial for brain function, mood regulation, and overall physical health. Dehydration can lead to fatigue and difficulty concentrating.',
      toolsToHelp: [{ title: 'Hydration Tracking App', type: 'hyperlink', url: 'https://example.com' }],
    },
    {
      title: 'Avoid Alcohol',
      target: '0 drinks',
      frequency: '1/day',
      feedback: '',
      achieved: '-',
      whyThisHelps:
        'Avoiding alcohol helps maintain stable mood, improves sleep quality, and prevents interference with mental health medications.',
      toolsToHelp: [{ title: 'Alcohol Alternatives Guide', type: 'PDF Doc' }],
    },
  ],
};

export default function ClientDashboardPage({ params }: { params: Promise<{ clientId: string }> }) {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showJournalDetail, setShowJournalDetail] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  const handleTaskClick = (task: any) => {
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

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!clientId) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  if (showNewSession) {
    return (
      <div className='flex flex-col min-h-screen bg-background'>
        <div className='flex flex-col gap-0 border-b bg-background px-2 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
          <div className='w-full flex items-center'>
            <button
              type='button'
              aria-label='Back'
              onClick={() => {
                setShowNewSession(false);
                setActiveTab('sessions');
              }}
              className='text-muted-foreground hover:text-foreground focus:outline-none'
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
            </button>
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 sm:px-0 mt-2'>
            <div>
              <h1 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'>New Session</h1>
              <p className='text-xs sm:text-sm text-muted-foreground'>Sophie Bennett</p>
            </div>
          </div>
        </div>

        <div className='flex-1 w-full flex py-4 sm:py-8 bg-background'>
          <div className='w-full px-4 sm:px-8 lg:px-16 flex flex-col gap-6 sm:gap-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl'>
              <Card className='border border-border rounded-lg bg-background'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base font-semibold'>Session Details</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <span className='text-sm font-medium text-muted-foreground'>Client:</span>
                    <p className='text-sm font-semibold'>Sophie Bennett</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium block mb-2'>Session Title</label>
                    <Input
                      placeholder='Why do you want to begin therapy?'
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      className='w-full text-sm'
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className='border border-border rounded-lg bg-background'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base font-semibold'>Audio Recording</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='text-center'>
                    <div className='text-3xl font-mono font-bold mb-4'>{formatTime(recordingTime)}</div>
                    {!isRecording ? (
                      <Button
                        onClick={handleStartRecording}
                        className='w-full bg-foreground text-background hover:bg-foreground/90 rounded-lg py-2.5'
                      >
                        <Play className='mr-2 h-4 w-4' />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStopRecording}
                        className='w-full bg-red-600 text-white hover:bg-red-700 rounded-lg py-2.5'
                      >
                        <Square className='mr-2 h-4 w-4' />
                        Stop Recording
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className='border border-border rounded-lg bg-background'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base font-semibold'>Session Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder='Start typing your session notes here'
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className='w-full h-48 resize-none text-sm'
                  />
                </CardContent>
              </Card>

              <Card className='border border-border rounded-lg bg-background'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base font-semibold'>Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-48 p-3 bg-muted rounded-lg border'>
                    <p className='text-muted-foreground text-sm'>
                      Once recording starts, the transcript will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showActionPlan && selectedPlan) {
    return (
      <div className='flex flex-col min-h-screen bg-background'>
        <div className='flex flex-col gap-0 border-b bg-background px-2 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
          <div className='w-full flex items-center'>
            <button
              type='button'
              aria-label='Back'
              onClick={() => {
                setShowActionPlan(false);
                setSelectedPlan(null);
                setActiveTab('plans');
              }}
              className='text-muted-foreground hover:text-foreground focus:outline-none'
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
            </button>
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 sm:px-0 mt-2'>
            <div>
              <h1 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'>Action Plan</h1>
              <p className='text-xs sm:text-sm text-muted-foreground'>Anxiety Riddance | Jul 19, 2025 | 10:00 AM</p>
            </div>
          </div>
        </div>

        <div className='flex-1 w-full flex py-4 sm:py-8 bg-background'>
          <div className='w-full px-4 sm:px-8 lg:px-16 flex flex-col gap-6 sm:gap-8'>
            <div className='w-full'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
                <h2 className='text-lg sm:text-xl font-semibold'>Tasks</h2>
                <div className='flex flex-wrap gap-2 justify-start sm:justify-end'>
                  <Button
                    size='sm'
                    variant='outline'
                    className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                  >
                    Select Date
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                  >
                    Pending
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                  >
                    Completed
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <div>
                  <div className='flex items-center gap-2 mb-4'>
                    <div className='text-base font-semibold'>Daily Targeted Goals</div>
                    <Button variant='ghost' size='sm' className='text-xs text-muted-foreground'>
                      + Add Task
                    </Button>
                  </div>
                  <div className='space-y-4'>
                    <Card className='border border-border rounded-xl bg-background shadow-none'>
                      <CardContent className='p-4 flex gap-3 items-start'>
                        <Checkbox className='mt-1 flex-shrink-0' checked />
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium mb-2 text-sm'>Spend Time Outdoors</div>
                          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground mb-2'>
                            <span>
                              Target: <span className='text-foreground font-medium'>30 Mins</span>
                            </span>
                            <span>
                              Frequency: <span className='text-foreground font-medium'>2/day</span>
                            </span>
                          </div>
                          <div className='flex items-start gap-2 text-xs mb-2'>
                            <span className='text-green-600'>😊</span>
                            <span className='text-foreground'>This helped me feel calm and collected.</span>
                          </div>
                          <div className='text-xs'>
                            Achieved: <span className='font-medium text-foreground'>49 mins</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className='border border-border rounded-xl bg-background shadow-none'>
                      <CardContent className='p-4 flex gap-3 items-start'>
                        <Checkbox className='mt-1 flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium mb-2 text-sm'>Engage in Cardio Exercise</div>
                          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground mb-2'>
                            <span>
                              Target: <span className='text-foreground font-medium'>30 Mins</span>
                            </span>
                            <span>
                              Frequency: <span className='text-foreground font-medium'>30 Mins</span>
                            </span>
                          </div>
                          <div className='text-xs mb-2'>
                            Feedback: <span className='text-muted-foreground'>-</span>
                          </div>
                          <div className='text-xs'>
                            Achieved: <span className='text-muted-foreground'>-</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className='border border-border rounded-xl bg-background shadow-none'>
                      <CardContent className='p-4 flex gap-3 items-start'>
                        <Checkbox className='mt-1 flex-shrink-0' checked />
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium mb-2 text-sm'>Check in with a friend or family member</div>
                          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground mb-2'>
                            <span>
                              Target: <span className='text-foreground font-medium'>2</span>
                            </span>
                          </div>
                          <div className='flex items-start gap-2 text-xs mb-2'>
                            <span className='text-green-600'>😊</span>
                            <span className='text-foreground'>This helped me feel calm and collected.</span>
                          </div>
                          <div className='text-xs'>
                            Achieved: <span className='font-medium text-foreground'>2</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className='border border-border rounded-xl bg-background shadow-none'>
                      <CardContent className='p-4 flex gap-3 items-start'>
                        <Checkbox className='mt-1 flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium mb-2 text-sm'>Implement a Daily Gratitude Practice</div>
                          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground mb-2'>
                            <span>
                              Target: <span className='text-foreground font-medium'>4 L</span>
                            </span>
                          </div>
                          <div className='text-xs'>
                            Achieved: <span className='text-muted-foreground'>-</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <div className='flex items-center gap-2 mb-4'>
                    <div className='text-base font-semibold'>Consistent Goals</div>
                    <Button variant='ghost' size='sm' className='text-xs text-muted-foreground'>
                      + Add Task
                    </Button>
                  </div>
                  <div className='space-y-4'>
                    <Card className='border border-border rounded-xl bg-background shadow-none'>
                      <CardContent className='p-4 flex gap-3 items-start'>
                        <Checkbox className='mt-1 flex-shrink-0' checked />
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium mb-2 text-sm'>Sleep Routine</div>
                          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground mb-2'>
                            <span>
                              Target: <span className='text-foreground font-medium'>8 hrs</span>
                            </span>
                            <span>
                              Frequency: <span className='text-foreground font-medium'>1/day</span>
                            </span>
                          </div>
                          <div className='flex items-start gap-2 text-xs mb-2'>
                            <span className='text-blue-600'>😢</span>
                            <span className='text-foreground'>Sleeping is still very troublesome</span>
                          </div>
                          <div className='text-xs'>
                            Achieved: <span className='font-medium text-foreground'>4 hrs</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className='border border-border rounded-xl bg-background shadow-none'>
                      <CardContent className='p-4 flex gap-3 items-start'>
                        <Checkbox className='mt-1 flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium mb-2 text-sm'>Water</div>
                          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground mb-2'>
                            <span>
                              Target: <span className='text-foreground font-medium'>4 L</span>
                            </span>
                            <span>
                              Frequency: <span className='text-foreground font-medium'>30 Mins</span>
                            </span>
                          </div>
                          <div className='text-xs mb-2'>
                            Feedback: <span className='text-muted-foreground'>-</span>
                          </div>
                          <div className='text-xs'>
                            Achieved: <span className='text-muted-foreground'>-</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className='border border-border rounded-xl bg-background shadow-none'>
                      <CardContent className='p-4 flex gap-3 items-start'>
                        <Checkbox className='mt-1 flex-shrink-0' checked />
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium mb-2 text-sm'>Avoid Alcohol</div>
                          <div className='flex flex-wrap gap-3 text-xs text-muted-foreground mb-2'>
                            <span>
                              Target: <span className='text-foreground font-medium'>0 L</span>
                            </span>
                          </div>
                          <div className='flex items-start gap-2 text-xs mb-2'>
                            <span className='text-green-600'>😊</span>
                            <span className='text-foreground'>This helped me feel calm and collected.</span>
                          </div>
                          <div className='text-xs'>
                            Achieved: <span className='font-medium text-foreground'>0</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showJournalDetail && selectedJournal) {
    return (
      <div className='flex flex-col min-h-screen bg-background'>
        <div className='flex flex-col gap-0 border-b bg-background px-2 sm:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
          <div className='w-full flex items-center'>
            <button
              type='button'
              aria-label='Back'
              onClick={() => {
                setShowJournalDetail(false);
                setSelectedJournal(null);
                setActiveTab('journal');
              }}
              className='text-muted-foreground hover:text-foreground focus:outline-none'
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
            </button>
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 sm:px-0 mt-2'>
            <div>
              <h1 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'>12 Jun 2025</h1>
            </div>
          </div>
        </div>

        <div className='flex-1 w-full flex py-4 sm:py-8 bg-background'>
          <div className='w-full px-4 sm:px-8 lg:px-16 flex flex-col gap-6 sm:gap-8'>
            <div className='w-full max-w-4xl'>
              <div className='space-y-4 text-sm sm:text-base leading-relaxed'>
                <p>I have been feeling this and that</p>
                <p>A lot of feelings</p>
                <p>
                  I have been feeling this and that I have been feeling this and that I have been feeling this and that
                  I have been feeling this and that
                </p>
                <p>A lot of feelings</p>
                <p>I have been feeling this and that</p>
                <p>A lot of feelings</p>
                <p>I have been feeling this and that</p>
                <p>A lot of feelings</p>
                <p>I have been feeling this and that</p>
                <p>A lot of feelings</p>
                <p>I have been feeling this and that</p>
                <p>A lot of feelings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
            <div>
              <h1 className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'>Sophie Bennett</h1>
              <p className='text-xs sm:text-sm text-muted-foreground'>Client since Jan 1, 2025</p>
            </div>
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

                <TabsContent value='dashboard' className='mt-0'>
                  <div className='flex flex-col gap-4 w-full mb-6 sm:mb-8'>
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between w-full gap-3 md:gap-0'>
                      <h2 className='text-lg sm:text-xl font-semibold mb-0'>Tasks</h2>
                      <div className='flex flex-wrap gap-2 justify-start md:justify-end'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                        >
                          Select Date
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                        >
                          All Tasks
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                        >
                          Pending
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='rounded-full px-3 sm:px-5 py-1.5 text-xs sm:text-sm font-medium border border-border'
                        >
                          Completed
                        </Button>
                      </div>
                    </div>
                    <div className='flex flex-col sm:flex-row gap-4 w-full'>
                      <Card className='flex-1 min-w-[180px] border border-border rounded-2xl shadow-none bg-background'>
                        <CardHeader className='pb-2'>
                          <CardTitle className='text-sm sm:text-base font-semibold'>
                            Avg Daily Tasks Completion
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='text-2xl sm:text-3xl font-extrabold'>{mockStats.completion}%</div>
                        </CardContent>
                      </Card>
                      <Card className='flex-1 min-w-[180px] border border-border rounded-2xl shadow-none bg-background'>
                        <CardHeader className='pb-2'>
                          <CardTitle className='text-sm sm:text-base font-semibold'>Tasks Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='text-2xl sm:text-3xl font-extrabold'>{mockStats.pending}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  <Card className='w-full border border-border rounded-2xl shadow-none bg-background'>
                    <CardContent className='p-4 sm:p-6 lg:p-8'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 w-full'>
                        <div>
                          <div className='font-semibold text-base sm:text-lg mb-4 sm:mb-5'>Daily Targeted Goals</div>
                          <div className='space-y-4 sm:space-y-5'>
                            {mockGoals.daily.map((goal, i) => (
                              <Card
                                key={i}
                                className='border border-border rounded-xl bg-background shadow-none cursor-pointer hover:bg-gray-50 transition-colors'
                                onClick={() => handleTaskClick(goal)}
                              >
                                <CardContent className='p-4 sm:p-5 flex gap-3 sm:gap-4 items-start'>
                                  <Checkbox className='mt-1 flex-shrink-0' />
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-semibold mb-1 text-sm sm:text-base'>{goal.title}</div>
                                    <div className='flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground mb-1'>
                                      <span>
                                        Target: <span className='text-foreground font-medium'>{goal.target}</span>
                                      </span>
                                      <span>
                                        Frequency: <span className='text-foreground font-medium'>{goal.frequency}</span>
                                      </span>
                                    </div>
                                    <div className='flex items-start gap-2 text-xs mt-2'>
                                      <MessageCircle className='h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5' />
                                      <span className='text-foreground'>{goal.feedback}</span>
                                    </div>
                                    <div className='text-xs mt-1'>
                                      Achieved: <span className='font-medium text-foreground'>{goal.achieved}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className='font-semibold text-base sm:text-lg mb-4 sm:mb-5'>Consistent Goals</div>
                          <div className='space-y-4 sm:space-y-5'>
                            {mockGoals.consistent.map((goal, i) => (
                              <Card
                                key={i}
                                className='border border-border rounded-xl bg-background shadow-none cursor-pointer hover:bg-gray-50 transition-colors'
                                onClick={() => handleTaskClick(goal)}
                              >
                                <CardContent className='p-4 sm:p-5 flex gap-3 sm:gap-4 items-start'>
                                  <Checkbox className='mt-1 flex-shrink-0' />
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-semibold mb-1 text-sm sm:text-base'>{goal.title}</div>
                                    <div className='flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground mb-1'>
                                      <span>
                                        Target: <span className='text-foreground font-medium'>{goal.target}</span>
                                      </span>
                                      <span>
                                        Frequency: <span className='text-foreground font-medium'>{goal.frequency}</span>
                                      </span>
                                    </div>
                                    <div className='flex items-start gap-2 text-xs mt-2'>
                                      <MessageCircle className='h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5' />
                                      <span className='text-foreground'>{goal.feedback}</span>
                                    </div>
                                    <div className='text-xs mt-1'>
                                      Achieved: <span className='font-medium text-foreground'>{goal.achieved}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

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
                          <TableRow>
                            <TableCell>Anxiety Guidance</TableCell>
                            <TableCell>Jun 16, 25</TableCell>
                            <TableCell>56 m 27 s</TableCell>
                            <TableCell>More control on anxiety than in past sessions</TableCell>
                            <TableCell>
                              <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                  <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 4a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 20a2 2 0 100-4 2 2 0 000 4z' />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Anxiety Guidance</TableCell>
                            <TableCell>Jun 9, 25</TableCell>
                            <TableCell>60m 19 s</TableCell>
                            <TableCell>More control on anxiety than in past sessions</TableCell>
                            <TableCell>
                              <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                  <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 4a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 20a2 2 0 100-4 2 2 0 000 4z' />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Anxiety Guidance</TableCell>
                            <TableCell>Jun 2, 25</TableCell>
                            <TableCell>57 m 17 s</TableCell>
                            <TableCell>More control on anxiety than in past sessions</TableCell>
                            <TableCell>
                              <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                  <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 4a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 20a2 2 0 100-4 2 2 0 000 4z' />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Anxiety Guidance</TableCell>
                            <TableCell>May 30, 25</TableCell>
                            <TableCell>59 m 59 s</TableCell>
                            <TableCell>More control on anxiety than in past sessions</TableCell>
                            <TableCell>
                              <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                  <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 4a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 20a2 2 0 100-4 2 2 0 000 4z' />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Anxiety Guidance</TableCell>
                            <TableCell>May 21, 25</TableCell>
                            <TableCell>61 m 2 s</TableCell>
                            <TableCell>More control on anxiety than in past sessions</TableCell>
                            <TableCell>
                              <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                  <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 4a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 20a2 2 0 100-4 2 2 0 000 4z' />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Anxiety Guidance</TableCell>
                            <TableCell>May 14, 25</TableCell>
                            <TableCell>58 m 14 s</TableCell>
                            <TableCell>More control on anxiety than in past sessions</TableCell>
                            <TableCell>
                              <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                  <path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 4a2 2 0 100-4 2 2 0 000 4z' />
                                  <path d='M10 20a2 2 0 100-4 2 2 0 000 4z' />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value='plans' className='mt-0'>
                  <div className='w-full'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
                      <div className='relative'>
                        <input
                          type='text'
                          placeholder='Search Plan'
                          className='w-full sm:w-80 px-4 py-2 pl-10 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent'
                        />
                        <svg
                          className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                          />
                        </svg>
                      </div>
                    </div>

                    <Card className='w-full border border-border rounded-2xl shadow-none bg-background'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Session Title</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead>Avg Task Feedback</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow
                            className='cursor-pointer hover:bg-muted/50 transition-colors'
                            onClick={() =>
                              handlePlanClick({ date: 'Jun 16, 25', title: 'Anxiety Riddance', activity: 'Low' })
                            }
                          >
                            <TableCell>Jun 16, 25</TableCell>
                            <TableCell>Anxiety Riddance</TableCell>
                            <TableCell>
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800'>
                                Low
                              </span>
                            </TableCell>
                            <TableCell>Nil</TableCell>
                            <TableCell>
                              <div className='flex gap-2'>
                                <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M15 12a3 3 0 11-6 0 3 3 0 616 0z'
                                    />
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                    />
                                  </svg>
                                </Button>
                                <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow
                            className='cursor-pointer hover:bg-muted/50 transition-colors'
                            onClick={() =>
                              handlePlanClick({ date: 'Jun 9, 25', title: 'Anxiety Riddance', activity: 'Medium' })
                            }
                          >
                            <TableCell>Jun 9, 25</TableCell>
                            <TableCell>Anxiety Riddance</TableCell>
                            <TableCell>
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800'>
                                Medium
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-1'>
                                <span className='text-green-600'>😊</span>
                                <span className='text-xs'>Happy</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex gap-2'>
                                <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M15 12a3 3 0 11-6 0 3 3 0 616 0z'
                                    />
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow
                            className='cursor-pointer hover:bg-muted/50 transition-colors'
                            onClick={() =>
                              handlePlanClick({ date: 'Jun 2, 25', title: 'Anxiety Riddance', activity: 'Low' })
                            }
                          >
                            <TableCell>Jun 2, 25</TableCell>
                            <TableCell>Anxiety Riddance</TableCell>
                            <TableCell>
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800'>
                                Low
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-1'>
                                <span className='text-gray-600'>😐</span>
                                <span className='text-xs'>Neutral</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex gap-2'>
                                <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M15 12a3 3 0 11-6 0 3 3 0 616 0z'
                                    />
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                    />
                                  </svg>
                                </Button>
                                <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow
                            className='cursor-pointer hover:bg-muted/50 transition-colors'
                            onClick={() =>
                              handlePlanClick({ date: 'May 30, 25', title: 'Anxiety Riddance', activity: 'High' })
                            }
                          >
                            <TableCell>May 30, 25</TableCell>
                            <TableCell>Anxiety Riddance</TableCell>
                            <TableCell>
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800'>
                                High
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-1'>
                                <span className='text-blue-600'>😢</span>
                                <span className='text-xs'>Sad</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex gap-2'>
                                <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M15 12a3 3 0 11-6 0 3 3 0 616 0z'
                                    />
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow
                            className='cursor-pointer hover:bg-muted/50 transition-colors'
                            onClick={() =>
                              handlePlanClick({ date: 'May 21, 25', title: 'Anxiety Riddance', activity: 'Medium' })
                            }
                          >
                            <TableCell>May 21, 25</TableCell>
                            <TableCell>Anxiety Riddance</TableCell>
                            <TableCell>
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800'>
                                Medium
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-1'>
                                <span className='text-gray-600'>😐</span>
                                <span className='text-xs'>Neutral</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex gap-2'>
                                <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M15 12a3 3 0 11-6 0 3 3 0 616 0z'
                                    />
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow
                            className='cursor-pointer hover:bg-muted/50 transition-colors'
                            onClick={() =>
                              handlePlanClick({ date: 'May 14, 25', title: 'Anxiety Riddance', activity: 'Low' })
                            }
                          >
                            <TableCell>May 14, 25</TableCell>
                            <TableCell>Anxiety Riddance</TableCell>
                            <TableCell>
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800'>
                                Low
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-1'>
                                <span className='text-green-600'>😊</span>
                                <span className='text-xs'>Happy</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex gap-2'>
                                <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M15 12a3 3 0 11-6 0 3 3 0 616 0z'
                                    />
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value='journal' className='mt-0'>
                  <div className='w-full'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
                      <h2 className='text-lg sm:text-xl font-semibold'>Journal Entries</h2>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
                      <Card
                        className='bg-muted border border-border rounded-2xl shadow-none cursor-pointer hover:bg-muted/80 transition-colors min-h-[200px] sm:min-h-[240px]'
                        onClick={() => handleJournalClick({ date: '12 Jun 2025', id: 1 })}
                      >
                        <CardContent className='p-4 sm:p-6 h-full flex flex-col justify-between'>
                          <div className='flex-1'></div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>12 Jun 2025</span>
                            <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                              </svg>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className='bg-muted border border-border rounded-2xl shadow-none cursor-pointer hover:bg-muted/80 transition-colors min-h-[200px] sm:min-h-[240px]'
                        onClick={() => handleJournalClick({ date: '12 Jun 2025', id: 2 })}
                      >
                        <CardContent className='p-4 sm:p-6 h-full flex flex-col justify-between'>
                          <div className='flex-1'></div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>12 Jun 2025</span>
                            <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                              </svg>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className='bg-muted border border-border rounded-2xl shadow-none cursor-pointer hover:bg-muted/80 transition-colors min-h-[200px] sm:min-h-[240px]'
                        onClick={() => handleJournalClick({ date: '12 Jun 2025', id: 3 })}
                      >
                        <CardContent className='p-4 sm:p-6 h-full flex flex-col justify-between'>
                          <div className='flex-1'></div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>12 Jun 2025</span>
                            <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                              </svg>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className='bg-muted border border-border rounded-2xl shadow-none cursor-pointer hover:bg-muted/80 transition-colors min-h-[200px] sm:min-h-[240px]'
                        onClick={() => handleJournalClick({ date: '11 Jun 2025', id: 4 })}
                      >
                        <CardContent className='p-4 sm:p-6 h-full flex flex-col justify-between'>
                          <div className='flex-1'></div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>11 Jun 2025</span>
                            <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                              </svg>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className='bg-muted border border-border rounded-2xl shadow-none cursor-pointer hover:bg-muted/80 transition-colors min-h-[200px] sm:min-h-[240px]'
                        onClick={() => handleJournalClick({ date: '10 Jun 2025', id: 5 })}
                      >
                        <CardContent className='p-4 sm:p-6 h-full flex flex-col justify-between'>
                          <div className='flex-1'></div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>10 Jun 2025</span>
                            <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                              </svg>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className='bg-muted border border-border rounded-2xl shadow-none cursor-pointer hover:bg-muted/80 transition-colors min-h-[200px] sm:min-h-[240px]'
                        onClick={() => handleJournalClick({ date: '09 Jun 2025', id: 6 })}
                      >
                        <CardContent className='p-4 sm:p-6 h-full flex flex-col justify-between'>
                          <div className='flex-1'></div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium'>09 Jun 2025</span>
                            <Button variant='ghost' size='sm' className='p-1 h-8 w-8'>
                              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                              </svg>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && <TaskDetailModal open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen} task={selectedTask} />}
    </>
  );
}
