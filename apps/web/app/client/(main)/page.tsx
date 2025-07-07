'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import { Star, Calendar, Target, Clock, Menu, AlertCircle, Info, ExternalLink, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSidebar } from '@/context/SidebarContext';
import Link from 'next/link';
import { Badge } from '@repo/ui/components/badge';
import { useGetClientPlans, useCompleteActionItem } from '@/lib/hooks/use-api';

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

  const user = session?.user;
  const completedTasks = sortedTasks.filter((task) => task.isCompleted).length;
  const totalTasks = sortedTasks.length;
  const mandatoryTasks = sortedTasks.filter((task) => task.isMandatory);

  if (plansError) {
    return (
      <div className='flex h-full w-full flex-col'>
        <div className='p-4 sm:p-6 border-b border-border/60 bg-muted/5 flex-shrink-0'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='icon' className='lg:hidden' onClick={() => setSidebarOpen(true)}>
              <Menu className='h-6 w-6' />
              <span className='sr-only'>Toggle sidebar</span>
            </Button>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>
                Welcome back, {user?.firstName}!
              </h1>
              <p className='text-gray-600 dark:text-gray-400 mt-2'>Here&apos;s your plan for today</p>
            </div>
          </div>
        </div>
        <div className='flex-1 overflow-auto p-4 sm:p-6'>
          <div className='mx-auto max-w-4xl'>
            <Card className='border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800'>
              <CardContent className='p-6 text-center'>
                <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-red-800 dark:text-red-200 mb-2'>Failed to load your tasks</h3>
                <p className='text-red-600 dark:text-red-300 mb-4'>
                  There was an error loading your action items. Please try again.
                </p>
                <Button onClick={() => refetchPlans()} className='flex items-center gap-2'>
                  <RefreshCw className='h-4 w-4' />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='p-4 sm:p-6 border-b border-border/60 bg-muted/5 flex-shrink-0'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' className='lg:hidden' onClick={() => setSidebarOpen(true)}>
            <Menu className='h-6 w-6' />
            <span className='sr-only'>Toggle sidebar</span>
          </Button>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>
              Welcome back, {user?.firstName}!
            </h1>
            <p className='text-gray-600 dark:text-gray-400 mt-2'>Here&apos;s your plan for today</p>
          </div>
        </div>
      </div>
      <div className='flex-1 overflow-auto p-4 sm:p-6'>
        <div className='mx-auto max-w-4xl'>
          {plansLoading && (
            <div className='mb-6'>
              <Card>
                <CardContent className='p-6 text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
                  <p className='text-gray-600'>Loading your tasks...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Progress Card */}
          {!plansLoading && (
            <div className='mb-6'>
              <Card>
                <CardHeader className='pb-3 sm:pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
                    <Calendar className='h-5 w-5' />
                    Today&apos;s Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0'>
                    <div className='text-center sm:text-left'>
                      <div className='text-3xl sm:text-4xl font-bold'>
                        {completedTasks}/{totalTasks}
                      </div>
                      <div className='text-sm text-muted-foreground'>Tasks completed</div>
                    </div>
                    <div className='text-center sm:text-right'>
                      <div className='text-3xl sm:text-4xl font-bold'>
                        {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                      </div>
                      <div className='text-sm text-muted-foreground'>Completion rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!plansLoading && (
            <div className='space-y-6 sm:space-y-8'>
              {mandatoryTasks.length > 0 && (
                <div>
                  <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                    <AlertCircle className='h-5 w-5 text-red-500' />
                    Priority Tasks
                  </h2>
                  <div className='space-y-3'>
                    {mandatoryTasks.map((task) => (
                      <Card
                        key={task.id}
                        className={
                          task.isCompleted
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                        }
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-start gap-3'>
                            <Checkbox
                              checked={task.isCompleted}
                              onCheckedChange={() => handleTaskToggle(task)}
                              disabled={task.isCompleted}
                            />
                            <div className='flex-1'>
                              <div className='flex items-start justify-between'>
                                <div className='flex-1'>
                                  <h3 className='font-medium text-sm sm:text-base'>{task.description}</h3>
                                  <div className='flex flex-wrap gap-2 mt-2'>
                                    {task.category && (
                                      <Badge variant='secondary' className='text-xs'>
                                        {task.category}
                                      </Badge>
                                    )}
                                    {task.target && (
                                      <Badge variant='outline' className='text-xs'>
                                        {task.target}
                                      </Badge>
                                    )}
                                    <Badge variant='destructive' className='text-xs'>
                                      Priority
                                    </Badge>
                                  </div>
                                  {task.whyImportant && (
                                    <p className='text-xs text-muted-foreground mt-2'>
                                      <strong>Why important:</strong> {task.whyImportant}
                                    </p>
                                  )}
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Target className='h-4 w-4 text-muted-foreground' />
                                  <span className='text-xs text-muted-foreground'>
                                    {task.weeklyRepetitions || 1}x/week
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className='text-xl font-semibold mb-4'>Daily Tasks</h2>
                <div className='space-y-3'>
                  {sortedTasks
                    .filter((task) => !task.isMandatory)
                    .map((task) => (
                      <Card
                        key={task.id}
                        className={
                          task.isCompleted
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : 'bg-background border-border'
                        }
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-start gap-3'>
                            <Checkbox
                              checked={task.isCompleted}
                              onCheckedChange={() => handleTaskToggle(task)}
                              disabled={task.isCompleted}
                            />
                            <div className='flex-1'>
                              <div className='flex items-start justify-between'>
                                <div className='flex-1'>
                                  <h3 className='font-medium text-sm sm:text-base'>{task.description}</h3>
                                  <div className='flex flex-wrap gap-2 mt-2'>
                                    {task.category && (
                                      <Badge variant='secondary' className='text-xs'>
                                        {task.category}
                                      </Badge>
                                    )}
                                    {task.target && (
                                      <Badge variant='outline' className='text-xs'>
                                        {task.target}
                                      </Badge>
                                    )}
                                  </div>
                                  {task.whyImportant && (
                                    <p className='text-xs text-muted-foreground mt-2'>
                                      <strong>Why important:</strong> {task.whyImportant}
                                    </p>
                                  )}
                                  {task.resources && task.resources.length > 0 && (
                                    <div className='flex gap-2 mt-2'>
                                      {task.resources.map((resource, index) => (
                                        <Button
                                          key={index}
                                          variant='outline'
                                          size='sm'
                                          className='h-6 text-xs'
                                          onClick={() => window.open(resource.url, '_blank')}
                                        >
                                          <ExternalLink className='h-3 w-3 mr-1' />
                                          {resource.title || 'Resource'}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Target className='h-4 w-4 text-muted-foreground' />
                                  <span className='text-xs text-muted-foreground'>
                                    {task.weeklyRepetitions || 1}x/week
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {sortedTasks.length === 0 && !plansLoading && (
                <Card>
                  <CardContent className='p-6 text-center'>
                    <Target className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-semibold text-gray-600 mb-2'>No tasks available</h3>
                    <p className='text-gray-500'>
                      You don&apos;t have any action items assigned yet. Check back later or contact your practitioner.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>Mark this task as complete and provide feedback.</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className='space-y-6'>
              <div>
                <h3 className='font-medium mb-2'>{selectedTask.description}</h3>
                {selectedTask.recommendedActions && (
                  <div className='bg-muted p-3 rounded-lg mb-4'>
                    <h4 className='font-medium text-sm mb-2'>Recommended Steps:</h4>
                    <pre className='text-sm whitespace-pre-wrap'>{selectedTask.recommendedActions}</pre>
                  </div>
                )}
                {selectedTask.toolsToHelp && (
                  <div className='bg-blue-50 p-3 rounded-lg mb-4'>
                    <h4 className='font-medium text-sm mb-2 flex items-center gap-1'>
                      <Info className='h-4 w-4' />
                      Tools to Help:
                    </h4>
                    <div className='text-sm space-y-1'>
                      {selectedTask.toolsToHelp
                        .split('\n')
                        .filter((line) => line.trim())
                        .map((line, index) => {
                          const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                          if (urlMatch) {
                            const url = urlMatch[1];
                            const description = line
                              .replace(url || '', '')
                              .replace(/\s*-\s*$/, '')
                              .trim();
                            return (
                              <div key={index}>
                                <a
                                  href={url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:text-blue-800 underline'
                                >
                                  {description}
                                </a>
                              </div>
                            );
                          }
                          return <div key={index}>{line}</div>;
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className='space-y-4'>
                <div>
                  <Label htmlFor='rating'>How helpful was this task? (1-5 stars)</Label>
                  <div className='flex gap-1 mt-2'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant='ghost'
                        size='sm'
                        onClick={() => setCompletionData({ ...completionData, rating: star })}
                        className={completionData.rating >= star ? 'text-yellow-500' : 'text-gray-300'}
                      >
                        <Star className='h-5 w-5 fill-current' />
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor='journalEntry'>How did it go? (Optional)</Label>
                  <Textarea
                    id='journalEntry'
                    value={completionData.journalEntry}
                    onChange={(e) => setCompletionData({ ...completionData, journalEntry: e.target.value })}
                    placeholder='Share your experience with this task...'
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor='achievedValue'>What did you achieve? (Optional)</Label>
                  <Textarea
                    id='achievedValue'
                    value={completionData.achievedValue}
                    onChange={(e) => setCompletionData({ ...completionData, achievedValue: e.target.value })}
                    placeholder='Describe what you accomplished...'
                    rows={2}
                  />
                </div>
              </div>

              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setSelectedTask(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCompleteTask} disabled={completeTaskMutation.isPending}>
                  {completeTaskMutation.isPending ? 'Completing...' : 'Mark Complete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPage;
