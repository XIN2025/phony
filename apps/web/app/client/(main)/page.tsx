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
import { getAvatarUrl, getInitials, getUserDisplayName } from '@/lib/utils';

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

  // Format selectedDate as YYYY-MM-DD
  const selectedDateString = selectedDate.toISOString().slice(0, 10);

  // Fetch the active plan for the selected date
  const {
    data: activePlan,
    isLoading: planLoading,
    error: planError,
    refetch: refetchActivePlan,
  } = useGetActivePlanForDate(session?.user?.id || '', selectedDateString);

  // Use the actionItems from the active plan
  const actionItems =
    activePlan?.actionItems?.map((item: any) => {
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
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0); // Reset time to start of day

    if (task.isMandatory) {
      if (task.isCompleted) {
        // If task is completed, only show on its configured days
        if (task.daysOfWeek && task.daysOfWeek.length > 0) {
          return task.daysOfWeek.some((day) => day === selectedDayShort);
        }
        return true;
      } else {
        // If task is NOT completed, show on ALL future dates until completed
        // This makes mandatory tasks persist until they're done
        if (selectedDate >= today) {
          return true;
        }

        // For past dates, only show if it was scheduled for that day
        if (task.daysOfWeek && task.daysOfWeek.length > 0) {
          return task.daysOfWeek.some((day) => day === selectedDayShort);
        }
        return true;
      }
    } else {
      // For non-mandatory tasks, only show on their configured days
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

  // Track which task is being updated
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const handleTaskToggle = async (task: ActionItem) => {
    if (loadingTaskId) return; // Prevent double clicks
    setLoadingTaskId(task.id);
    if (task.isCompleted) {
      return;
    }

    try {
      await completeTaskMutation.mutateAsync({
        taskId: task.id,
        completionData: {
          clientId: session?.user?.id || '',
          rating: 5,
          journalEntry: '',
          achievedValue: '',
        },
      });
      toast.success('Task marked as completed!');
    } catch (error) {
      toast.error('Failed to complete task. Please try again.');
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;

    completeTaskMutation.mutate(
      {
        taskId: selectedTask.id,
        completionData: {
          clientId: session?.user?.id,
          rating: completionData.rating,
          journalEntry: completionData.journalEntry,
          achievedValue: completionData.achievedValue,
        },
      },
      {
        onSuccess: () => {
          setSelectedTask(null);
          setCompletionData({ rating: 0, journalEntry: '', achievedValue: '' });
        },
        onError: (error: any) => {},
      },
    );
  };

  useEffect(() => {}, [status, session]);

  useEffect(() => {}, [session, status]);

  // All hooks and variables must be defined before any return
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser();
  const completedTasks = filteredTasks.filter((task: ActionItem) => task.isCompleted);
  const avgCompletion = filteredTasks.length > 0 ? Math.round((completedTasks.length / filteredTasks.length) * 100) : 0;
  const tasksPending = filteredTasks.filter((task: ActionItem) => !task.isCompleted).length;
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<ActionItem | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<'happy' | 'neutral' | 'sad' | null>(null);
  const [taskForFeedback, setTaskForFeedback] = useState<ActionItem | null>(null);

  const handleTaskDetailClick = (task: ActionItem) => {
    setSelectedTaskForDetail(task);
    setIsTaskDetailOpen(true);
  };

  // Restore correct handleTaskToggleWithFeedback
  const handleTaskToggleWithFeedback = async (task: ActionItem) => {
    if (loadingTaskId) return; // Prevent double clicks
    setLoadingTaskId(task.id);
    if (task.isCompleted) {
      try {
        await undoTaskCompletionMutation.mutateAsync({
          taskId: task.id,
          clientId: session?.user?.id || '',
        });
        toast.success('Task marked as incomplete!');
        refetchActivePlan();
      } catch (error) {
        toast.error('Failed to undo task completion. Please try again.');
      } finally {
        setLoadingTaskId(null);
      }
      return;
    }
    setTaskForFeedback(task);
    setFeedbackOpen(true);
    setSelectedFeedback(null);
    setLoadingTaskId(null);
  };

  // Restore handleFeedbackSelect for feedback modal
  const handleFeedbackSelect = (type: 'happy' | 'neutral' | 'sad') => {
    setSelectedFeedback(type);
  };

  // Fix handleFeedbackSubmit to only use completeTaskMutation
  const handleFeedbackSubmit = async () => {
    if (!taskForFeedback || !selectedFeedback || loadingTaskId) return;
    setLoadingTaskId(taskForFeedback.id);
    try {
      await completeTaskMutation.mutateAsync({
        taskId: taskForFeedback.id,
        completionData: {
          clientId: session?.user?.id || '',
          rating: selectedFeedback === 'happy' ? 5 : selectedFeedback === 'neutral' ? 3 : 1,
          journalEntry: '',
          achievedValue: '',
        },
      });
      toast.success('Task marked as completed!');
      setFeedbackOpen(false);
      setSelectedFeedback(null);
      setTaskForFeedback(null);
      refetchActivePlan();
    } catch (error) {
      toast.error('Failed to complete task. Please try again.');
    } finally {
      setLoadingTaskId(null);
    }
  };

  return (
    <div className='flex flex-col w-full min-h-screen'>
      {/* Loading state for tasks */}
      {planLoading && (
        <div className='flex items-center justify-center min-h-screen p-4 fixed inset-0 bg-white/80 z-50'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-blue-700'>Loading your tasks...</p>
          </div>
        </div>
      )}
      {/* Header Section */}
      <div className='px-4 py-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <SidebarToggleButton />
            {/* Show 'Continuum' only on small screens, next to the sidebar toggle */}
            <span
              className='ml-3 text-xl font-bold text-primary sm:hidden'
              style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '0.05em' }}
            >
              Continuum
            </span>
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
            {userLoading ? 'Loading...' : `Good morning ${currentUser?.firstName || 'User'}`}
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
          className='bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center cursor-pointer'
          onClick={() => (window.location.href = '/client/journals/new')}
        >
          <span className='text-2xl'>
            <Calendar className='inline w-6 h-6 text-blue-500' />
          </span>
          <span className='text-xs text-gray-600 mt-1'>Add new journal entry</span>
        </Card>
      </div>

      {/* Task Lists */}
      <div className='px-4 sm:px-6 lg:px-8 flex flex-col gap-6'>
        {/* Mandatory Tasks Card */}
        <Card className='bg-white rounded-xl shadow-md p-4 mb-2'>
          <CardHeader className='p-0 mb-2'>
            <CardTitle
              className='text-base sm:text-lg font-bold text-gray-900'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Mandatory Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {filteredTasks.filter((task: ActionItem) => task.isMandatory).length === 0 ? (
              <div className='text-center text-gray-400 text-sm py-4'>No mandatory tasks</div>
            ) : (
              <div className='space-y-3'>
                {filteredTasks
                  .filter((task: ActionItem) => task.isMandatory)
                  .map((task: ActionItem) => (
                    <div key={task.id} className='flex items-center gap-3'>
                      <Checkbox
                        checked={task.isCompleted}
                        onCheckedChange={() => handleTaskToggleWithFeedback(task)}
                        className='flex-shrink-0'
                        data-checkbox='true'
                        disabled={loadingTaskId === task.id}
                      />
                      <span
                        className={`font-semibold text-sm ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                      >
                        {task.description}
                      </span>
                      <button className='ml-auto' tabIndex={-1}>
                        <Info className='w-4 h-4 text-gray-400' />
                      </button>
                      <div className='flex items-center gap-1'>
                        <button
                          onClick={() => {
                            setTaskForFeedback(task);
                            setFeedbackOpen(true);
                            setSelectedFeedback(null);
                          }}
                          className='rounded-full p-1 hover:bg-gray-100'
                        >
                          <Smile className='w-4 h-4 text-green-500' />
                        </button>
                        <button
                          onClick={() => {
                            setTaskForFeedback(task);
                            setFeedbackOpen(true);
                            setSelectedFeedback(null);
                          }}
                          className='rounded-full p-1 hover:bg-gray-100'
                        >
                          <Meh className='w-4 h-4 text-yellow-500' />
                        </button>
                        <button
                          onClick={() => {
                            setTaskForFeedback(task);
                            setFeedbackOpen(true);
                            setSelectedFeedback(null);
                          }}
                          className='rounded-full p-1 hover:bg-gray-100'
                        >
                          <Frown className='w-4 h-4 text-red-500' />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Tasks Card */}
        <Card className='bg-white rounded-xl shadow-md p-4 mb-2'>
          <CardHeader className='p-0 mb-2'>
            <CardTitle
              className='text-base sm:text-lg font-bold text-gray-900'
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Daily Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {filteredTasks.filter((task: ActionItem) => !task.isMandatory).length === 0 ? (
              <div className='text-center text-gray-400 text-sm py-4'>No daily tasks</div>
            ) : (
              <div className='space-y-3'>
                {filteredTasks
                  .filter((task: ActionItem) => !task.isMandatory)
                  .map((task: ActionItem) => (
                    <div key={task.id} className='flex items-center gap-3'>
                      <Checkbox
                        checked={task.isCompleted}
                        onCheckedChange={() => handleTaskToggleWithFeedback(task)}
                        className='flex-shrink-0'
                        data-checkbox='true'
                        disabled={loadingTaskId === task.id}
                      />
                      <span
                        className={`font-semibold text-sm ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                      >
                        {task.description}
                      </span>
                      <button className='ml-auto' tabIndex={-1}>
                        <Info className='w-4 h-4 text-gray-400' />
                      </button>
                      <div className='flex items-center gap-1'>
                        <button
                          onClick={() => {
                            setTaskForFeedback(task);
                            setFeedbackOpen(true);
                            setSelectedFeedback(null);
                          }}
                          className='rounded-full p-1 hover:bg-gray-100'
                        >
                          <Smile className='w-4 h-4 text-green-500' />
                        </button>
                        <button
                          onClick={() => {
                            setTaskForFeedback(task);
                            setFeedbackOpen(true);
                            setSelectedFeedback(null);
                          }}
                          className='rounded-full p-1 hover:bg-gray-100'
                        >
                          <Meh className='w-4 h-4 text-yellow-500' />
                        </button>
                        <button
                          onClick={() => {
                            setTaskForFeedback(task);
                            setFeedbackOpen(true);
                            setSelectedFeedback(null);
                          }}
                          className='rounded-full p-1 hover:bg-gray-100'
                        >
                          <Frown className='w-4 h-4 text-red-500' />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
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
              How was this task?
            </div>
            <p className='text-sm text-gray-600'>Your feedback helps us improve your experience</p>
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
            className='w-full mt-4'
          >
            {loadingTaskId ? (
              <span className='flex items-center justify-center gap-2'>
                <span className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500'></span> Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPage;
