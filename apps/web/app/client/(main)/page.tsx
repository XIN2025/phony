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
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';

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

// Add a type for demo tasks
interface DemoTask {
  id: string;
  title: string;
  duration: string;
  feedback?: boolean;
  mandatory?: boolean;
  completed: boolean;
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

  // Update handleTaskCardClick to use the correct type
  const handleTaskCardClick = (task: DemoTask) => {
    setFeedbackOpen(true);
    setSelectedFeedback(null);
    setSelectedTask(task as any); // keep selectedTask logic for now
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
    <div className='flex flex-col w-full pt-4 sm:pt-6 px-3 sm:px-4 lg:px-6 xl:px-8 min-w-0'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 w-full gap-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <SidebarToggleButton />
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-0 truncate'>
            {userLoading ? 'Loading...' : `Good Morning ${currentUser?.firstName || 'User'}`}
          </h1>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10 w-full'>
        <Card className='flex flex-col justify-between p-4 sm:p-6 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50'>
          <div className='flex justify-between items-start'>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-xs sm:text-sm font-medium text-gray-600'>Avg Daily Tasks Completion</span>
              <span className='text-2xl sm:text-3xl lg:text-4xl font-bold'>{avgCompletion}%</span>
              <span className='text-xs text-green-600 mt-1'>+5% from last week</span>
            </div>
            <div className='p-2 sm:p-3 bg-gray-200/50 rounded-full flex-shrink-0 ml-2'>
              <Target className='h-4 w-4 sm:h-6 sm:w-6 text-gray-700' />
            </div>
          </div>
        </Card>
        <Card className='flex flex-col justify-between p-4 sm:p-6 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl border border-white/50'>
          <div className='flex justify-between items-start'>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-xs sm:text-sm font-medium text-gray-600'>Tasks Pending</span>
              <span className='text-2xl sm:text-3xl lg:text-4xl font-bold'>{tasksPending}</span>
              <span className='text-xs text-transparent mt-1'>&nbsp;</span>
            </div>
            <div className='p-2 sm:p-3 bg-gray-200/50 rounded-full flex-shrink-0 ml-2'>
              <Clock className='h-4 w-4 sm:h-6 sm:w-6 text-gray-700' />
            </div>
          </div>
        </Card>
      </div>

      <Card className='rounded-2xl shadow-xl border-white/50 border bg-white/60 backdrop-blur-sm w-full min-w-0'>
        <CardContent className='p-4 sm:p-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3'>
            <h2 className='text-lg sm:text-xl font-semibold'>Tasks</h2>
            <div className='flex flex-wrap gap-2 justify-start sm:justify-end'>
              <Button
                variant='outline'
                size='sm'
                className='text-xs sm:text-sm px-3 py-2 rounded-full bg-transparent border-gray-300 hover:bg-gray-50'
              >
                Select Date
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='text-xs sm:text-sm px-3 py-2 rounded-full bg-transparent border-gray-300 hover:bg-gray-50'
              >
                All Tasks
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='text-xs sm:text-sm px-3 py-2 rounded-full bg-transparent border-gray-300 hover:bg-gray-50'
              >
                Pending
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='text-xs sm:text-sm px-3 py-2 rounded-full bg-transparent border-gray-300 hover:bg-gray-50'
              >
                Completed
              </Button>
            </div>
          </div>

          <div className='mb-6 sm:mb-8'>
            <h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4'>Mandatory tasks for the week</h3>
            <div className='flex flex-col gap-3 sm:gap-4'>
              {mandatoryTasks.map((task) => (
                <div
                  key={task.id}
                  className='border border-gray-200/60 rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-gray-50/30 transition-colors bg-transparent'
                  onClick={() => handleTaskCardClick(task)}
                >
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3'>
                    <div className='flex items-start gap-2 sm:gap-3 w-full min-w-0'>
                      <Checkbox checked={task.completed} disabled className='mt-0.5 flex-shrink-0' />
                      <div className='flex-1 min-w-0'>
                        <span className='font-semibold text-sm sm:text-base truncate block text-gray-800'>
                          {task.title}
                        </span>
                        <span className='block text-xs sm:text-sm text-gray-600'>Duration: {task.duration}</span>
                        {task.feedback && (
                          <span className='block text-xs text-gray-600 flex items-center gap-1 mt-1'>
                            Feedback <Info className='h-3 w-3' />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 mt-2 sm:mt-0'>
                      {task.mandatory && (
                        <Badge variant='outline' className='text-xs bg-red-100 text-red-700 border-red-200'>
                          Mandatory
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4'>Daily Tasks</h3>
            <div className='flex flex-col gap-3 sm:gap-4'>
              {dailyTasks.map((task) => (
                <div
                  key={task.id}
                  className='border border-gray-200/60 rounded-xl p-3 sm:p-4 cursor-pointer hover:bg-gray-50/30 transition-colors bg-transparent'
                  onClick={() => handleTaskCardClick(task)}
                >
                  <div className='flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3'>
                    <div className='flex items-center gap-2 sm:gap-3 w-full min-w-0'>
                      <Checkbox checked={task.completed} disabled className='flex-shrink-0' />
                      <div className='flex flex-col min-w-0 flex-1'>
                        <span className='font-semibold text-sm sm:text-base truncate text-gray-800'>{task.title}</span>
                        <span className='text-xs sm:text-sm text-gray-600'>Duration: {task.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className='max-w-sm sm:max-w-md p-6 sm:p-8 flex flex-col items-center rounded-2xl mx-4 bg-white/95 backdrop-blur-sm'>
          <DialogTitle asChild>
            <VisuallyHidden>Was this task helpful?</VisuallyHidden>
          </DialogTitle>
          <div className='text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center'>Was this task helpful?</div>
          <div className='flex items-center justify-center gap-6 sm:gap-8 mb-4 sm:mb-6'>
            <button
              aria-label='Happy'
              className={`rounded-full p-2 border-2 ${selectedFeedback === 'happy' ? 'border-black' : 'border-transparent'} transition`}
              onClick={() => handleFeedbackSelect('happy')}
            >
              <Smile className='w-8 h-8 sm:w-10 sm:h-10' />
            </button>
            <button
              aria-label='Neutral'
              className={`rounded-full p-2 border-2 ${selectedFeedback === 'neutral' ? 'border-black' : 'border-transparent'} transition`}
              onClick={() => handleFeedbackSelect('neutral')}
            >
              <Meh className='w-8 h-8 sm:w-10 sm:h-10' />
            </button>
            <button
              aria-label='Sad'
              className={`rounded-full p-2 border-2 ${selectedFeedback === 'sad' ? 'border-black' : 'border-transparent'} transition`}
              onClick={() => handleFeedbackSelect('sad')}
            >
              <Frown className='w-8 h-8 sm:w-10 sm:h-10' />
            </button>
          </div>
          <button
            className='w-full bg-black text-white rounded-full py-2 sm:py-3 text-sm sm:text-base font-medium disabled:opacity-50 transition'
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
