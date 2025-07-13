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
  useGetClientPlans,
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

  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useGetClientPlans(session?.user?.id || '');

  const mostRecentPlan = Array.isArray(plans) && plans.length > 0 ? plans[0] : null;
  const actionItems = mostRecentPlan
    ? mostRecentPlan.actionItems.map((item: any) => {
        const isCompleted = item.completions && item.completions.length > 0;
        console.log(
          `Task ${item.id} (${item.description}): completions=${item.completions?.length || 0}, isCompleted=${isCompleted}`,
        );
        return {
          ...item,
          isCompleted,
        };
      })
    : [];

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

  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
    key: 'selection',
  });
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
    if (task.isMandatory) {
      if (task.isCompleted) {
        const dayOfWeek = date.getDay();
        const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
        const selectedDayShort = dayMap[dayOfWeek];

        if (task.daysOfWeek && task.daysOfWeek.length > 0) {
          return task.daysOfWeek.some((day) => day === selectedDayShort);
        }
        return true;
      } else {
        const today = new Date();
        const selectedDate = date;

        if (selectedDate >= today) {
          return true;
        }

        const dayOfWeek = selectedDate.getDay();
        const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
        const selectedDayShort = dayMap[dayOfWeek];

        if (task.daysOfWeek && task.daysOfWeek.length > 0) {
          return task.daysOfWeek.some((day) => day === selectedDayShort);
        }
        return true;
      }
    } else {
      const dayOfWeek = date.getDay();
      const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
      const selectedDayShort = dayMap[dayOfWeek];

      if (task.daysOfWeek && task.daysOfWeek.length > 0) {
        return task.daysOfWeek.some((day) => day === selectedDayShort);
      }

      return true;
    }
  }

  const selectedDate = dateRange.startDate;
  const filteredByDate = actionItems.filter((task: ActionItem) => isTaskForDate(task, selectedDate));

  const filteredTasks = filteredByDate.filter((task: ActionItem) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return !task.isCompleted;
    if (taskFilter === 'completed') return task.isCompleted;
    return true;
  });

  const completeTaskMutation = useCompleteActionItem();
  const undoTaskCompletionMutation = useUndoTaskCompletion();

  const handleTaskToggle = async (task: ActionItem) => {
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
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task. Please try again.');
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

  if (status === 'loading') {
    return (
      <div className='flex items-center justify-center min-h-screen p-4'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className='flex items-center justify-center min-h-screen p-4'>
        <div className='text-center'>
          <p className='text-gray-600'>Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

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

  const handleTaskToggleWithFeedback = async (task: ActionItem) => {
    console.log('handleTaskToggleWithFeedback called for task:', task.id, 'isCompleted:', task.isCompleted);

    if (task.isCompleted) {
      console.log('Task is completed, attempting to undo...');
      try {
        await undoTaskCompletionMutation.mutateAsync({
          taskId: task.id,
          clientId: session?.user?.id || '',
        });
        toast.success('Task marked as incomplete!');
        // Force refetch to ensure UI updates
        refetchPlans();
      } catch (error) {
        console.error('Failed to undo task completion:', error);
        toast.error('Failed to undo task completion. Please try again.');
      }
      return;
    }

    console.log('Task is not completed, opening feedback modal...');
    setTaskForFeedback(task);
    setFeedbackOpen(true);
    setSelectedFeedback(null);
  };

  const handleFeedbackSelect = (type: 'happy' | 'neutral' | 'sad') => {
    setSelectedFeedback(type);
  };

  const handleFeedbackSubmit = async () => {
    if (!taskForFeedback || !selectedFeedback) return;

    console.log('handleFeedbackSubmit called for task:', taskForFeedback.id, 'feedback:', selectedFeedback);

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
      console.log('Task completion successful');
      toast.success('Task marked as completed!');
      setFeedbackOpen(false);
      setSelectedFeedback(null);
      setTaskForFeedback(null);
      // Force refetch to ensure UI updates
      refetchPlans();
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task. Please try again.');
    }
  };

  return (
    <div className='flex flex-col w-full min-h-screen'>
      {/* Header Section */}
      <div className='px-4 py-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            <SidebarToggleButton />
            <div className='min-w-0 flex-1'>
              <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate'>
                {userLoading ? 'Loading...' : `Good Morning ${currentUser?.firstName || 'User'}`}
              </h1>
              <p className='text-sm text-gray-600 hidden sm:block'>Let's make today productive!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 px-4 py-4 sm:px-6 lg:px-8  mx-auto w-full'>
        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
          <Card className='bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer'>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex flex-col min-w-0 flex-1'>
                  <span className='text-xs sm:text-sm font-semibold text-blue-700 mb-1'>Task Completion</span>
                  <span className='text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900'>{avgCompletion}%</span>
                  <span className='text-xs text-green-600 mt-1 flex items-center gap-1'>
                    <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
                    +5% from last week
                  </span>
                </div>
                <div className='p-2 sm:p-3 bg-blue-500/20 rounded-full flex-shrink-0 ml-2'>
                  <Target className='h-4 w-4 sm:h-5 sm:w-5 text-blue-700' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer'>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex justify-between items-start'>
                <div className='flex flex-col min-w-0 flex-1'>
                  <span className='text-xs sm:text-sm font-semibold text-purple-700 mb-1'>Tasks Pending</span>
                  <span className='text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-900'>{tasksPending}</span>
                  <span className='text-xs text-purple-600 mt-1 flex items-center gap-1'>
                    <span className='w-1.5 h-1.5 bg-purple-500 rounded-full'></span>
                    Ready to tackle
                  </span>
                </div>
                <div className='p-2 sm:p-3 bg-purple-500/20 rounded-full flex-shrink-0 ml-2'>
                  <Clock className='h-4 w-4 sm:h-5 sm:w-5 text-purple-700' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Container */}
        <Card className='shadow-sm border border-gray-200'>
          <CardContent className='p-4 sm:p-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4'>
              <div>
                <h2 className='text-lg sm:text-xl font-bold text-gray-900 mb-1'>Your Tasks</h2>
                <p className='text-sm text-gray-600'>Manage your daily activities and goals</p>
              </div>
              <div className='flex flex-wrap gap-2 justify-start sm:justify-end items-center'>
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
                <Button
                  variant='outline'
                  size='sm'
                  className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                    taskFilter === 'all'
                      ? 'bg-white text-gray-900 border-gray-800 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setTaskFilter('all')}
                >
                  All Tasks
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                    taskFilter === 'pending'
                      ? 'bg-white text-gray-900 border-gray-800 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setTaskFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                    taskFilter === 'completed'
                      ? 'bg-white text-gray-900 border-gray-800 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setTaskFilter('completed')}
                >
                  Completed
                </Button>
              </div>
            </div>

            {/* Mandatory Tasks */}
            {filteredTasks.filter((task: ActionItem) => task.isMandatory).length > 0 && (
              <div className='mb-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='p-1.5 bg-red-100 rounded-lg'>
                    <Star className='w-4 h-4 text-red-600' />
                  </div>
                  <div>
                    <h3 className='text-base sm:text-lg font-bold text-gray-900'>Mandatory Tasks</h3>
                    <p className='text-xs sm:text-sm text-gray-600'>Essential tasks for this week</p>
                  </div>
                </div>
                <div className='space-y-3'>
                  {filteredTasks
                    .filter((task: ActionItem) => task.isMandatory)
                    .map((task: ActionItem) => (
                      <div
                        key={task.id}
                        className='group border border-gray-200 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-blue-50/50 transition-all duration-200 shadow-sm hover:shadow-md'
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('[data-checkbox]')) {
                            handleTaskDetailClick(task);
                          }
                        }}
                      >
                        <div className='flex items-start gap-3'>
                          <Checkbox
                            checked={task.isCompleted}
                            onCheckedChange={() => handleTaskToggleWithFeedback(task)}
                            className='mt-0.5 flex-shrink-0'
                            data-checkbox='true'
                          />
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-start justify-between gap-2'>
                              <span
                                className={`font-semibold text-sm sm:text-base leading-relaxed ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}
                              >
                                {task.description}
                              </span>
                              <div className='flex items-center gap-1 flex-shrink-0'>
                                {task.isMandatory && (
                                  <Badge variant='outline' className='text-xs bg-red-100 text-red-700 border-red-200'>
                                    <Star className='w-3 h-3 mr-1' />
                                    Required
                                  </Badge>
                                )}
                                {task.isCompleted && (
                                  <Badge
                                    variant='default'
                                    className='text-xs bg-green-100 text-green-700 border-green-200'
                                  >
                                    <CheckCircle className='w-3 h-3 mr-1' />
                                    Done
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className='flex items-center gap-2 mt-1'>
                              <Clock className='w-3 h-3 text-gray-500' />
                              <span className='text-xs text-gray-600 mt-1 block'>
                                {(task.daysOfWeek ?? []).length === 0
                                  ? 'Daily'
                                  : (task.daysOfWeek ?? [])
                                      .filter((d): d is string => typeof d === 'string')
                                      .map((d: string) => DAY_NAME_MAP[d] || d)
                                      .join(', ')}
                              </span>
                            </div>
                            {/* Show resources if available */}
                            {task.resources && task.resources.length > 0 && (
                              <div className='flex flex-wrap gap-1 mt-2'>
                                {task.resources.map((resource, index) => (
                                  <div
                                    key={index}
                                    className='flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs'
                                  >
                                    {resource.type === 'LINK' ? (
                                      <span role='img' aria-label='Link' className='text-blue-600'>
                                        🔗
                                      </span>
                                    ) : (
                                      <span role='img' aria-label='File' className='text-blue-600'>
                                        📄
                                      </span>
                                    )}
                                    <a
                                      href={
                                        resource.type === 'LINK'
                                          ? resource.url
                                          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${resource.url}`
                                      }
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-blue-800 hover:underline truncate max-w-[120px]'
                                      title={resource.title || resource.url}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      {resource.title || resource.url}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Daily Tasks */}
            {filteredTasks.filter((task: ActionItem) => !task.isMandatory).length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='p-1.5 bg-green-100 rounded-lg'>
                    <Target className='w-4 h-4 text-green-600' />
                  </div>
                  <div>
                    <h3 className='text-base sm:text-lg font-bold text-gray-900'>Daily Tasks</h3>
                    <p className='text-xs sm:text-sm text-gray-600'>Regular activities and goals</p>
                  </div>
                </div>
                <div className='space-y-3'>
                  {filteredTasks
                    .filter((task: ActionItem) => !task.isMandatory)
                    .map((task: ActionItem) => (
                      <div
                        key={task.id}
                        className='group border border-gray-200 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-green-50/50 transition-all duration-200 shadow-sm hover:shadow-md'
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('[data-checkbox]')) {
                            handleTaskDetailClick(task);
                          }
                        }}
                      >
                        <div className='flex items-start gap-3'>
                          <Checkbox
                            checked={task.isCompleted}
                            onCheckedChange={() => handleTaskToggleWithFeedback(task)}
                            className='mt-0.5 flex-shrink-0'
                            data-checkbox='true'
                          />
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-start justify-between gap-2'>
                              <span
                                className={`font-semibold text-sm sm:text-base leading-relaxed ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}
                              >
                                {task.description}
                              </span>
                              {task.isCompleted && (
                                <Badge
                                  variant='default'
                                  className='text-xs bg-green-100 text-green-700 border-green-200 flex-shrink-0'
                                >
                                  <CheckCircle className='w-3 h-3 mr-1' />
                                  Done
                                </Badge>
                              )}
                            </div>
                            <div className='flex items-center gap-2 mt-1'>
                              <Clock className='w-3 h-3 text-gray-500' />
                              <span className='text-xs text-gray-600 mt-1 block'>
                                {(task.daysOfWeek ?? []).length === 0
                                  ? 'Daily'
                                  : (task.daysOfWeek ?? [])
                                      .filter((d): d is string => typeof d === 'string')
                                      .map((d: string) => DAY_NAME_MAP[d] || d)
                                      .join(', ')}
                              </span>
                            </div>
                            {/* Show resources if available */}
                            {task.resources && task.resources.length > 0 && (
                              <div className='flex flex-wrap gap-1 mt-2'>
                                {task.resources.map((resource, index) => (
                                  <div
                                    key={index}
                                    className='flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full text-xs'
                                  >
                                    {resource.type === 'LINK' ? (
                                      <span role='img' aria-label='Link' className='text-green-600'>
                                        🔗
                                      </span>
                                    ) : (
                                      <span role='img' aria-label='File' className='text-green-600'>
                                        📄
                                      </span>
                                    )}
                                    <a
                                      href={
                                        resource.type === 'LINK'
                                          ? resource.url
                                          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${resource.url}`
                                      }
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-green-800 hover:underline truncate max-w-[120px]'
                                      title={resource.title || resource.url}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      {resource.title || resource.url}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredTasks.length === 0 && (
              <div className='text-center py-8'>
                <div className='w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <Target className='w-8 h-8 text-gray-400' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  {filteredByDate.length === 0
                    ? 'No tasks for this date'
                    : taskFilter === 'completed'
                      ? 'No completed tasks yet'
                      : taskFilter === 'pending'
                        ? 'No pending tasks'
                        : 'No tasks yet'}
                </h3>
                <p className='text-sm text-gray-600'>
                  {filteredByDate.length === 0
                    ? 'Try selecting a different date or check with your practitioner.'
                    : taskFilter === 'completed'
                      ? 'Complete some tasks to see them here.'
                      : taskFilter === 'pending'
                        ? 'All tasks for this date are completed!'
                        : 'Your practitioner will assign tasks for you soon.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskForDetail && (
        <TaskEditorDialog
          open={isTaskDetailOpen}
          onClose={() => setIsTaskDetailOpen(false)}
          onSave={() => {}}
          initialValues={{
            description: selectedTaskForDetail.description,
            category: selectedTaskForDetail.category || '',
            frequency: selectedTaskForDetail.frequency || '',
            weeklyRepetitions: selectedTaskForDetail.weeklyRepetitions || 1,
            daysOfWeek: selectedTaskForDetail.daysOfWeek || [],
            whyImportant: selectedTaskForDetail.whyImportant || '',
            recommendedActions: selectedTaskForDetail.recommendedActions || '',
            toolsToHelp: selectedTaskForDetail.toolsToHelp || '',
            resources: selectedTaskForDetail.resources || [],
          }}
          readOnly={true}
        />
      )}

      {/* Feedback Modal */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className='w-[95vw] max-w-[95vw] sm:max-w-md p-4 sm:p-6 flex flex-col items-center rounded-2xl overflow-y-auto max-h-[90vh] border border-gray-200 shadow-xl'>
          <DialogTitle asChild>
            <VisuallyHidden>Was this task helpful?</VisuallyHidden>
          </DialogTitle>
          <div className='text-center w-full mb-4 sm:mb-6'>
            <div className='text-lg sm:text-xl font-bold text-gray-900 mb-2'>How was this task?</div>
            <p className='text-sm text-gray-600'>Your feedback helps us improve your experience</p>
          </div>
          <div className='flex flex-row items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6 w-full'>
            <button
              aria-label='Happy'
              className={`rounded-full p-3 sm:p-4 border-2 transition-all duration-200 hover:scale-105 ${
                selectedFeedback === 'happy'
                  ? 'border-green-500 bg-green-50 shadow-lg'
                  : 'border-gray-300 hover:border-green-300 hover:bg-green-50/50'
              }`}
              onClick={() => handleFeedbackSelect('happy')}
            >
              <Smile className='w-8 h-8 sm:w-10 sm:h-10 text-green-600' />
            </button>
            <button
              aria-label='Neutral'
              className={`rounded-full p-3 sm:p-4 border-2 transition-all duration-200 hover:scale-105 ${
                selectedFeedback === 'neutral'
                  ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                  : 'border-gray-300 hover:border-yellow-300 hover:bg-yellow-50/50'
              }`}
              onClick={() => handleFeedbackSelect('neutral')}
            >
              <Meh className='w-8 h-8 sm:w-10 sm:h-10 text-yellow-600' />
            </button>
            <button
              aria-label='Sad'
              className={`rounded-full p-3 sm:p-4 border-2 transition-all duration-200 hover:scale-105 ${
                selectedFeedback === 'sad'
                  ? 'border-red-500 bg-red-50 shadow-lg'
                  : 'border-gray-300 hover:border-red-300 hover:bg-red-50/50'
              }`}
              onClick={() => handleFeedbackSelect('sad')}
            >
              <Frown className='w-8 h-8 sm:w-10 sm:h-10 text-red-600' />
            </button>
          </div>
          <button
            className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full py-3 sm:py-4 text-sm sm:text-base font-semibold disabled:opacity-50 transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transform hover:scale-[1.02]'
            onClick={handleFeedbackSubmit}
            disabled={!selectedFeedback}
          >
            Submit Feedback
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientPage;
