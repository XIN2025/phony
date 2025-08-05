'use client';

import { ClientPageHeader } from '@/components/practitioner/ClientPageHeader';
import { TaskEditorDialog } from '@/components/practitioner/TaskEditorDialog';
import { useGetClient, useGetClientActionItemsInRange, useGetClientJournalEntries } from '@/lib/hooks/use-api';
import { getEngagementForDay, getRatingEmoji } from '@/lib/utils';
import { Calendar, ClipboardList, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import 'react-calendar/dist/Calendar.css';
import 'react-date-picker/dist/DatePicker.css';
import DatePicker from 'react-date-picker';
import { Calendar as ReactCalendar } from 'react-calendar';
import { createPortal } from 'react-dom';

export default function TaskDetailsPage({ params }: { params: Promise<{ clientId: string; date: string }> }) {
  const router = useRouter();
  const { clientId, date: initialDate } = React.use(params);
  const { data: client, isLoading: isClientLoading } = useGetClient(clientId);

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
    const dayOfWeek = selectedDate.getDay();
    const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
    const selectedDayShort = dayMap[dayOfWeek];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0); // Reset time to start of day

    if (t.isMandatory) {
      // Check if task is completed for the selected date
      const selectedDateStart = new Date(selectedDate);
      selectedDateStart.setHours(0, 0, 0, 0);
      const selectedDateEnd = new Date(selectedDate);
      selectedDateEnd.setHours(23, 59, 59, 999);

      const isCompleted =
        t.completions &&
        t.completions.some((completion: any) => {
          const completionDate = new Date(completion.completionDate || completion.completedAt);
          return completionDate >= selectedDateStart && completionDate <= selectedDateEnd;
        });

      if (isCompleted) {
        // If task is completed for this date, only show on its configured days
        if (t.daysOfWeek && t.daysOfWeek.length > 0) {
          return t.daysOfWeek.some((day: string) => day === selectedDayShort);
        }
        return true;
      } else {
        // If task is NOT completed for this date, show on ALL future dates until completed
        // This makes mandatory tasks persist until they're done
        if (selectedDateObj >= today) {
          return true;
        }

        // For past dates, only show if it was scheduled for that day
        if (t.daysOfWeek && t.daysOfWeek.length > 0) {
          return t.daysOfWeek.some((day: string) => day === selectedDayShort);
        }
        return true;
      }
    } else {
      // For non-mandatory tasks, only show on their configured days
      if (t.daysOfWeek && t.daysOfWeek.length > 0) {
        return t.daysOfWeek.some((day: string) => day === selectedDayShort);
      }
      return true;
    }
  });

  const mandatoryTasks = dayTasks.filter((t: any) => t.isMandatory);
  const dailyTasks = dayTasks.filter((t: any) => !t.isMandatory);
  const pending = dayTasks.filter((t: any) => {
    // Check if task is completed for the selected date
    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);

    const isCompleted =
      t.completions &&
      t.completions.some((completion: any) => {
        const completionDate = new Date(completion.completionDate || completion.completedAt);
        return completionDate >= selectedDateStart && completionDate <= selectedDateEnd;
      });

    return !isCompleted;
  }).length;
  const engagement = getEngagementForDay(dayTasks, selectedDate);

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
    daysOfWeek: task.daysOfWeek || [],
    whyImportant: task.whyImportant || '',
    recommendedActions: task.recommendedActions || '',
    toolsToHelp: task.toolsToHelp || [],
    resources: task.resources || [],
  });

  const rightActions = (
    <button
      ref={dateButtonRef}
      className='rounded-full border border-gray-300 px-4 py-2 text-sm shadow transition disabled:opacity-50 disabled:cursor-not-allowed'
      onClick={() => setShowDatePicker((v) => !v)}
      type='button'
      disabled={isTasksLoading}
    >
      <Calendar className='h-4 w-4 inline mr-2' />
      {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
    </button>
  );

  // Handle date change from picker
  const handleDateChange = (value: any) => {
    if (!value || Array.isArray(value)) return;
    setSelectedDate(value);
    setShowDatePicker(false);
    // Update the URL to the new date
    const dateString = value.toISOString().split('T')[0];
    router.replace(`/practitioner/clients/${clientId}/tasks/${dateString}`);
  };

  return (
    <div className='w-full min-h-screen flex flex-col items-stretch px-0'>
      {!isClientLoading && client && (
        <ClientPageHeader
          client={client}
          title='Tasks'
          rightActions={rightActions}
          showMessagesButton={false}
          showAvatar={false}
        />
      )}

      <div className='w-full flex flex-col gap-8 px-2 pr-4 sm:px-8'>
        {/* Responsive: stack on mobile, row on sm+ */}
        <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6'>
          <div className='flex-1'>
            <div className='bg-white rounded-2xl shadow-md p-4 sm:p-8 flex flex-col items-start'>
              <div className='flex items-center justify-between w-full'>
                <div
                  className='text-3xl sm:text-4xl font-extrabold'
                  style={{ fontFamily: "'DM Serif Display', serif", color: '#807171' }}
                >
                  {isTasksLoading ? '...' : pending}
                </div>
                <ClipboardList className='h-8 w-8 sm:h-10 sm:w-10 text-[#807171]' />
              </div>
              <div className='text-base sm:text-lg font-semibold text-gray-700'>Tasks Pending</div>
            </div>
          </div>
          <div className='flex-1 mt-4 sm:mt-0'>
            <div className='bg-white rounded-2xl shadow-md p-4 sm:p-8 flex flex-col items-start'>
              <div className='flex items-center justify-between w-full'>
                <div
                  className='text-2xl sm:text-3xl font-bold'
                  style={{ fontFamily: "'DM Serif Display', serif", color: '#807171' }}
                >
                  {isTasksLoading ? '...' : engagement}
                </div>
                <Sparkles className='h-8 w-8 sm:h-10 sm:w-10 text-[#807171]' />
              </div>
              <div className='text-base sm:text-lg font-semibold text-gray-700'>Avg Engagement</div>
            </div>
          </div>
        </div>

        {isTasksLoading && (
          <div className='text-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
            <p className='mt-2 text-sm text-muted-foreground'>
              Loading tasks for{' '}
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}...
            </p>
          </div>
        )}

        {!isTasksLoading && (
          <div className='flex flex-col sm:flex-row gap-4 sm:gap-8 w-full'>
            <div className='flex-1 mb-4 sm:mb-0'>
              <div className='bg-white rounded-2xl shadow-md p-4 sm:p-8'>
                <div className='text-lg sm:text-xl font-bold mb-4' style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Mandatory tasks for the week
                </div>
                <div className='flex flex-col gap-0'>
                  {mandatoryTasks.length === 0 ? (
                    <div className='text-muted-foreground text-sm mb-4 px-2 sm:px-6 py-4 sm:py-6'>
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
                          className={`flex items-center gap-2 sm:gap-3 py-3 sm:py-4 ${idx !== mandatoryTasks.length - 1 ? 'border-b border-[#ececec]' : ''} cursor-pointer hover:bg-gray-50 rounded-lg transition-colors`}
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
                              className={`font-medium text-sm sm:text-base flex items-center gap-1 sm:gap-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {task.description}
                              <span className='ml-1 text-gray-400 text-xs' title='Info'>
                                ⓘ
                              </span>
                            </div>
                            <div className='text-xs text-muted-foreground mt-1 flex items-center gap-1 sm:gap-2'>
                              <span role='img' aria-label='timer'>
                                ⏱
                              </span>{' '}
                              {task.duration || 'No duration set'}
                            </div>
                          </div>
                          {isCompleted && (
                            <span className='ml-2 text-xl sm:text-2xl' role='img' aria-label='rating'>
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

            <div className='flex-1'>
              <div className='bg-white rounded-2xl shadow-md p-4 sm:p-8'>
                <div className='text-lg sm:text-xl font-bold mb-4' style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Daily Tasks
                </div>
                <div className='flex flex-col gap-0'>
                  {dailyTasks.length === 0 ? (
                    <div className='text-muted-foreground text-sm mb-4 px-2 sm:px-6 py-4 sm:py-6'>
                      No daily tasks for this date.
                    </div>
                  ) : (
                    dailyTasks.map((task: any, idx: number) => {
                      const isCompleted = task.completions && task.completions.length > 0;
                      const latestCompletion = isCompleted ? task.completions[task.completions.length - 1] : null;
                      const rating = latestCompletion?.rating;
                      const ratingEmoji = getRatingEmoji(rating);
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center gap-2 sm:gap-3 py-3 sm:py-4 ${idx !== dailyTasks.length - 1 ? 'border-b border-[#ececec]' : ''} cursor-pointer hover:bg-gray-50 rounded-lg transition-colors`}
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
                              className={`font-medium text-sm sm:text-base flex items-center gap-1 sm:gap-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {task.description}
                              <span className='ml-1 text-gray-400 text-xs' title='Info'>
                                ⓘ
                              </span>
                            </div>
                            <div className='text-xs text-muted-foreground mt-1 flex items-center gap-1 sm:gap-2'>
                              <span role='img' aria-label='timer'>
                                ⏱
                              </span>{' '}
                              {task.duration || 'No duration set'}
                            </div>
                          </div>
                          {isCompleted && (
                            <span className='ml-2 text-xl sm:text-2xl' role='img' aria-label='rating'>
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

      {selectedTask && (
        <TaskEditorDialog
          open={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={() => {}}
          initialValues={mapTaskToEditorDialog(selectedTask)}
          readOnly={true}
        />
      )}
      {datePickerMounted &&
        showDatePicker &&
        createPortal(
          <div
            ref={datePickerRef}
            style={{
              position: 'absolute',
              top: pickerPosition.top,
              left: pickerPosition.left,
              zIndex: 50,
              width: typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 350,
              maxWidth: '95vw',
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid #ececec',
              padding: typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : 16,
            }}
            className='calendar-float'
          >
            <ReactCalendar
              onChange={handleDateChange}
              value={selectedDate}
              locale='en-US'
              maxDetail='month'
              minDetail='month'
              showNeighboringMonth={false}
              tileClassName={() => 'cursor-pointer'}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
