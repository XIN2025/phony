'use client';

import { TaskEditorDialog } from '@/components/practitioner/TaskEditorDialog';
import { useGetClientActionItemsInRange, useGetClientJournalEntries } from '@/lib/hooks/use-api';
import { getEngagementForDay, getRatingEmoji, isSameDay } from '@/lib/utils';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import { DateRange } from 'react-date-range';
import { createPortal } from 'react-dom';

export default function TaskDetailsPage({ params }: { params: Promise<{ clientId: string; date: string }> }) {
  const router = useRouter();
  const { clientId, date: initialDate } = React.use(params);

  const [selectedDate, setSelectedDate] = useState(new Date(initialDate));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMounted, setDatePickerMounted] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(initialDate),
    endDate: new Date(initialDate),
    key: 'selection',
  });

  if (!clientId) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  const dateString = selectedDate.toISOString().split('T')[0] || '';
  const { data: allTasks = [], isLoading: isTasksLoading } = useGetClientActionItemsInRange(
    clientId,
    dateString,
    dateString,
  );
  const { data: journalEntries = [] } = useGetClientJournalEntries(clientId || '');

  const dayTasks = allTasks.filter((t: any) => {
    const taskDate = t.sessionDate || t.createdAt;
    const isSame = isSameDay(taskDate, selectedDate);
    return isSame;
  });

  const mandatoryTasks = dayTasks.filter((t: any) => t.isMandatory);
  const dailyTasks = dayTasks.filter((t: any) => !t.isMandatory);
  const pending = dayTasks.filter((t: any) => !t.completions || t.completions.length === 0).length;
  const engagement = getEngagementForDay(dayTasks);

  const [selectedTask, setSelectedTask] = React.useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);

  useEffect(() => {
    setDatePickerMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (showDatePicker && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      const pickerHeight = 380;
      const pickerWidth = 350;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      let top = rect.bottom + window.scrollY;
      if (spaceBelow < pickerHeight && spaceAbove > pickerHeight) {
        top = rect.top + window.scrollY - pickerHeight;
      }
      let left = rect.left + window.scrollX;
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 8;
      }
      setPickerPosition({ top, left, width: rect.width });
    }
  }, [showDatePicker]);

  useEffect(() => {
    if (!showDatePicker) return;
    const handleClick = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node) &&
        dateButtonRef.current &&
        !dateButtonRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowDatePicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showDatePicker]);

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const mapTaskToEditorDialog = (task: any) => ({
    description: task.description,
    duration: task.duration || '',
    isMandatory: task.isMandatory || false,
    frequency: task.frequency || 'Daily',
    daysOfWeek: task.daysOfWeek || [],
    whyImportant: task.whyImportant || '',
    recommendedActions: task.recommendedActions || '',
    toolsToHelp: task.toolsToHelp || [],
    resources: task.resources || [],
  });

  return (
    <div className='w-full min-h-screen flex flex-col items-stretch pt-2 px-0'>
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
        {/* Header row: title and date selector */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between w-full gap-3 md:gap-0 mb-2'>
          <h1 className='text-2xl font-bold'>Tasks</h1>
          <div className='flex items-center gap-2'>
            <button
              ref={dateButtonRef}
              className='rounded-full border border-gray-300 px-4 py-2 text-sm bg-white shadow hover:bg-gray-50 transition'
              onClick={() => setShowDatePicker((v) => !v)}
              type='button'
            >
              <Calendar className='h-4 w-4 inline mr-2' />
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
            {datePickerMounted &&
              showDatePicker &&
              createPortal(
                <div
                  ref={datePickerRef}
                  className='absolute z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-full max-h-[90vh] w-[350px] sm:w-auto overflow-auto flex flex-col items-center animate-fadeIn'
                  style={{
                    top: pickerPosition.top,
                    left: pickerPosition.left,
                    position: 'absolute',
                    minWidth: pickerPosition.width,
                  }}
                  role='dialog'
                  aria-modal='true'
                >
                  <DateRange
                    editableDateInputs={true}
                    onChange={(ranges) => {
                      const selection = ranges.selection;
                      if (selection && selection.startDate) {
                        setDateRange({
                          startDate: selection.startDate,
                          endDate: selection.startDate, // force single date
                          key: 'selection',
                        });
                        setSelectedDate(selection.startDate);
                        // Update the URL to match the selected date
                        const yyyy = selection.startDate.getFullYear();
                        const mm = String(selection.startDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selection.startDate.getDate()).padStart(2, '0');
                        const dateStr = `${yyyy}-${mm}-${dd}`;
                        router.push(`/practitioner/clients/${clientId}/tasks/${dateStr}`);
                        setShowDatePicker(false);
                      }
                    }}
                    moveRangeOnFirstSelection={false}
                    ranges={[dateRange]}
                    maxDate={new Date()}
                    rangeColors={['#2563eb']}
                    showDateDisplay={false}
                  />
                </div>,
                document.body,
              )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className='flex flex-row gap-6 mb-6'>
          <div className='flex-1'>
            <div className='bg-white rounded-2xl shadow-md p-8 flex flex-col items-start'>
              <div className='text-4xl font-extrabold mb-1'>{pending}</div>
              <div className='text-lg font-semibold text-gray-700'>Tasks Pending</div>
            </div>
          </div>
          <div className='flex-1'>
            <div className='bg-white rounded-2xl shadow-md p-8 flex flex-col items-start'>
              <div className='text-3xl font-bold mb-1'>{engagement}</div>
              <div className='text-lg font-semibold text-gray-700'>Avg Engagement</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isTasksLoading && (
          <div className='text-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
            <p className='mt-2 text-sm text-muted-foreground'>Loading tasks...</p>
          </div>
        )}

        {/* Tasks Content */}
        {!isTasksLoading && (
          <div className='flex flex-row gap-8 w-full'>
            {/* Mandatory Tasks Card */}
            <div className='flex-1'>
              <div className='bg-white rounded-2xl shadow-md p-8'>
                <div className='text-xl font-bold mb-4'>Mandatory tasks for the week</div>
                <div className='flex flex-col gap-0'>
                  {mandatoryTasks.length === 0 ? (
                    <div className='text-muted-foreground text-sm mb-4 px-6 py-6'>
                      No mandatory tasks for this date.
                    </div>
                  ) : (
                    mandatoryTasks.map((task: any, idx: number) => {
                      const isCompleted = task.completions && task.completions.length > 0;
                      const latestCompletion = isCompleted ? task.completions[task.completions.length - 1] : null;
                      const rating = latestCompletion?.rating;
                      const ratingEmoji = getRatingEmoji(rating);
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center gap-3 py-4 ${idx !== mandatoryTasks.length - 1 ? 'border-b border-[#ececec]' : ''} cursor-pointer hover:bg-gray-50 rounded-lg transition-colors`}
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className='flex items-center justify-center w-5 h-5 mt-0.5'>
                            {isCompleted ? (
                              <div className='w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                                <span className='text-white text-xs'>✓</span>
                              </div>
                            ) : (
                              <div className='w-4 h-4 border-2 border-gray-300 rounded-full'></div>
                            )}
                          </div>
                          <div className='flex-1'>
                            <div
                              className={`font-medium text-base flex items-center gap-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
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
                              {task.duration || 'No duration set'}
                            </div>
                          </div>
                          {isCompleted && (
                            <span className='ml-2 text-2xl' role='img' aria-label='rating'>
                              {ratingEmoji}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Daily Tasks Card */}
            <div className='flex-1'>
              <div className='bg-white rounded-2xl shadow-md p-8'>
                <div className='text-xl font-bold mb-4'>Daily Tasks</div>
                <div className='flex flex-col gap-0'>
                  {dailyTasks.length === 0 ? (
                    <div className='text-muted-foreground text-sm mb-4 px-6 py-6'>No daily tasks for this date.</div>
                  ) : (
                    dailyTasks.map((task: any, idx: number) => {
                      const isCompleted = task.completions && task.completions.length > 0;
                      const latestCompletion = isCompleted ? task.completions[task.completions.length - 1] : null;
                      const rating = latestCompletion?.rating;
                      const ratingEmoji = getRatingEmoji(rating);
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center gap-3 py-4 ${idx !== dailyTasks.length - 1 ? 'border-b border-[#ececec]' : ''} cursor-pointer hover:bg-gray-50 rounded-lg transition-colors`}
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className='flex items-center justify-center w-5 h-5 mt-0.5'>
                            {isCompleted ? (
                              <div className='w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                                <span className='text-white text-xs'>✓</span>
                              </div>
                            ) : (
                              <div className='w-4 h-4 border-2 border-gray-300 rounded-full'></div>
                            )}
                          </div>
                          <div className='flex-1'>
                            <div
                              className={`font-medium text-base flex items-center gap-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
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
                              {task.duration || 'No duration set'}
                            </div>
                          </div>
                          {isCompleted && (
                            <span className='ml-2 text-2xl' role='img' aria-label='rating'>
                              {ratingEmoji}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
