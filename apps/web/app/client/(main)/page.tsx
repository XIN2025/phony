'use client';
import { TaskEditorDialog } from '@/components/practitioner/TaskEditorDialog';
import {
  useCompleteActionItem,
  useGetActivePlanForDate,
  useGetCurrentUser,
  useUndoTaskCompletion,
} from '@/lib/hooks/use-api';
import { getRatingEmoji } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Dialog, DialogContent, DialogTitle } from '@repo/ui/components/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Frown, Meh, Plus, Smile } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

interface ActionItem {
  id: string;
  description: string;
  target?: string;
  frequency?: string;
  weeklyRepetitions?: number;
  isMandatory?: boolean;
  isOneOff?: boolean;
  whyImportant?: string;
  recommendedActions?: string;
  toolsToHelp?: string;
  category?: string;
  isCompleted: boolean;
  duration?: string;
  completions?: Array<{
    id: string;
    completedAt: string;
    completionDate?: string;
    rating?: number;
    journalEntry?: string;
    achievedValue?: string;
  }>;
  resources?: Array<{
    type: 'LINK' | 'PDF';
    url: string;
    title?: string;
  }>;
  daysOfWeek?: string[];
  sessionDate?: string;
  createdAt?: string;
  completedAt?: string;
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
  const [selectedTask, setSelectedTask] = useState<ActionItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionData>({
    rating: 0,
    journalEntry: '',
    achievedValue: '',
  });

  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
    key: 'selection',
  });
  const selectedDate = dateRange.startDate;

  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(selectedDate.getDate()).padStart(2, '0');
  const selectedDateString = `${year}-${month}-${day}`;

  const {
    data: activePlan,
    isLoading: planLoading,
    error: planError,
    refetch: refetchActivePlan,
  } = useGetActivePlanForDate(session?.user?.id || '', selectedDateString);

  const actionItems =
    activePlan?.actionItems?.map((item: ActionItem) => {
      // For one-off tasks, check if they have been permanently completed
      if (item.isOneOff) {
        const result = {
          ...item,
          isCompleted: item.completedAt !== null,
        };
        return result;
      }

      // For regular tasks, check if task is completed for the selected date
      const selectedDateStart = new Date(selectedDate);
      selectedDateStart.setHours(0, 0, 0, 0);
      const selectedDateEnd = new Date(selectedDate);
      selectedDateEnd.setHours(23, 59, 59, 999);

      const isCompleted =
        item.completions &&
        item.completions.some((completion: any) => {
          const completionDate = new Date(completion.completionDate || completion.completedAt);
          return completionDate >= selectedDateStart && completionDate <= selectedDateEnd;
        });

      const result = {
        ...item,
        isCompleted,
      };
      return result;
    }) || [];

  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredTasks = actionItems.filter((task: ActionItem) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return !task.isCompleted;
    if (taskFilter === 'completed') return task.isCompleted;
    return true;
  });

  const getTodayShort = () => {
    const days = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
    return days[new Date().getDay()] ?? 'Su';
  };
  const todayShort = getTodayShort();

  const DAY_NAME_MAP: Record<string, string> = {
    Su: 'Sunday',
    M: 'Monday',
    T: 'Tuesday',
    W: 'Wednesday',
    Th: 'Thursday',
    F: 'Friday',
    S: 'Saturday',
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMounted, setDatePickerMounted] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

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
      const spaceRight = window.innerWidth - rect.right;

      if (spaceRight < pickerWidth) {
        left = rect.right + window.scrollX - pickerWidth;
      }

      if (left < 10) {
        left = Math.max(10, (window.innerWidth - pickerWidth) / 2);
      }

      if (left + pickerWidth > window.innerWidth - 10) {
        left = window.innerWidth - pickerWidth - 10;
      }

      setPickerPosition({
        top,
        left,
        width: rect.width,
      });
    }
  }, [showDatePicker]);

  useEffect(() => {
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
      if (event.key === 'Escape') {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDatePicker]);

  const completeTaskMutation = useCompleteActionItem();
  const undoTaskCompletionMutation = useUndoTaskCompletion();

  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<'happy' | 'neutral' | 'sad' | null>(null);

  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser();

  const tasksPending = filteredTasks.filter((task: ActionItem) => !task.isCompleted).length;

  const handleTaskToggle = async (task: ActionItem) => {
    if (loadingTaskId) return;

    setLoadingTaskId(task.id);
    try {
      if (task.isCompleted) {
        await undoTaskCompletionMutation.mutateAsync({
          taskId: task.id,
          clientId: session?.user?.id || '',
          completionDate: selectedDate.toISOString(),
        });
        toast.success('Task marked as incomplete');
      } else {
        await completeTaskMutation.mutateAsync({
          taskId: task.id,
          completionData: {
            clientId: session?.user?.id || '',
            completionDate: selectedDate.toISOString(),
            rating: 0,
            journalEntry: '',
            achievedValue: '',
          },
        });
        toast.success('Task completed!');
      }
      refetchActivePlan();
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleCompleteTask = () => {
    if (!selectedTask || !selectedFeedback) return;

    const ratingMap = {
      happy: 5,
      neutral: 3,
      sad: 1,
    };

    completeTaskMutation.mutate(
      {
        taskId: selectedTask.id,
        completionData: {
          clientId: session?.user?.id || '',
          completionDate: selectedDate.toISOString(),
          rating: ratingMap[selectedFeedback],
          journalEntry: completionData.journalEntry,
          achievedValue: completionData.achievedValue,
        },
      },
      {
        onSuccess: () => {
          toast.success('Task completed successfully!');
          setFeedbackOpen(false);
          setSelectedFeedback(null);
          setSelectedTask(null);
          setCompletionData({ rating: 0, journalEntry: '', achievedValue: '' });
          refetchActivePlan();
        },
        onError: () => {
          toast.error('Failed to complete task');
        },
      },
    );
  };

  const handleTaskDetailClick = (task: ActionItem) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const mapTaskToEditorDialog = (task: ActionItem) => ({
    description: task.description,
    duration: task.duration || '',
    isMandatory: task.isMandatory || false,
    isOneOff: task.isOneOff || false,
    daysOfWeek: task.daysOfWeek || [],
    whyImportant: task.whyImportant || '',
    recommendedActions: task.recommendedActions || '',
    toolsToHelp: task.toolsToHelp || [],
    resources: task.resources || [],
  });

  const handleTaskToggleWithFeedback = async (task: ActionItem) => {
    if (task.isCompleted) {
      await handleTaskToggle(task);
    } else {
      setSelectedTask(task);
      setFeedbackOpen(true);
      setSelectedFeedback(null);
    }
  };

  const handleFeedbackSelect = (type: 'happy' | 'neutral' | 'sad') => {
    setSelectedFeedback(type);
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedTask || !selectedFeedback) return;

    const ratingMap = {
      happy: 5,
      neutral: 3,
      sad: 1,
    };

    setLoadingTaskId(selectedTask.id);
    try {
      await completeTaskMutation.mutateAsync({
        taskId: selectedTask.id,
        completionData: {
          clientId: session?.user?.id || '',
          completionDate: selectedDate.toISOString(),
          rating: ratingMap[selectedFeedback],
          journalEntry: completionData.journalEntry,
          achievedValue: completionData.achievedValue,
        },
      });
      toast.success('Task completed successfully!');
      setFeedbackOpen(false);
      setSelectedFeedback(null);
      setSelectedTask(null);
      setCompletionData({ rating: 0, journalEntry: '', achievedValue: '' });
      refetchActivePlan();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    } finally {
      setLoadingTaskId(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Please sign in to continue</h1>
          <Link href='/auth' className='text-blue-600 hover:text-blue-800'>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const mandatoryTasks = filteredTasks.filter((task: ActionItem) => task.isMandatory);
  const dailyTasks = filteredTasks.filter((task: ActionItem) => !task.isMandatory);

  if (planError) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>Error loading tasks: {planError.message}</p>
          <Button onClick={() => refetchActivePlan()} className='mt-4'>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      {/* Welcome Section */}
      <div className='px-4 sm:px-6 lg:px-8 pt-4 pb-4'>
        <div className='mt-2'>
          <h1
            className='font-bold text-gray-900 text-2xl lg:text-4xl'
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {userLoading ? 'Loading...' : `Welcome back  ${currentUser?.firstName || 'User'}`}
          </h1>
          <p className='text-xs sm:text-sm md:text-base text-[#998D8D]'>Let's have a great day today</p>
        </div>
      </div>

      {/* Tasks Section Header */}
      <div className='px-4 sm:px-6 lg:px-8 flex items-center justify-between mt-2 mb-4'>
        <h2
          className='text-base text-xl lg:text-2xl font-bold text-gray-900'
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Tasks
        </h2>
        <div className='flex items-center gap-2'>
          {planLoading && (
            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500'></div>
              <span>Loading tasks...</span>
            </div>
          )}
          <button
            ref={dateButtonRef}
            className='text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition shadow-sm flex items-center gap-1 sm:gap-2'
            onClick={() => setShowDatePicker((v) => !v)}
            type='button'
            disabled={planLoading}
          >
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </button>
        </div>
        {datePickerMounted &&
          showDatePicker &&
          createPortal(
            <div
              ref={datePickerRef}
              className={
                typeof window !== 'undefined' && window.innerWidth < 640
                  ? 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/30'
                  : 'absolute z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-full max-h-[90vh] w-[350px] sm:w-auto overflow-auto flex flex-col items-center animate-fadeIn'
              }
              style={
                typeof window !== 'undefined' && window.innerWidth < 640
                  ? {
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '95vw',
                      maxWidth: 350,
                      background: 'white',
                      borderRadius: '1rem',
                      padding: 16,
                    }
                  : {
                      top: pickerPosition.top,
                      left: pickerPosition.left,
                      position: 'absolute',
                      width: '350px',
                      maxWidth: '90vw',
                    }
              }
              role='dialog'
              aria-modal='true'
            >
              <DateRange
                editableDateInputs={true}
                onChange={(ranges) => {
                  const selection = ranges.selection;
                  if (selection && selection.startDate) {
                    const newDateRange = {
                      startDate: selection.startDate,
                      endDate: selection.startDate,
                      key: 'selection',
                    };

                    setDateRange(newDateRange);
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

      {/* Summary Cards */}
      <div className='px-2 sm:px-6 lg:px-8 grid grid-cols-2 gap-3 sm:gap-4 mb-6'>
        {/* Tasks Pending Card */}
        <Card className='bg-white rounded-2xl shadow-md p-0 flex flex-row items-center h-24 sm:h-28 md:h-32 lg:h-36'>
          <div className='flex flex-col justify-center flex-1 pl-3 sm:pl-6'>
            <span
              className='text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-[#807171] leading-none'
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {planLoading ? '...' : tasksPending}
            </span>
            <span className='text-xs sm:text-base md:text-lg font-serif text-[#807171] mt-1 sm:mt-2 whitespace-nowrap truncate'>
              Tasks Pending
            </span>
          </div>
          <div className='flex items-center justify-center pr-3 sm:pr-6'>
            <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center pr-0 sm:pr-0 mr-1 sm:mr-0'>
              <ClipboardList className='w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7' />
            </div>
          </div>
        </Card>
        {/* Add New Journal Entry Card */}
        <Card
          className='bg-white rounded-2xl shadow-md p-0 flex flex-row items-center h-24 sm:h-28 md:h-32 lg:h-36 cursor-pointer hover:bg-gray-50 transition min-w-0'
          onClick={() => (window.location.href = '/client/journals/new')}
        >
          <div className='flex flex-col justify-center flex-1 pl-3 sm:pl-6 min-w-0'>
            <span className='text-sm sm:text-base md:text-lg font-serif text-[#807171] whitespace-normal sm:whitespace-nowrap sm:truncate'>
              Add new journal entry
            </span>
          </div>
          <div className='flex items-center justify-center pr-2 sm:pr-6'>
            <div className='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center'>
              <Plus className='w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7' />
            </div>
          </div>
        </Card>
      </div>

      {/* Task Lists */}
      <div className='px-4 sm:px-6 lg:px-8 flex flex-col gap-6'>
        {mandatoryTasks.length > 0 && (
          <div className='bg-white rounded-2xl shadow-md p-4 sm:p-6 md:p-8'>
            <div
              className='text-lg sm:text-xl md:text-2xl font-bold mb-4 cursor-pointer hover:text-gray-700 transition-colors'
              style={{ fontFamily: "'DM Serif Display', serif" }}
              onClick={() => handleTaskDetailClick(mandatoryTasks[0])}
            >
              Mandatory Tasks
            </div>
            <div className='flex flex-col gap-0'>
              {planLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='flex items-center gap-3'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500'></div>
                    <span className='text-sm text-gray-500'>Loading tasks...</span>
                  </div>
                </div>
              ) : (
                mandatoryTasks.map((task: ActionItem, idx: number) => {
                  const isCompleted = task.isCompleted;
                  const latestCompletion = isCompleted ? task.completions?.[task.completions.length - 1] : null;
                  const rating = latestCompletion?.rating;
                  const ratingEmoji = getRatingEmoji(rating);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 py-4 ${idx !== mandatoryTasks.length - 1 ? 'border-b border-[#ececec]' : ''} hover:bg-gray-50 rounded-lg transition-colors`}
                    >
                      <div
                        className='flex items-center justify-center w-5 h-5 mt-0.5 cursor-pointer'
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isCompleted) {
                            handleTaskToggleWithFeedback(task);
                          } else {
                            handleTaskToggle(task);
                          }
                        }}
                      >
                        {isCompleted ? (
                          <div className='w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                            <span className='text-white text-xs'>✓</span>
                          </div>
                        ) : (
                          <div className='w-4 h-4 border-2 border-gray-300 rounded-full hover:bg-gray-100'></div>
                        )}
                      </div>
                      <div className='flex-1 cursor-pointer' onClick={() => handleTaskDetailClick(task)}>
                        <div
                          className={`font-medium text-sm sm:text-base flex items-center gap-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {task.description}
                          <span className='ml-1 text-gray-400 text-xs' title='Info'>
                            ⓘ
                          </span>
                        </div>
                        <div className='text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-2'>
                          <span role='img' aria-label='timer'>
                            ⏱
                          </span>{' '}
                          {task.duration || 'No duration set'}
                        </div>
                      </div>
                      {isCompleted && (
                        <span className='ml-2 text-lg sm:text-xl md:text-2xl' role='img' aria-label='rating'>
                          {ratingEmoji}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {dailyTasks.length > 0 && (
          <div className='bg-white rounded-2xl shadow-md p-4 sm:p-6 md:p-8'>
            <div
              className='text-lg sm:text-xl md:text-2xl font-bold mb-4 cursor-pointer hover:text-gray-700 transition-colors'
              style={{ fontFamily: "'DM Serif Display', serif" }}
              onClick={() => handleTaskDetailClick(dailyTasks[0])}
            >
              Daily Tasks
            </div>
            <div className='flex flex-col gap-0'>
              {planLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='flex items-center gap-3'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500'></div>
                    <span className='text-sm text-gray-500'>Loading tasks...</span>
                  </div>
                </div>
              ) : (
                dailyTasks.map((task: ActionItem, idx: number) => {
                  const isCompleted = task.isCompleted;
                  const latestCompletion = isCompleted ? task.completions?.[task.completions.length - 1] : null;
                  const rating = latestCompletion?.rating;
                  const ratingEmoji = getRatingEmoji(rating);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 py-4 ${idx !== dailyTasks.length - 1 ? 'border-b border-[#ececec]' : ''} hover:bg-gray-50 rounded-lg transition-colors`}
                    >
                      <div
                        className='flex items-center justify-center w-5 h-5 mt-0.5 cursor-pointer'
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isCompleted) {
                            handleTaskToggleWithFeedback(task);
                          } else {
                            handleTaskToggle(task);
                          }
                        }}
                      >
                        {isCompleted ? (
                          <div className='w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                            <span className='text-white text-xs'>✓</span>
                          </div>
                        ) : (
                          <div className='w-4 h-4 border-2 border-gray-300 rounded-full hover:bg-gray-100'></div>
                        )}
                      </div>
                      <div className='flex-1 cursor-pointer' onClick={() => handleTaskDetailClick(task)}>
                        <div
                          className={`font-medium text-sm sm:text-base flex items-center gap-2 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {task.description}
                          <span className='ml-1 text-gray-400 text-xs' title='Info'>
                            ⓘ
                          </span>
                        </div>
                        <div className='text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-2'>
                          <span role='img' aria-label='timer'>
                            ⏱
                          </span>{' '}
                          {task.duration || 'No duration set'}
                        </div>
                      </div>
                      {isCompleted && (
                        <span className='ml-2 text-lg sm:text-xl md:text-2xl' role='img' aria-label='rating'>
                          {ratingEmoji}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className='w-[98vw] max-w-full sm:max-w-md p-2 sm:p-6 flex flex-col items-center rounded-xl overflow-y-auto max-h-[90vh] border border-gray-200 shadow-xl'>
          <DialogTitle asChild>
            <VisuallyHidden>Was this task helpful?</VisuallyHidden>
          </DialogTitle>
          <div className='text-center w-full mb-4 sm:mb-6'>
            <div
              className='text-lg sm:text-xl font-bold text-gray-900 mb-2'
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Was this task helpful?
            </div>
          </div>
          <div className='flex flex-row items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6 w-full'>
            <button
              aria-label='Happy'
              className={`rounded-full p-3 sm:p-4 border-2 transition-all duration-200 hover:scale-105 ${selectedFeedback === 'happy' ? 'border-green-500 bg-green-50 shadow-lg' : 'border-gray-300 hover:border-green-300 hover:bg-green-50/50'}`}
              onClick={() => handleFeedbackSelect('happy')}
              disabled={!!loadingTaskId}
            >
              <Smile className='w-8 h-8 sm:w-10 sm:h-10 text-green-600' />
            </button>
            <button
              aria-label='Neutral'
              className={`rounded-full p-3 sm:p-4 border-2 transition-all duration-200 hover:scale-105 ${selectedFeedback === 'neutral' ? 'border-yellow-500 bg-yellow-50 shadow-lg' : 'border-gray-300 hover:border-yellow-300 hover:bg-yellow-50/50'}`}
              onClick={() => handleFeedbackSelect('neutral')}
              disabled={!!loadingTaskId}
            >
              <Meh className='w-8 h-8 sm:w-10 sm:h-10 text-yellow-600' />
            </button>
            <button
              aria-label='Sad'
              className={`rounded-full p-3 sm:p-4 border-2 transition-all duration-200 hover:scale-105 ${selectedFeedback === 'sad' ? 'border-red-500 bg-red-50 shadow-lg' : 'border-gray-300 hover:border-red-300 hover:bg-red-50/50'}`}
              onClick={() => handleFeedbackSelect('sad')}
              disabled={!!loadingTaskId}
            >
              <Frown className='w-8 h-8 sm:w-10 sm:h-10 text-red-600' />
            </button>
          </div>
          <Button
            onClick={handleFeedbackSubmit}
            disabled={!!loadingTaskId || !selectedFeedback}
            className='w-full mt-4 bg-[#807171] hover:bg-gray-700 text-white'
          >
            {loadingTaskId ? (
              <span className='flex items-center justify-center gap-2'>
                <span className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></span> Submitting...
              </span>
            ) : (
              'Submit'
            )}
          </Button>
        </DialogContent>
      </Dialog>

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
};

export default ClientPage;
