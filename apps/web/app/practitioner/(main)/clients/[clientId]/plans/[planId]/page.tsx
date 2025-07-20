'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { useGetPlan } from '@/lib/hooks/use-api';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Edit2, FileText, ArrowLeft } from 'lucide-react';
import { TaskEditorDialog } from '@/components/practitioner/TaskEditorDialog';
import { PageHeader } from '@/components/PageHeader';

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
    <div className='w-full min-h-screen flex flex-col bg-transparent'>
      <PageHeader
        title={
          <span className='flex justify-between  items-center gap-2'>
            Action Plan
            {plan.status !== 'DRAFT' && (
              <Button
                variant='ghost'
                size='sm'
                aria-label='Edit Plan'
                onClick={() => router.push(`/practitioner/clients/${clientId}/dashboard?editPlan=${planId}`)}
                className='ml-2 px-2 py-1 h-8 text-sm font-medium flex items-center gap-1'
              >
                <Edit2 className='h-4 w-4 mr-1' /> Edit Plan
              </Button>
            )}
          </span>
        }
        subtitle={
          plan.session?.title || plan.sessionTitle
            ? `${plan.session?.title || plan.sessionTitle} | ${formatDate(plan.session?.createdAt || plan.createdAt)} | ${formatTime(plan.session?.createdAt || plan.createdAt)}`
            : ''
        }
        showBackButton={true}
        onBack={() => router.back()}
        className='bg-transparent'
      />
      <div className='w-full flex flex-col sm:flex-row gap-8 px-8  mt-6 bg-transparent'>
        {/* Mandatory Tasks Card */}
        <div className='flex-1 flex flex-col gap-0 bg-transparent'>
          <div className='bg-white rounded-2xl shadow-md p-6 flex flex-col gap-0'>
            <div className='font-bold text-lg mb-4 text-[#222] ' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Mandatory tasks for the week
            </div>
            {plan.actionItems?.filter((t: any) => t.isMandatory).length === 0 && (
              <div className='text-muted-foreground text-sm mb-4'>No mandatory tasks.</div>
            )}
            {plan.actionItems
              ?.filter((t: any) => t.isMandatory)
              .map((task: any, idx: number, arr: any[]) => (
                <div
                  key={task.id}
                  className={`py-4 ${idx !== arr.length - 1 ? 'border-b border-[#e5e5e5]' : ''} cursor-pointer`}
                  onClick={() => {
                    setSelectedTask(task);
                    setIsTaskModalOpen(true);
                  }}
                >
                  <div className='font-semibold text-[17px] flex items-center gap-2 underline underline-offset-2'>
                    {task.description}
                    {task.whyImportant && (
                      <span className='ml-1 text-xs text-muted-foreground' title={task.whyImportant}>
                        i
                      </span>
                    )}
                  </div>
                  <div className='flex flex-row flex-wrap gap-4 mt-2 text-[15px] text-[#444] items-center'>
                    <div>
                      Weekly Repetition (Days):{' '}
                      {task.daysOfWeek?.map((d: string) => (
                        <span
                          key={d}
                          className='inline-block mx-1 px-2 py-0.5 border border-[#bdbdbd] rounded-full text-xs'
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className='flex items-center gap-1'>
                      <span className='text-[15px]'>⏱</span> {task.duration || '15 Minutes'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {/* Divider between columns */}
        <div className='hidden sm:block w-px bg-[#e5e5e5] mx-2' style={{ minHeight: 300 }} />
        {/* Daily Tasks Card */}
        <div className='flex-1 flex flex-col gap-0 bg-transparent'>
          <div className='bg-white rounded-2xl shadow-md p-6 flex flex-col gap-0'>
            <div className='font-bold text-lg mb-4 text-[#222]' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Daily Tasks
            </div>
            {plan.actionItems?.filter((t: any) => !t.isMandatory).length === 0 && (
              <div className='text-muted-foreground text-sm mb-4'>No daily tasks.</div>
            )}
            {plan.actionItems
              ?.filter((t: any) => !t.isMandatory)
              .map((task: any, idx: number, arr: any[]) => (
                <div
                  key={task.id}
                  className={`py-4 ${idx !== arr.length - 1 ? 'border-b border-[#e5e5e5]' : ''} cursor-pointer`}
                  onClick={() => {
                    setSelectedTask(task);
                    setIsTaskModalOpen(true);
                  }}
                >
                  <div className='font-semibold text-[17px] flex items-center gap-2 underline underline-offset-2'>
                    {task.description}
                    {task.whyImportant && (
                      <span className='ml-1 text-xs text-muted-foreground' title={task.whyImportant}>
                        i
                      </span>
                    )}
                  </div>
                  <div className='flex flex-row flex-wrap gap-4 mt-2 text-[15px] text-[#444] items-center'>
                    <div>
                      Weekly Repetition (Days):{' '}
                      {task.daysOfWeek?.map((d: string) => (
                        <span
                          key={d}
                          className='inline-block mx-1 px-2 py-0.5 border border-[#bdbdbd] rounded-full text-xs'
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className='flex items-center gap-1'>
                      <span className='text-[15px]'>⏱</span> {task.duration || '15 Minutes'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      {/* Task detail modal remains unchanged */}
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
