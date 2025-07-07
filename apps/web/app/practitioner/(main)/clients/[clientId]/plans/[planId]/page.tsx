'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { useGetPlan } from '@/lib/hooks/use-api';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Edit2, FileText, ArrowLeft } from 'lucide-react';
import { TaskEditorDialog } from '@/components/practitioner/TaskEditorDialog';

export default function ActionPlanSummaryPage({ params }: { params: Promise<{ clientId: string; planId: string }> }) {
  const { clientId, planId } = use(params);
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const DAYS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];

  const { data: plan, isLoading } = useGetPlan(planId);

  if (isLoading) {
    return <div className='flex justify-center items-center h-96'>Loading...</div>;
  }
  if (!plan) {
    return <div className='text-center text-red-500 mt-10'>Plan not found.</div>;
  }

  if (plan.status === 'DRAFT') {
    return (
      <div className='flex flex-col justify-center items-center h-96 gap-4'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Plan is in Draft Mode</h2>
          <p className='text-gray-600 mb-4'>This plan hasn't been published yet.</p>
          <Button
            onClick={() => router.push(`/practitioner/clients/${clientId}/dashboard?editPlan=${planId}`)}
            className='bg-primary text-white rounded-full px-6 py-2'
          >
            Edit Plan
          </Button>
        </div>
      </div>
    );
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function formatTime(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className='w-full min-h-screen bg-white flex flex-col'>
      <div className='flex flex-col flex-1 w-full max-w-[1300px] mx-auto'>
        <div className='flex items-center justify-between pt-8 pb-4'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              className='h-10 w-10 rounded-full border border-gray-300 hover:bg-gray-100 p-0'
              onClick={() => router.back()}
              aria-label='Back'
            >
              <ArrowLeft className='h-5 w-5' />
            </Button>
            <div className='flex flex-col gap-0'>
              <h1 className='text-3xl font-bold mb-0 leading-tight'>Action Plan</h1>
              <div className='flex flex-row flex-wrap gap-2 text-gray-700 text-lg mt-1 font-medium'>
                <span>{plan.session?.title || plan.sessionTitle || ''}</span>
                {plan.session?.recordedAt && (
                  <>
                    <span className='mx-1'>|</span>
                    <span>{formatDate(plan.session.recordedAt)}</span>
                    <span className='mx-1'>|</span>
                    <span>{formatTime(plan.session.recordedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            variant='ghost'
            className='flex items-center gap-2 rounded-full border border-gray-400 px-5 py-2 text-base font-semibold shadow-none hover:bg-gray-100'
            onClick={() => router.push(`/practitioner/clients/${clientId}/dashboard?editPlan=${planId}`)}
          >
            <Edit2 className='h-4 w-4' /> Edit Plan
          </Button>
        </div>
        <div className='w-full'>
          <div className='border border-gray-400 rounded-2xl w-full overflow-hidden'>
            {plan.actionItems && plan.actionItems.length > 0 ? (
              <div>
                {plan.actionItems.map((task: any, idx: number) => (
                  <div
                    key={task.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 py-7 ${idx !== plan.actionItems.length - 1 ? 'border-b border-gray-300' : ''}`}
                    style={{ gap: 0 }}
                  >
                    <div className='flex flex-col gap-1 flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span
                          className='font-bold text-xl underline underline-offset-2 cursor-pointer hover:text-primary transition-colors'
                          onClick={() => {
                            setSelectedTask(task);
                            setIsTaskModalOpen(true);
                          }}
                        >
                          {task.description}
                        </span>
                        {task.whyImportant && task.recommendedActions && <FileText className='h-5 w-5 text-gray-500' />}
                      </div>
                      <div className='flex flex-row gap-10 mt-2'>
                        <div className='text-base text-gray-700'>Duration: 15 Minutes</div>
                        <div className='flex items-center gap-2'>
                          <span className='text-base text-gray-700'>Weekly Repetition (Days):</span>
                          {DAYS.map((d) => (
                            <span
                              key={d}
                              className={`inline-block w-8 h-8 rounded-full border border-gray-400 text-center leading-8 mx-0.5 text-lg font-semibold ${task.daysOfWeek && task.daysOfWeek.includes(d) ? 'bg-black text-white border-black' : 'bg-white text-black'}`}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {task.isMandatory && (
                      <Badge
                        variant='outline'
                        className='ml-2 text-sm px-5 py-1 border border-gray-400 rounded-full font-semibold'
                      >
                        Mandatory
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center text-gray-400 py-10'>No tasks in this plan.</div>
            )}
          </div>
        </div>
      </div>
      <TaskEditorDialog
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={() => {}}
        initialValues={selectedTask}
        readOnly={true}
      />
    </div>
  );
}
