'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import { Star, Calendar, Target, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const completedTasks = todayTasks?.filter((task) => task.isCompleted).length || 0;
  const totalTasks = todayTasks?.length || 0;

  return (
    <div className='container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl'>
      <div className='mb-6 sm:mb-8'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>
          Welcome back, {user.firstName}!
        </h1>
        <p className='text-gray-600 dark:text-gray-400 mt-2'>Here&apos;s your plan for today</p>
      </div>

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
                    task.isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : ''
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
                    task.isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : ''
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
              <Label>How would you rate this experience?</Label>
              <div className='flex gap-1 mt-2 justify-center sm:justify-start'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setCompletionData((prev) => ({ ...prev, rating: star }))}
                    className={`p-1 ${completionData.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className='h-6 w-6 fill-current' />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor='achieved'>What did you actually achieve?</Label>
              <input
                id='achieved'
                type='text'
                placeholder={selectedTask?.target}
                value={completionData.achievedValue}
                onChange={(e) => setCompletionData((prev) => ({ ...prev, achievedValue: e.target.value }))}
                className='w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <Label htmlFor='journal'>How did it feel? (optional)</Label>
              <Textarea
                id='journal'
                placeholder='Share your thoughts about this activity...'
                value={completionData.journalEntry}
                onChange={(e) => setCompletionData((prev) => ({ ...prev, journalEntry: e.target.value }))}
                className='mt-1'
                rows={3}
              />
            </div>

            <div className='flex gap-2 pt-4'>
              <Button variant='outline' onClick={() => setSelectedTask(null)} className='flex-1'>
                Cancel
              </Button>
              <Button onClick={handleCompleteTask} disabled={completeTaskMutation.isPending} className='flex-1'>
                {completeTaskMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPage;
