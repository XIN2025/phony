'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import { Star, Calendar, Target, Clock, Menu } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSidebar } from '@/context/SidebarContext';

interface ActionItem {
  id: string;
  description: string;
  target: string;
  frequency: string;
  isCompleted: boolean;
  category: string;
}

interface CompletionData {
  rating: number;
  journalEntry: string;
  achievedValue: string;
}

const ClientPage = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { setSidebarOpen } = useSidebar();
  const [selectedTask, setSelectedTask] = useState<ActionItem | null>(null);
  const [completionData, setCompletionData] = useState<CompletionData>({
    rating: 0,
    journalEntry: '',
    achievedValue: '',
  });

  const { data: todayTasks, isLoading } = useQuery({
    queryKey: ['today-tasks'],
    queryFn: async (): Promise<ActionItem[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [
        {
          id: '1',
          description: 'Spend Time Outdoors',
          target: '30 mins',
          frequency: '2/day',
          isCompleted: false,
          category: 'daily',
        },
        {
          id: '4',
          description: 'Sleep Routine',
          target: '8 hrs',
          frequency: '1/day',
          isCompleted: false,
          category: 'consistent',
        },
      ];
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
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

    completeTaskMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-sm text-muted-foreground'>Loading your daily plan...</p>
        </div>
      </div>
    );
  }

  const user = session?.user;
  const completedTasks = todayTasks?.filter((task) => task.isCompleted).length || 0;
  const totalTasks = todayTasks?.length || 0;

  if (!user) {
    return null;
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
              Welcome back, {user.firstName}!
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
            <div>
              <h2 className='text-xl font-semibold mb-4'>Daily Tasks</h2>
              <div className='space-y-3'>
                {todayTasks
                  ?.filter((task) => task.category === 'daily')
                  .map((task) => (
                    <Card
                      key={task.id}
                      className={
                        task.isCompleted
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                          : ''
                      }
                    >
                      <CardContent className='p-4 sm:p-6'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0'>
                          <div className='flex items-start gap-3 flex-1'>
                            <Checkbox
                              checked={task.isCompleted}
                              onCheckedChange={() => handleTaskToggle(task)}
                              disabled={task.isCompleted}
                              className='mt-1'
                            />
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium text-base sm:text-lg'>{task.description}</div>
                              <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1'>
                                <span className='flex items-center gap-1'>
                                  <Target className='h-3 w-3 flex-shrink-0' />
                                  {task.target}
                                </span>
                                <span className='flex items-center gap-1'>
                                  <Clock className='h-3 w-3 flex-shrink-0' />
                                  {task.frequency}
                                </span>
                              </div>
                            </div>
                          </div>
                          {task.isCompleted && (
                            <div className='text-green-600 text-sm font-medium flex items-center gap-1 sm:ml-4'>
                              <span className='text-lg'>✓</span>
                              <span className='hidden sm:inline'>Completed</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            <div>
              <h2 className='text-xl font-semibold mb-4'>Consistent Goals</h2>
              <div className='space-y-3'>
                {todayTasks
                  ?.filter((task) => task.category === 'consistent')
                  .map((task) => (
                    <Card
                      key={task.id}
                      className={
                        task.isCompleted
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                          : ''
                      }
                    >
                      <CardContent className='p-4 sm:p-6'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0'>
                          <div className='flex items-start gap-3 flex-1'>
                            <Checkbox
                              checked={task.isCompleted}
                              onCheckedChange={() => handleTaskToggle(task)}
                              disabled={task.isCompleted}
                              className='mt-1'
                            />
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium text-base sm:text-lg'>{task.description}</div>
                              <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1'>
                                <span className='flex items-center gap-1'>
                                  <Target className='h-3 w-3 flex-shrink-0' />
                                  {task.target}
                                </span>
                                <span className='flex items-center gap-1'>
                                  <Clock className='h-3 w-3 flex-shrink-0' />
                                  {task.frequency}
                                </span>
                              </div>
                            </div>
                          </div>
                          {task.isCompleted && (
                            <div className='text-green-600 text-sm font-medium flex items-center gap-1 sm:ml-4'>
                              <span className='text-lg'>✓</span>
                              <span className='hidden sm:inline'>Completed</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className='sm:max-w-md max-w-[95vw] mx-4'>
          <DialogHeader>
            <DialogTitle>How did that feel?</DialogTitle>
            <DialogDescription>
              Tell us about your experience completing &quot;{selectedTask?.description}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='rating'>Rate your experience (1-5)</Label>
              <div className='flex mt-1'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant='ghost'
                    size='icon'
                    onClick={() => setCompletionData((prev) => ({ ...prev, rating: star }))}
                  >
                    <Star
                      className={`h-6 w-6 ${completionData.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor='journal-entry'>Journal Entry</Label>
              <Textarea
                id='journal-entry'
                value={completionData.journalEntry}
                onChange={(e) => setCompletionData((prev) => ({ ...prev, journalEntry: e.target.value }))}
                placeholder='Write a few words about your experience...'
              />
            </div>
            <div>
              <Label htmlFor='achieved-value'>How much did you achieve?</Label>
              <Textarea
                id='achieved-value'
                value={completionData.achievedValue}
                onChange={(e) => setCompletionData((prev) => ({ ...prev, achievedValue: e.target.value }))}
                placeholder={`e.g., ${selectedTask?.target}`}
              />
            </div>
          </div>
          <div className='flex justify-end pt-4'>
            <Button onClick={handleCompleteTask} disabled={completeTaskMutation.isPending}>
              {completeTaskMutation.isPending ? 'Completing...' : 'Complete Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPage;
