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
      <div className='flex flex-col flex-1 w-full max-w-[1430px] mx-auto'>
        <div className='flex flex-col gap-0 border-b bg-white px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
          <div className='flex flex-col items-start mb-4'>
            <button
              type='button'
              aria-label='Back'
              onClick={() => router.back()}
              className='text-muted-foreground hover:text-foreground focus:outline-none mb-2'
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft className='h-6 w-6 sm:h-7 sm:w-7' />
            </button>
            <h1 className='text-[22px] font-bold leading-tight mb-1' style={{ letterSpacing: 0, textAlign: 'left' }}>
              Action Plan
            </h1>
            <div className='flex flex-row flex-wrap gap-2 text-[#222] text-[17px] font-semibold items-center justify-start'>
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
          <div className='flex flex-row items-center justify-end w-full'>
            <button
              className='flex items-center gap-2 rounded-full border border-gray-400 px-5 py-2 text-[15px] font-semibold shadow-none hover:bg-gray-100 bg-white'
              onClick={() => router.push(`/practitioner/clients/${clientId}/dashboard?editPlan=${planId}`)}
              type='button'
            >
              <Edit2 className='h-4 w-4' /> Edit Plan
            </button>
          </div>
        </div>
        <div className='w-full'>
          <div
            className='border border-gray-400 rounded-2xl w-full overflow-hidden bg-white'
            style={{ minHeight: 300 }}
          >
            {plan.actionItems && plan.actionItems.length > 0 ? (
              <div>
                {plan.actionItems.map((task: any, idx: number) => (
                  <div
                    key={task.id}
                    className={`flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-6 ${idx !== plan.actionItems.length - 1 ? 'border-b border-gray-300' : ''}`}
                    style={{ gap: 0 }}
                  >
                    <div className='flex flex-col gap-1 flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span
                          className='font-bold text-[17px] underline underline-offset-2 cursor-pointer hover:text-primary transition-colors'
                          onClick={() => {
                            setSelectedTask(task);
                            setIsTaskModalOpen(true);
                          }}
                        >
                          {task.description}
                        </span>
                        {task.whyImportant && task.recommendedActions && <FileText className='h-5 w-5 text-gray-500' />}
                      </div>
                      <div className='flex flex-row items-center w-full mt-2'>
                        {/* Left: Duration */}
                        <div className='text-[15px] text-[#222] flex-1 text-left'>Duration: 15 Minutes</div>
                        {/* Center: Days */}
                        <div className='flex-1 flex justify-center'>
                          <div className='flex items-center gap-2'>
                            <span className='text-[15px] text-[#222]'>Weekly Repetition: </span>
                            {DAYS.map((d) => (
                              <span
                                key={d}
                                className={`inline-block w-8 h-8 rounded-full border border-gray-400 text-center leading-8 mx-0.5 text-[15px] font-semibold ${task.daysOfWeek && task.daysOfWeek.includes(d) ? 'bg-black text-white border-black' : 'bg-white text-black'}`}
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* Right: Mandatory */}
                        <div className='flex-1 flex justify-end'>
                          {task.isMandatory && (
                            <span className='text-[13px] px-5 py-1 border border-gray-400 rounded-full font-semibold bg-white'>
                              Mandatory
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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
