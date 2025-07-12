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
  CheckCircle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSidebar } from '@/context/SidebarContext';
import Link from 'next/link';
import { Badge } from '@repo/ui/components/badge';
import {
  useGetClientPlans,
  useCompleteActionItem,
  useGetCurrentUser,
  useUndoTaskCompletion,
} from '@/lib/hooks/use-api';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { TaskEditorDialog } from '@/components/practitioner/TaskEditorDialog';
import { toast } from 'sonner';

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
  const undoTaskCompletionMutation = useUndoTaskCompletion();

  const handleTaskToggle = async (task: ActionItem) => {
    if (task.isCompleted) {
      // Task is already completed
      return;
    }

    try {
      await completeTaskMutation.mutateAsync({
        taskId: task.id,
        completionData: {
          clientId: session?.user?.id || '',
          rating: 5, // Default rating
          journalEntry: '', // Could add a modal for this
          achievedValue: '', // Could add a modal for this
        },
      });
      toast.success('Task marked as completed!');
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task. Please try again.');
    }
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

  useEffect(() => {}, [status, session]);

  useEffect(() => {}, [session, status]);

  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center min-h-screen p-4'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className='flex items-center justify-center min-h-screen p-4'>
        <div className='text-center'>
          <p className='text-gray-600'>Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser();

  const completedTasks = sortedTasks.filter((task) => task.isCompleted);
  const avgCompletion = sortedTasks.length > 0 ? Math.round((completedTasks.length / sortedTasks.length) * 100) : 0;
  const tasksPending = sortedTasks.filter((task) => !task.isCompleted).length;

  const mandatoryTasks = sortedTasks.filter((task) => task.isMandatory);
  const dailyTasks = sortedTasks.filter((task) => !task.isMandatory);

  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<ActionItem | null>(null);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<'happy' | 'neutral' | 'sad' | null>(null);
  const [taskForFeedback, setTaskForFeedback] = useState<ActionItem | null>(null);

  const handleTaskDetailClick = (task: ActionItem) => {
    setSelectedTaskForDetail(task);
    setIsTaskDetailOpen(true);
  };

  const handleTaskToggleWithFeedback = async (task: ActionItem) => {
    if (task.isCompleted) {
      // If task is already completed, allow undoing it
      try {
        await undoTaskCompletionMutation.mutateAsync({
          taskId: task.id,
          clientId: session?.user?.id || '',
        });
        toast.success('Task marked as incomplete!');
      } catch (error) {
        console.error('Failed to undo task completion:', error);
        toast.error('Failed to undo task completion. Please try again.');
      }
      return;
    }

    // Show feedback modal first
    setTaskForFeedback(task);
    setFeedbackOpen(true);
    setSelectedFeedback(null);
  };

  const handleFeedbackSelect = (type: 'happy' | 'neutral' | 'sad') => {
    setSelectedFeedback(type);
  };

  const handleFeedbackSubmit = async () => {
    if (!taskForFeedback || !selectedFeedback) return;

    try {
      await completeTaskMutation.mutateAsync({
        taskId: taskForFeedback.id,
        completionData: {
          clientId: session?.user?.id || '',
          rating: selectedFeedback === 'happy' ? 5 : selectedFeedback === 'neutral' ? 3 : 1,
          journalEntry: '', // Could add a text input for this
          achievedValue: '', // Could add a text input for this
        },
      });
      toast.success('Task marked as completed!');
      setFeedbackOpen(false);
      setSelectedFeedback(null);
      setTaskForFeedback(null);
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task. Please try again.');
    }
  };

  return (
    <div className='flex flex-col w-full min-h-screen'>
      {/* Header Section */}
      <div className='px-4 py-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            <SidebarToggleButton />
            <div className='min-w-0 flex-1'>
              <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate'>
                {userLoading ? 'Loading...' : `Good Morning ${currentUser?.firstName || 'User'}`}
              </h1>
              <p className='text-sm text-gray-600 hidden sm:block'>Let's make today productive!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 px-4 py-4 sm:px-6 lg:px-8  mx-auto w-full'>
        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
          <Card className='bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer'>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex flex-col min-w-0 flex-1'>
                  <span className='text-xs sm:text-sm font-semibold text-blue-700 mb-1'>Task Completion</span>
                  <span className='text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900'>{avgCompletion}%</span>
                  <span className='text-xs text-green-600 mt-1 flex items-center gap-1'>
                    <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
                    +5% from last week
                  </span>
                </div>
                <div className='p-2 sm:p-3 bg-blue-500/20 rounded-full flex-shrink-0 ml-2'>
                  <Target className='h-4 w-4 sm:h-5 sm:w-5 text-blue-700' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer'>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex flex-col min-w-0 flex-1'>
                  <span className='text-xs sm:text-sm font-semibold text-purple-700 mb-1'>Tasks Pending</span>
                  <span className='text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-900'>{tasksPending}</span>
                  <span className='text-xs text-purple-600 mt-1 flex items-center gap-1'>
                    <span className='w-1.5 h-1.5 bg-purple-500 rounded-full'></span>
                    Ready to tackle
                  </span>
                </div>
                <div className='p-2 sm:p-3 bg-purple-500/20 rounded-full flex-shrink-0 ml-2'>
                  <Clock className='h-4 w-4 sm:h-5 sm:w-5 text-purple-700' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Container */}
        <Card className='shadow-sm border border-gray-200'>
          <CardContent className='p-4 sm:p-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4'>
              <div>
                <h2 className='text-lg sm:text-xl font-bold text-gray-900 mb-1'>Your Tasks</h2>
                <p className='text-sm text-gray-600'>Manage your daily activities and goals</p>
              </div>
              <div className='flex flex-wrap gap-2 justify-start sm:justify-end'>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-xs px-3 py-2 rounded-full bg-white border-gray-300 hover:bg-gray-50'
                >
                  Select Date
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-xs px-3 py-2 rounded-full bg-white border-gray-300 hover:bg-gray-50'
                >
                  All Tasks
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-xs px-3 py-2 rounded-full bg-white border-gray-300 hover:bg-gray-50'
                >
                  Pending
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='text-xs px-3 py-2 rounded-full bg-white border-gray-300 hover:bg-gray-50'
                >
                  Completed
                </Button>
              </div>
            </div>

            {/* Mandatory Tasks */}
            {mandatoryTasks.length > 0 && (
              <div className='mb-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='p-1.5 bg-red-100 rounded-lg'>
                    <Star className='w-4 h-4 text-red-600' />
                  </div>
                  <div>
                    <h3 className='text-base sm:text-lg font-bold text-gray-900'>Mandatory Tasks</h3>
                    <p className='text-xs sm:text-sm text-gray-600'>Essential tasks for this week</p>
                  </div>
                </div>
                <div className='space-y-3'>
                  {mandatoryTasks.map((task) => (
                    <div
                      key={task.id}
                      className='group border border-gray-200 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-blue-50/50 transition-all duration-200 shadow-sm hover:shadow-md'
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('[data-checkbox]')) {
                          handleTaskDetailClick(task);
                        }
                      }}
                    >
                      <div className='flex items-start gap-3'>
                        <Checkbox
                          checked={task.isCompleted}
                          onCheckedChange={() => handleTaskToggleWithFeedback(task)}
                          className='mt-0.5 flex-shrink-0'
                          data-checkbox='true'
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-2'>
                            <span
                              className={`font-semibold text-sm sm:text-base leading-relaxed ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}
                            >
                              {task.description}
                            </span>
                            <div className='flex items-center gap-1 flex-shrink-0'>
                              {task.isMandatory && (
                                <Badge variant='outline' className='text-xs bg-red-100 text-red-700 border-red-200'>
                                  <Star className='w-3 h-3 mr-1' />
                                  Required
                                </Badge>
                              )}
                              {task.isCompleted && (
                                <Badge
                                  variant='default'
                                  className='text-xs bg-green-100 text-green-700 border-green-200'
                                >
                                  <CheckCircle className='w-3 h-3 mr-1' />
                                  Done
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className='flex items-center gap-2 mt-1'>
                            <Clock className='w-3 h-3 text-gray-500' />
                            <span className='text-xs text-gray-600'>{task.frequency || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Tasks */}
            {dailyTasks.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='p-1.5 bg-green-100 rounded-lg'>
                    <Target className='w-4 h-4 text-green-600' />
                  </div>
                  <div>
                    <h3 className='text-base sm:text-lg font-bold text-gray-900'>Daily Tasks</h3>
                    <p className='text-xs sm:text-sm text-gray-600'>Regular activities and goals</p>
                  </div>
                </div>
                <div className='space-y-3'>
                  {dailyTasks.map((task) => (
                    <div
                      key={task.id}
                      className='group border border-gray-200 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-green-50/50 transition-all duration-200 shadow-sm hover:shadow-md'
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('[data-checkbox]')) {
                          handleTaskDetailClick(task);
                        }
                      }}
                    >
                      <div className='flex items-start gap-3'>
                        <Checkbox
                          checked={task.isCompleted}
                          onCheckedChange={() => handleTaskToggleWithFeedback(task)}
                          className='mt-0.5 flex-shrink-0'
                          data-checkbox='true'
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-2'>
                            <span
                              className={`font-semibold text-sm sm:text-base leading-relaxed ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}
                            >
                              {task.description}
                            </span>
                            {task.isCompleted && (
                              <Badge
                                variant='default'
                                className='text-xs bg-green-100 text-green-700 border-green-200 flex-shrink-0'
                              >
                                <CheckCircle className='w-3 h-3 mr-1' />
                                Done
                              </Badge>
                            )}
                          </div>
                          <div className='flex items-center gap-2 mt-1'>
                            <Clock className='w-3 h-3 text-gray-500' />
                            <span className='text-xs text-gray-600'>{task.frequency || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {mandatoryTasks.length === 0 && dailyTasks.length === 0 && (
              <div className='text-center py-8'>
                <div className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Target className='w-8 h-8 text-gray-400' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>No tasks yet</h3>
                <p className='text-sm text-gray-600'>Your practitioner will assign tasks for you soon.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskForDetail && (
        <TaskEditorDialog
          open={isTaskDetailOpen}
          onClose={() => setIsTaskDetailOpen(false)}
          onSave={() => {}}
          initialValues={{
            description: selectedTaskForDetail.description,
            category: selectedTaskForDetail.category || '',
            frequency: selectedTaskForDetail.frequency || '',
            weeklyRepetitions: selectedTaskForDetail.weeklyRepetitions || 1,
            daysOfWeek: [], // Not available in ActionItem interface
            whyImportant: selectedTaskForDetail.whyImportant || '',
            recommendedActions: selectedTaskForDetail.recommendedActions || '',
            toolsToHelp: selectedTaskForDetail.toolsToHelp || '',
            resources: selectedTaskForDetail.resources || [],
          }}
          readOnly={true}
        />
      )}

      {/* Feedback Modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className='w-[95vw] max-w-[95vw] sm:max-w-md p-4 sm:p-6 flex flex-col items-center rounded-2xl overflow-y-auto max-h-[90vh] border border-gray-200 shadow-xl'>
          <DialogTitle asChild>
            <VisuallyHidden>Was this task helpful?</VisuallyHidden>
          </DialogTitle>
          <div className='text-center w-full mb-4 sm:mb-6'>
            <div className='text-lg sm:text-xl font-bold text-gray-900 mb-2'>How was this task?</div>
            <p className='text-sm text-gray-600'>Your feedback helps us improve your experience</p>
          </div>
          <div className='flex flex-row items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6 w-full'>
            <button
              aria-label='Happy'
              className={`rounded-full p-3 sm:p-4 border-2 transition-all duration-200 hover:scale-105 ${
                selectedFeedback === 'happy'
                  ? 'border-green-500 bg-green-50 shadow-lg'
                  : 'border-gray-300 hover:border-green-300 hover:bg-green-50/50'
              }`}
              onClick={() => handleFeedbackSelect('happy')}
            >
              <Smile className='w-8 h-8 sm:w-10 sm:h-10 text-green-600' />
            </button>
            <button
              aria-label='Neutral'
              className={`rounded-full p-3 sm:p-4 border-2 transition-all duration-200 hover:scale-105 ${
                selectedFeedback === 'neutral'
                  ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                  : 'border-gray-300 hover:border-yellow-300 hover:bg-yellow-50/50'
              }`}
              onClick={() => handleFeedbackSelect('neutral')}
            >
              <Meh className='w-8 h-8 sm:w-10 sm:h-10 text-yellow-600' />
            </button>
            <button
              aria-label='Sad'
              className={`rounded-full p-3 sm:p-4 border-2 transition-all duration-200 hover:scale-105 ${
                selectedFeedback === 'sad'
                  ? 'border-red-500 bg-red-50 shadow-lg'
                  : 'border-gray-300 hover:border-red-300 hover:bg-red-50/50'
              }`}
              onClick={() => handleFeedbackSelect('sad')}
            >
              <Frown className='w-8 h-8 sm:w-10 sm:h-10 text-red-600' />
            </button>
          </div>
          <button
            className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full py-3 sm:py-4 text-sm sm:text-base font-semibold disabled:opacity-50 transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transform hover:scale-[1.02]'
            onClick={handleFeedbackSubmit}
            disabled={!selectedFeedback}
          >
            Submit Feedback
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPage;
