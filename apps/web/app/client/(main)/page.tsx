'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import {
  Star,
  Calendar,
  Target,
  Clock,
  Menu,
  AlertCircle,
  Info,
  ExternalLink,
  RefreshCw,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSidebar } from '@/context/SidebarContext';
import Link from 'next/link';
import { Badge } from '@repo/ui/components/badge';
import { useGetClientPlans, useCompleteActionItem, useGetCurrentUser } from '@/lib/hooks/use-api';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ActionItem {
  id: string;
  description: string;
  target?: string;
  frequency?: string;
  weeklyRepetitions?: number;
  isMandatory?: boolean;
  whyImportant?: string;
  recommendedActions?: string;
  toolsToHelp?: string;
  category?: string;
  isCompleted: boolean;
  resources?: Array<{
    type: 'LINK' | 'PDF';
    url: string;
    title?: string;
  }>;
}

interface CompletionData {
  rating: number;
  journalEntry: string;
  achievedValue: string;
}

interface Plan {
  id: string;
  actionItems: ActionItem[];
}

const ClientPage = () => {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const { setSidebarOpen } = useSidebar();
  const [selectedTask, setSelectedTask] = useState<ActionItem | null>(null);
  const [completionData, setCompletionData] = useState<CompletionData>({
    rating: 0,
    journalEntry: '',
    achievedValue: '',
  });

  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useGetClientPlans(session?.user?.id || '');

  const todayTasks: ActionItem[] = plans.reduce((acc: ActionItem[], plan: Plan) => {
    if (plan.actionItems && plan.actionItems.length > 0) {
      plan.actionItems.forEach((item: any) => {
        acc.push({
          id: item.id,
          description: item.description,
          target: item.target,
          frequency: item.frequency,
          weeklyRepetitions: item.weeklyRepetitions || 1,
          isMandatory: item.isMandatory || false,
          whyImportant: item.whyImportant,
          recommendedActions: item.recommendedActions,
          toolsToHelp: item.toolsToHelp,
          category: item.category,
          isCompleted: item.completions && item.completions.length > 0,
          resources: item.resources || [],
        });
      });
    }
    return acc;
  }, []);

  const sortedTasks = todayTasks.sort((a, b) => {
    if (a.isMandatory && !b.isMandatory) return -1;
    if (!a.isMandatory && b.isMandatory) return 1;
    return 0;
  });

  const completeTaskMutation = useCompleteActionItem();

  const handleTaskToggle = (task: ActionItem) => {
    if (task.isCompleted) {
      return;
    }
    setSelectedTask(task);
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;

    completeTaskMutation.mutate(
      {
        taskId: selectedTask.id,
        completionData: {
          clientId: session?.user?.id,
          rating: completionData.rating,
          journalEntry: completionData.journalEntry,
          achievedValue: completionData.achievedValue,
        },
      },
      {
        onSuccess: () => {
          setSelectedTask(null);
          setCompletionData({ rating: 0, journalEntry: '', achievedValue: '' });
        },
        onError: (error: any) => {
          // Error handling
        },
      },
    );
  };

  useEffect(() => {
    // Component mounted
  }, [status, session]);

  useEffect(() => {
    // Session update
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-gray-600'>Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  // --- GET REAL USER DATA ---
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser();
  const avgCompletion = 85;
  const tasksPending = 4;
  const mandatoryTasks = [
    {
      id: '1',
      title: 'Meditation',
      duration: '15 Minutes',
      feedback: true,
      mandatory: true,
      completed: true,
    },
    {
      id: '2',
      title: 'Meditation',
      duration: '15 Minutes',
      feedback: false,
      mandatory: true,
      completed: false,
    },
  ];
  const dailyTasks = [
    {
      id: '3',
      title: 'Meditation',
      duration: '15 Minutes',
      completed: false,
    },
    {
      id: '4',
      title: 'Meditation',
      duration: '15 Minutes',
      completed: false,
    },
  ];

  // Feedback modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<'happy' | 'neutral' | 'sad' | null>(null);

  const handleTaskCardClick = () => {
    setFeedbackOpen(true);
    setSelectedFeedback(null);
  };

  const handleFeedbackSelect = (type: 'happy' | 'neutral' | 'sad') => {
    setSelectedFeedback(type);
  };

  const handleFeedbackSubmit = () => {
    setFeedbackOpen(false);
    setSelectedFeedback(null);
    // TODO: send feedback to backend
  };

  return (
    <div className='p-4 sm:p-6 flex flex-col flex-1 h-full w-full gap-4'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='icon' className='lg:hidden' onClick={() => setSidebarOpen(true)}>
            <Menu className='h-6 w-6' />
            <span className='sr-only'>Toggle sidebar</span>
          </Button>
          <h1 className='text-2xl font-bold'>
            {userLoading ? 'Loading...' : `Good Morning ${currentUser?.firstName || 'User'}`}
          </h1>
        </div>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2 w-full max-w-xl'>
        <Card>
          <CardContent className='flex flex-col items-start justify-center p-4'>
            <span className='text-2xl font-bold'>{avgCompletion}%</span>
            <span className='text-xs text-muted-foreground'>Avg Daily Tasks Completion</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-start justify-center p-4'>
            <span className='text-2xl font-bold'>{tasksPending}</span>
            <span className='text-xs text-muted-foreground'>Tasks Pending</span>
          </CardContent>
        </Card>
      </div>
      <div className='rounded-xl border border-gray-400 dark:border-gray-700 p-4 sm:p-6 flex flex-col gap-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2'>
          <h2 className='text-lg font-semibold mb-2 sm:mb-0'>Tasks</h2>
          <div className='flex flex-wrap gap-2 sm:justify-end'>
            <Button variant='outline' size='sm'>
              Select Date
            </Button>
            <Button variant='outline' size='sm'>
              All Tasks
            </Button>
            <Button variant='outline' size='sm'>
              Pending
            </Button>
            <Button variant='outline' size='sm'>
              Completed
            </Button>
          </div>
        </div>
        <div>
          <h2 className='text-lg font-semibold mb-2'>Mandatory tasks for the week</h2>
          <div className='flex flex-col gap-3'>
            {mandatoryTasks.map((task) => (
              <Card key={task.id} className='border border-border cursor-pointer'>
                <CardContent className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-2'>
                  <div className='flex items-start gap-2 w-full flex-col sm:flex-row sm:items-center'>
                    <Checkbox checked={task.completed} disabled className='mb-2 sm:mb-0' />
                    <div className='flex-1'>
                      <span className='font-semibold text-base'>{task.title}</span>
                      <span className='block text-xs text-muted-foreground'>Duration: {task.duration}</span>
                      {task.feedback && (
                        <span className='block text-xs text-muted-foreground flex items-center gap-1 mt-1'>
                          Feedback <Info className='h-3 w-3' />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='flex flex-wrap items-center gap-2 mt-2 sm:mt-0'>
                    {task.mandatory && (
                      <Badge variant='outline' className='text-xs'>
                        Mandatory
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h2 className='text-lg font-semibold mb-2'>Daily Tasks</h2>
          <div className='flex flex-col gap-3'>
            {dailyTasks.map((task) => (
              <Card key={task.id} className='border border-border cursor-pointer'>
                <CardContent className='flex flex-col sm:flex-row items-center justify-between p-4 gap-2'>
                  <div className='flex items-center gap-2 w-full'>
                    <Checkbox checked={task.completed} disabled />
                    <div className='flex flex-col'>
                      <span className='font-semibold text-base'>{task.title}</span>
                      <span className='text-xs text-muted-foreground'>Duration: {task.duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      {/* Feedback Modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className='test-center-modal max-w-md p-8 flex flex-col items-center rounded-2xl'>
          <DialogTitle asChild>
            <VisuallyHidden>Was this task helpful?</VisuallyHidden>
          </DialogTitle>
          <div className='text-xl font-semibold mb-6 text-center'>Was this task helpful?</div>
          <div className='flex items-center justify-center gap-8 mb-6'>
            <button
              aria-label='Happy'
              className={`rounded-full p-2 border-2 ${selectedFeedback === 'happy' ? 'border-black' : 'border-transparent'} transition`}
              onClick={() => handleFeedbackSelect('happy')}
            >
              <Smile className='w-10 h-10' />
            </button>
            <button
              aria-label='Neutral'
              className={`rounded-full p-2 border-2 ${selectedFeedback === 'neutral' ? 'border-black' : 'border-transparent'} transition`}
              onClick={() => handleFeedbackSelect('neutral')}
            >
              <Meh className='w-10 h-10' />
            </button>
            <button
              aria-label='Sad'
              className={`rounded-full p-2 border-2 ${selectedFeedback === 'sad' ? 'border-black' : 'border-transparent'} transition`}
              onClick={() => handleFeedbackSelect('sad')}
            >
              <Frown className='w-10 h-10' />
            </button>
          </div>
          <button
            className='w-full bg-black text-white rounded-full py-2 text-base font-medium disabled:opacity-50 transition'
            onClick={handleFeedbackSubmit}
            disabled={!selectedFeedback}
          >
            Submit
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPage;
