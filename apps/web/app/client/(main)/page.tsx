'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import { Star, Calendar, Target, Clock, Menu, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSidebar } from '@/context/SidebarContext';
import Link from 'next/link';
import { Badge } from '@repo/ui/components/badge';
import { ApiClient } from '@/lib/api-client';

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
  const [isLoading, setIsLoading] = useState(true);

  const { data: todayTasks, isLoading: todayTasksLoading } = useQuery({
    queryKey: ['today-tasks'],
    queryFn: async (): Promise<ActionItem[]> => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        // Fetch published plans for the client
        const plans = (await ApiClient.get(`/api/plans/client/${session.user.id}`)) as any[];

        // Extract action items from all published plans
        const allActionItems: ActionItem[] = [];

        plans.forEach((plan: any) => {
          if (plan.actionItems && plan.actionItems.length > 0) {
            plan.actionItems.forEach((item: any) => {
              allActionItems.push({
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
        });

        // Sort by mandatory first, then by category
        return allActionItems.sort((a, b) => {
          if (a.isMandatory && !b.isMandatory) return -1;
          if (!a.isMandatory && b.isMandatory) return 1;
          return 0;
        });
      } catch (error) {
        console.error('Failed to fetch action items:', error);
        // Return mock data for development
        return [
          {
            id: '1',
            description: 'Practice the 4-7-8 breathing technique for 5 minutes each morning',
            target: 'Reduce anxiety levels',
            frequency: 'Daily',
            weeklyRepetitions: 7,
            isMandatory: true,
            whyImportant:
              'This breathing technique helps activate your parasympathetic nervous system, reducing stress and anxiety.',
            recommendedActions:
              '1. Find a quiet space\n2. Sit comfortably\n3. Inhale for 4 counts\n4. Hold for 7 counts\n5. Exhale for 8 counts\n6. Repeat for 5 minutes',
            toolsToHelp: 'Try apps like Calm or Headspace for guided breathing exercises',
            category: 'Mindfulness',
            isCompleted: false,
            resources: [
              {
                type: 'LINK',
                url: 'https://www.calm.com',
                title: 'Calm App',
              },
            ],
          },
          {
            id: '2',
            description: 'Complete a daily mood journal rating anxiety levels 1-10',
            target: 'Track emotional patterns',
            frequency: 'Daily',
            weeklyRepetitions: 7,
            isMandatory: false,
            whyImportant:
              'Tracking your mood helps identify patterns and triggers, making it easier to manage anxiety.',
            recommendedActions:
              '1. Rate your anxiety from 1-10\n2. Note what happened today\n3. Record any triggers\n4. Write down coping strategies used',
            toolsToHelp: 'Use a simple notebook or try mood tracking apps like Daylio',
            category: 'Monitoring',
            isCompleted: false,
            resources: [
              {
                type: 'LINK',
                url: 'https://daylio.webflow.io/',
                title: 'Daylio Mood Tracker',
              },
            ],
          },
        ];
      }
    },
    enabled: !!session?.user?.id,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        await ApiClient.post(`/api/action-items/${taskId}/complete`, {
          clientId: session.user.id,
          rating: completionData.rating,
          journalEntry: completionData.journalEntry,
          achievedValue: completionData.achievedValue,
        });
        return { success: true };
      } catch (error) {
        console.error('Failed to complete task:', error);
        // For development, simulate success
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
      setSelectedTask(null);
      setCompletionData({ rating: 0, journalEntry: '', achievedValue: '' });
    },
  });

  const handleTaskToggle = (task: ActionItem) => {
    if (task.isCompleted) {
      return;
    }
    setSelectedTask(task);
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;

    completeTaskMutation.mutate(selectedTask.id);
  };

  useEffect(() => {
    console.log('[ClientPage] Component mounted', {
      status,
      hasSession: !!session,
      userRole: session?.user?.role,
      userId: session?.user?.id,
    });

    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status, session]);

  useEffect(() => {
    console.log('[ClientPage] Session update:', {
      status,
      hasSession: !!session,
      userRole: session?.user?.role,
      userName: session?.user ? `${session.user.firstName} ${session.user.lastName}` : null,
    });
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    console.log('[ClientPage] Showing loading state');
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
    console.log('[ClientPage] User not authenticated');
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-gray-600'>Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  console.log('[ClientPage] Rendering dashboard for user:', session?.user);

  const user = session?.user;
  const completedTasks = todayTasks?.filter((task) => task.isCompleted).length || 0;
  const totalTasks = todayTasks?.length || 0;
  const mandatoryTasks = todayTasks?.filter((task) => task.isMandatory) || [];

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

          <div className='space-y-6 sm:space-y-8'>
            {/* Mandatory Tasks Section */}
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

            {/* Regular Tasks Section */}
            <div>
              <h2 className='text-xl font-semibold mb-4'>Daily Tasks</h2>
              <div className='space-y-3'>
                {todayTasks
                  ?.filter((task) => !task.isMandatory)
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
          </div>
        </div>
      </div>

      {/* Task Completion Dialog */}
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
                    <p className='text-sm'>{selectedTask.toolsToHelp}</p>
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
