'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TaskEditorDialog } from '@/components/practitioner/TaskEditorDialog';

// TODO: Replace with real data fetching
const mockStats = {
  pending: 2,
  engagement: 'Medium',
};
const mockMandatoryTasks = [
  { id: 1, description: 'Stroll outside in the sun', duration: '15 Minutes', completed: true },
  { id: 2, description: 'Talk to a parent', duration: '15 Minutes', completed: false },
  { id: 3, description: 'Read 10 pages', duration: '15 Minutes', completed: false },
];
const mockDailyTasks = [
  { id: 1, description: 'Yoga', duration: '30 Minutes', completed: false },
  { id: 2, description: 'Meditation', duration: '15 Minutes', completed: false },
  { id: 3, description: 'Sleep', duration: '8 hours', completed: true },
];

export default function TaskDetailsPage({ params }: { params: Promise<{ clientId: string; date: string }> }) {
  const router = useRouter();
  const { clientId, date } = React.use(params);

  // Modal state
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);

  // Helper to open modal with task details
  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  // Helper to map mock task to TaskEditorDialog shape
  const mapTaskToEditorDialog = (task: any) => ({
    description: task.description,
    duration: task.duration,
    isMandatory: task.isMandatory || false,
    frequency: 'Daily',
    daysOfWeek: task.daysOfWeek || [],
    whyImportant: task.whyImportant || '',
    recommendedActions: task.recommendedActions || '',
    toolsToHelp: task.toolsToHelp || [],
    resources: task.resources || [],
  });

  return (
    <div className='w-full min-h-screen flex flex-col items-stretch pt-2 px-0 '>
      {/* Back Button */}
      <div className='w-full mb-2 px-2'>
        <button
          type='button'
          aria-label='Back'
          onClick={() => router.back()}
          className='text-muted-foreground hover:text-foreground focus:outline-none'
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
        </button>
      </div>
      <div className='w-full flex flex-col gap-8 px-2 pr-4'>
        {/* Header row: title and date pill */}
        <div className='flex flex-row items-center justify-between mb-2'>
          <h1 className='text-2xl font-bold'>Tasks</h1>
          <div className='bg-white rounded-full border border-gray-200 px-6 py-2 text-base font-medium flex items-center gap-2 shadow-sm'>
            <span role='img' aria-label='calendar'>
              📅
            </span>
            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div className='flex flex-row gap-6 mb-6'>
          <div className='flex-1'>
            <div className='bg-white rounded-2xl shadow-md p-8 flex flex-col items-start'>
              <div className='text-4xl font-extrabold mb-1'>{mockStats.pending}</div>
              <div className='text-lg font-semibold text-gray-700'>Tasks Pending</div>
            </div>
          </div>
          <div className='flex-1'>
            <div className='bg-white rounded-2xl shadow-md p-8 flex flex-col items-start'>
              <div className='text-3xl font-bold mb-1'>Medium</div>
              <div className='text-lg font-semibold text-gray-700'>Avg Engagement</div>
            </div>
          </div>
        </div>
        <div className='flex flex-row gap-8 w-full'>
          {/* Mandatory Tasks Card */}
          <div className='flex-1'>
            <div className='bg-white rounded-2xl shadow-md p-8'>
              <div className='text-xl font-bold mb-4'>Mandatory tasks for the week</div>
              <div className='flex flex-col gap-0'>
                {mockMandatoryTasks.length === 0 ? (
                  <div className='text-muted-foreground text-sm mb-4 px-6 py-6'>No mandatory tasks.</div>
                ) : (
                  mockMandatoryTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 py-4 ${idx !== mockMandatoryTasks.length - 1 ? 'border-b border-[#ececec]' : ''} cursor-pointer hover:bg-gray-50 rounded-lg transition-colors`}
                      onClick={() => handleTaskClick(task)}
                    >
                      <Checkbox checked={task.completed} disabled className='mt-0.5 scale-110' />
                      <div className='flex-1'>
                        <div
                          className={`font-medium text-base flex items-center gap-2 ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {task.description}
                          <span className='ml-1 text-gray-400 text-xs' title='Info'>
                            ⓘ
                          </span>
                        </div>
                        <div className='text-xs text-muted-foreground mt-1 flex items-center gap-2'>
                          <span role='img' aria-label='timer'>
                            ⏱
                          </span>{' '}
                          {task.duration}
                        </div>
                      </div>
                      {task.completed && (
                        <span className='ml-2 text-2xl' role='img' aria-label='smile'>
                          😊
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* Daily Tasks Card */}
          <div className='flex-1'>
            <div className='bg-white rounded-2xl shadow-md p-8'>
              <div className='text-xl font-bold mb-4'>Daily Tasks</div>
              <div className='flex flex-col gap-0'>
                {mockDailyTasks.length === 0 ? (
                  <div className='text-muted-foreground text-sm mb-4 px-6 py-6'>No daily tasks.</div>
                ) : (
                  mockDailyTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 py-4 ${idx !== mockDailyTasks.length - 1 ? 'border-b border-[#ececec]' : ''} cursor-pointer hover:bg-gray-50 rounded-lg transition-colors`}
                      onClick={() => handleTaskClick(task)}
                    >
                      <Checkbox checked={task.completed} disabled className='mt-0.5 scale-110' />
                      <div className='flex-1'>
                        <div
                          className={`font-medium text-base flex items-center gap-2 ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {task.description}
                          <span className='ml-1 text-gray-400 text-xs' title='Info'>
                            ⓘ
                          </span>
                        </div>
                        <div className='text-xs text-muted-foreground mt-1 flex items-center gap-2'>
                          <span role='img' aria-label='timer'>
                            ⏱
                          </span>{' '}
                          {task.duration}
                        </div>
                      </div>
                      {task.completed && (
                        <span className='ml-2 text-2xl' role='img' aria-label='smile'>
                          😊
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskEditorDialog
          open={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={() => {}}
          initialValues={mapTaskToEditorDialog(selectedTask)}
          readOnly={true}
        />
      )}
    </div>
  );
}
