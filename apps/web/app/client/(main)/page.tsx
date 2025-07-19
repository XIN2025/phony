'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import {
  Star,
  Calendar,
  Target,
  Clock,
  Menu,
  AlertCircle,
  Info,
  ExternalLink,
  RefreshCw,
  Smile,
  Meh,
  Frown,
  CheckCircle,
  Plus,
  ClipboardList,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSidebar } from '@/context/SidebarContext';
import Link from 'next/link';
import { Badge } from '@repo/ui/components/badge';
import {
  useGetActivePlanForDate,
  useCompleteActionItem,
  useGetCurrentUser,
  useUndoTaskCompletion,
} from '@/lib/hooks/use-api';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { SidebarToggleButton } from '@/components/practitioner/SidebarToggleButton';
import { TaskEditorDialog } from '@/components/practitioner/TaskEditorDialog';
import { toast } from 'sonner';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { createPortal } from 'react-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar';
import { getAvatarUrl, getInitials, getUserDisplayName, getRatingEmoji } from '@/lib/utils';

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
  duration?: string;
  completions?: Array<{
    id: string;
    completedAt: string;
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
  const { setSidebarOpen } = useSidebar();
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

  const selectedDateString = selectedDate.toISOString().slice(0, 10);

  const {
    data: activePlan,
    isLoading: planLoading,
    error: planError,
    refetch: refetchActivePlan,
  } = useGetActivePlanForDate(session?.user?.id || '', selectedDateString);

  const actionItems =
    activePlan?.actionItems?.map((item: ActionItem) => {
      const isCompleted = item.completions && item.completions.length > 0;
      return {
        ...item,
        isCompleted,
      };
    }) || [];

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
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDatePicker]);

  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  function isTaskForDate(task: ActionItem, date: Date) {
    const dayOfWeek = date.getDay();
    const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
    const selectedDayShort = dayMap[dayOfWeek];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (task.isCompleted && selectedDate.toDateString() === today.toDateString()) {
      return true;
    }

    if (task.isMandatory) {
      if (selectedDate >= today) {
        return true;
      }

      if (task.daysOfWeek && task.daysOfWeek.length > 0) {
        return task.daysOfWeek.some((day) => day === selectedDayShort);
      }
      return true;
    } else {
      if (task.daysOfWeek && task.daysOfWeek.length > 0) {
        return task.daysOfWeek.some((day) => day === selectedDayShort);
      }
      return true;
    }
  }

  const filteredByDate = actionItems.filter((task: ActionItem) => isTaskForDate(task, selectedDate));

  const filteredTasks = filteredByDate.filter((task: ActionItem) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return !task.isCompleted;
    if (taskFilter === 'completed') return task.isCompleted;
    return true;
  });

  const completeTaskMutation = useCompleteActionItem();
  const undoTaskCompletionMutation = useUndoTaskCompletion();

  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<'happy' | 'neutral' | 'sad' | null>(null);
  const [taskForFeedback, setTaskForFeedback] = useState<ActionItem | null>(null);

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
        });
        toast.success('Task marked as incomplete');
      } else {
        await completeTaskMutation.mutateAsync({
          taskId: task.id,
          completionData: {
            clientId: session?.user?.id || '',
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

  return (
    <div className='min-h-screen '>
      {/* Header */}
      <div className='px-4 sm:px-6 lg:px-8 pt-6 pb-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <SidebarToggleButton />
            <h1
              className='text-2xl font-bold text-gray-900 lg:hidden'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Continuum
            </h1>
          </div>
          <Avatar className='h-10 w-10 block sm:hidden ml-2'>
            <AvatarImage
              src={getAvatarUrl(currentUser?.avatarUrl, currentUser)}
              alt={getUserDisplayName(currentUser) || 'User'}
            />
            <AvatarFallback>{getInitials(currentUser || 'U')}</AvatarFallback>
          </Avatar>
        </div>
        <div className='mt-4'>
          <h1 className='text-2xl font-bold text-gray-900' style={{ fontFamily: "'Playfair Display', serif" }}>
            {userLoading ? 'Loading...' : `Welcome back  ${currentUser?.firstName || 'User'}`}
          </h1>
          <p className='text-sm text-gray-600'>Let's have a great day today</p>
        </div>
      </div>

      {/* Tasks Section Header */}
      <div className='px-4 sm:px-6 lg:px-8 flex items-center justify-between mt-2 mb-4'>
        <h2 className='text-lg sm:text-xl font-bold text-gray-900' style={{ fontFamily: "'Playfair Display', serif" }}>
          Tasks
        </h2>
        <button
          ref={dateButtonRef}
          className='text-xs px-3 py-2 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition shadow-sm flex items-center gap-2'
          onClick={() => setShowDatePicker((v) => !v)}
          type='button'
        >
          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </button>
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
                      minWidth: pickerPosition.width,
                    }
              }
              role='dialog'
              aria-modal='true'
            >
              <DateRange
                editableDateInputs={true}
                onChange={(ranges) => {
                  const selection = ranges.selection;
                  if (selection) {
                    setDateRange({
                      startDate: selection.startDate || dateRange.startDate,
                      endDate: selection.startDate || dateRange.endDate,
                      key: 'selection',
                    });
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
      <div className='px-4 sm:px-6 lg:px-8 grid grid-cols-2 gap-4 mb-6'>
        <Card className='bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center'>
          <span className='text-2xl font-bold text-gray-900'>{tasksPending}</span>
          <span className='text-xs text-gray-600 mt-1'>Tasks Pending</span>
        </Card>
        <Card
          className='bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition'
          onClick={() => (window.location.href = '/client/journals/new')}
        >
          <span className='text-2xl'>
            <Plus className='inline w-6 h-6 text-blue-500' />
          </span>
          <span className='text-xs text-gray-600 mt-1'>Add new journal entry</span>
        </Card>
      </div>

      {/* Task Lists */}
      <div className='px-4 sm:px-6 lg:px-8 flex flex-col gap-6'>
        {/* Mandatory Tasks Card */}
        <div className='bg-white rounded-2xl shadow-md p-8'>
          <div
            className='text-xl font-bold mb-4 cursor-pointer hover:text-gray-700 transition-colors'
            style={{ fontFamily: "'Playfair Display', serif" }}
            onClick={() => mandatoryTasks.length > 0 && handleTaskDetailClick(mandatoryTasks[0])}
          >
            Mandatory Tasks
          </div>
          <div className='flex flex-col gap-0'>
            {mandatoryTasks.length === 0 ? (
              <div className='text-muted-foreground text-sm mb-4 px-6 py-6'>No mandatory tasks for this date.</div>
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

        {/* Daily Tasks Card */}
        <div className='bg-white rounded-2xl shadow-md p-8'>
          <div
            className='text-xl font-bold mb-4 cursor-pointer hover:text-gray-700 transition-colors'
            style={{ fontFamily: "'Playfair Display', serif" }}
            onClick={() => dailyTasks.length > 0 && handleTaskDetailClick(dailyTasks[0])}
          >
            Daily Tasks
          </div>
          <div className='flex flex-col gap-0'>
            {dailyTasks.length === 0 ? (
              <div className='text-muted-foreground text-sm mb-4 px-6 py-6'>No daily tasks for this date.</div>
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

      {/* Feedback Modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className='w-[98vw] max-w-full sm:max-w-md p-2 sm:p-6 flex flex-col items-center rounded-xl overflow-y-auto max-h-[90vh] border border-gray-200 shadow-xl'>
          <DialogTitle asChild>
            <VisuallyHidden>Was this task helpful?</VisuallyHidden>
          </DialogTitle>
          <div className='text-center w-full mb-4 sm:mb-6'>
            <div
              className='text-lg sm:text-xl font-bold text-gray-900 mb-2'
              style={{ fontFamily: "'Playfair Display', serif" }}
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
            className='w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white'
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
