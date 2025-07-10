'use client';

import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { TaskEditorDialog } from './TaskEditorDialog';
import {
  useGetPlanWithSuggestions,
  useGetPlanStatus,
  useApproveSuggestion,
  useRejectSuggestion,
  useUpdateSuggestion,
  useAddCustomActionItem,
  useDeleteActionItem,
  useUpdateActionItem,
  usePublishPlan,
} from '@/lib/hooks/use-api';

interface ActionItem {
  id: string;
  description: string;
  category?: string;
  target?: string;
  frequency?: string;
  weeklyRepetitions?: number;
  isMandatory?: boolean;
  whyImportant?: string;
  recommendedActions?: string;
  toolsToHelp?: string;
  source: 'AI_SUGGESTED' | 'MANUAL';
  resources?: Array<{
    type: 'LINK' | 'PDF';
    url: string;
    title?: string;
  }>;
  daysOfWeek?: string[];
}

interface SuggestedActionItem {
  id: string;
  description: string;
  category?: string;
  target?: string;
  frequency?: string;
  weeklyRepetitions?: number;
  isMandatory?: boolean;
  whyImportant?: string;
  recommendedActions?: string;
  toolsToHelp?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  daysOfWeek?: string[];
}

interface PlanData {
  actionItems: ActionItem[];
  suggestedActionItems: SuggestedActionItem[];
}

interface PlanEditorProps {
  planId: string;
  sessionId: string;
  clientId: string;
  onPlanUpdated?: () => void;
  showHeader?: boolean;
  onPublishClick?: () => void;
  isPublishing?: boolean;
}

const DAYS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];

const ToolsToHelpDisplay: React.FC<{ toolsToHelp?: string }> = ({ toolsToHelp }) => {
  if (!toolsToHelp) return null;

  const parseToolsToHelp = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim());
    return lines.map((line) => {
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const url = urlMatch[1];
        const description = line
          .replace(url || '', '')
          .replace(/\s*-\s*$/, '')
          .trim();
        return { description, url };
      }
      return { description: line, url: null };
    });
  };

  const tools = parseToolsToHelp(toolsToHelp);

  return (
    <div className='mt-2'>
      <span className='text-xs text-muted-foreground'>Tools to help:</span>
      <div className='flex flex-wrap gap-2 mt-1'>
        {tools.map((tool, index) =>
          tool.url ? (
            <a
              key={index}
              href={tool.url}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full text-xs font-medium hover:bg-gray-300 transition-colors border border-gray-300'
              style={{ textDecoration: 'none' }}
            >
              <span role='img' aria-label='Link'>
                🔗
              </span>
              {tool.description || tool.url}
            </a>
          ) : (
            <span
              key={index}
              className='px-2 py-1 bg-gray-100 rounded-full text-xs text-muted-foreground border border-gray-200'
            >
              {tool.description}
            </span>
          ),
        )}
      </div>
    </div>
  );
};

export function PublishPlanButton({
  onClick,
  disabled,
  isPublishing,
}: {
  onClick: () => void;
  disabled: boolean;
  isPublishing: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className='bg-primary text-white rounded-full px-6 py-2 font-semibold shadow-none hover:bg-primary/90'
    >
      {isPublishing ? 'Publishing...' : 'Publish Plan'}
    </Button>
  );
}

export const PlanEditor: React.FC<PlanEditorProps> = ({
  planId,
  sessionId,
  clientId,
  onPlanUpdated,
  showHeader = true,
  onPublishClick,
  isPublishing,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<SuggestedActionItem | null>(null);
  const [complementaryTasks, setComplementaryTasks] = useState<SuggestedActionItem[]>([]);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskDialogInitialValues, setTaskDialogInitialValues] = useState<any>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [viewingSuggestion, setViewingSuggestion] = useState<SuggestedActionItem | null>(null);

  const [formData, setFormData] = useState({
    description: '',
    category: '',
    target: '',
    frequency: '',
    weeklyRepetitions: 1,
    isMandatory: false,
    whyImportant: '',
    recommendedActions: '',
    toolsToHelp: '',
  });

  const router = useRouter();

  const {
    data: planStatusData,
    isLoading: isPlanStatusLoading,
    error: planStatusError,
    refetch: refetchPlanStatus,
  } = useGetPlanStatus(planId);

  const {
    data: planData,
    isLoading: isPlanDataLoading,
    error: planDataError,
    refetch: refetchPlanData,
  } = useGetPlanWithSuggestions(planId);

  const approveSuggestionMutation = useApproveSuggestion();
  const rejectSuggestionMutation = useRejectSuggestion();
  const editSuggestionMutation = useUpdateSuggestion();
  const addCustomActionMutation = useAddCustomActionItem();
  const deleteActionItemMutation = useDeleteActionItem();
  const publishPlanMutation = usePublishPlan();
  const saveTaskMutation = useUpdateActionItem();

  const handleApproveSuggestion = (suggestionId: string) => {
    approveSuggestionMutation.mutate(suggestionId, {
      onSuccess: () => {
        toast.success('Action item approved');
        onPlanUpdated?.();
      },
      onError: () => {
        toast.error('Failed to approve action item');
      },
    });
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    rejectSuggestionMutation.mutate(suggestionId, {
      onSuccess: () => {
        toast.success('Action item rejected');
      },
      onError: () => {
        toast.error('Failed to reject action item');
      },
    });
  };

  const handleEditSuggestion = (suggestionId: string, updatedData: Partial<SuggestedActionItem>) => {
    editSuggestionMutation.mutate(
      { suggestionId, updatedData },
      {
        onSuccess: () => {
          toast.success('Suggestion updated');
        },
        onError: () => {
          toast.error('Failed to update suggestion');
        },
      },
    );
  };

  const handleAddCustomAction = () => {
    addCustomActionMutation.mutate(
      { planId, data: formData },
      {
        onSuccess: () => {
          toast.success('Custom action item added');
          setShowAddDialog(false);
          resetForm();
          onPlanUpdated?.();
        },
        onError: () => {
          toast.error('Failed to add action item');
        },
      },
    );
  };

  const handleDeleteActionItem = (itemId: string) => {
    deleteActionItemMutation.mutate(
      { planId, itemId },
      {
        onSuccess: () => {
          toast.success('Action item deleted');
          onPlanUpdated?.();
        },
        onError: () => {
          toast.error('Failed to delete action item');
        },
      },
    );
  };

  const handlePublishPlan = () => {
    onPublishClick?.();
  };

  const handleTaskDialogSave = (values: any) => {
    if (isEditingTask && editingTaskId) {
      saveTaskMutation.mutate(
        { planId, itemId: editingTaskId, data: values },
        {
          onSuccess: () => {
            toast.success('Task updated');
            setShowTaskDialog(false);
            setTaskDialogInitialValues(null);
            setIsEditingTask(false);
            setEditingTaskId(null);
            onPlanUpdated?.();
          },
          onError: () => {
            toast.error('Failed to save task');
          },
        },
      );
    } else {
      addCustomActionMutation.mutate(
        { planId, data: values },
        {
          onSuccess: () => {
            toast.success('Task added');
            setShowTaskDialog(false);
            setTaskDialogInitialValues(null);
            setIsEditingTask(false);
            setEditingTaskId(null);
            onPlanUpdated?.();
          },
          onError: () => {
            toast.error('Failed to save task');
          },
        },
      );
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      category: '',
      target: '',
      frequency: '',
      weeklyRepetitions: 1,
      isMandatory: false,
      whyImportant: '',
      recommendedActions: '',
      toolsToHelp: '',
    });
  };

  const handleAddTaskClick = () => {
    setTaskDialogInitialValues({
      description: '',
      category: '',
      target: '',
      frequency: '',
      weeklyRepetitions: 1,
      isMandatory: false,
      whyImportant: '',
      recommendedActions: '',
      toolsToHelp: '',
      daysOfWeek: [],
      resources: [],
    });
    setIsEditingTask(false);
    setEditingTaskId(null);
    setShowTaskDialog(true);
  };

  const handleEditTaskClick = (item: ActionItem) => {
    setTaskDialogInitialValues(item);
    setIsEditingTask(true);
    setEditingTaskId(item.id);
    setShowTaskDialog(true);
  };

  function toggleDay(item: ActionItem | SuggestedActionItem, day: string, isSessionTask: boolean) {
    const key = 'daysOfWeek';
    const days = item[key] || [];
    const newDays = days.includes(day) ? days.filter((d: string) => d !== day) : [...days, day];
    if (isSessionTask) {
      saveTaskMutation.mutate({
        planId,
        itemId: item.id,
        data: { ...item, [key]: newDays },
      });
    } else {
      editSuggestionMutation.mutate({
        suggestionId: item.id,
        updatedData: { ...item, [key]: newDays },
      });
    }
  }

  if (isPlanDataLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-2 text-sm text-muted-foreground'>Loading plan editor...</p>
        </div>
      </div>
    );
  }

  const actionItems = planData?.actionItems || [];
  const suggestedItems = planData?.suggestedActionItems || [];

  return (
    <div className='space-y-8 w-full max-w-[1350px] mx-auto px-2 sm:px-6 md:px-10'>
      <div className='rounded-3xl shadow-2xl bg-white p-6 sm:p-10 w-full mx-0' style={{ borderColor: '#B0B3B8' }}>
        <div className='flex items-center justify-between mb-2 sm:mb-4 border-b pb-2'>
          <div className='font-bold text-lg sm:text-xl text-gray-900 text-left underline underline-offset-4'>
            Tasks mentioned during session
          </div>
          <Button size='sm' variant='ghost' className='text-primary font-semibold' onClick={handleAddTaskClick}>
            + Add Task
          </Button>
        </div>
        <div className='space-y-0 divide-y divide-gray-200'>
          {actionItems.map((item: ActionItem) => (
            <div key={item.id} className='flex flex-col py-4 w-full'>
              <div className='flex flex-row items-center w-full'>
                <div className='font-semibold text-base sm:text-lg text-gray-900 flex items-center gap-2 min-w-[140px] flex-1'>
                  {item.description}
                </div>
                <div className='flex-1' />
                <div className='flex items-center gap-1 min-w-[70px] justify-end'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='hover:bg-gray-100'
                    onClick={() => handleEditTaskClick(item)}
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='hover:bg-gray-100 text-destructive'
                    onClick={() => handleDeleteActionItem(item.id)}
                    disabled={deleteActionItemMutation.isPending}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <div className='flex flex-row items-center w-full mt-1 text-xs'>
                <div className='text-gray-700 min-w-[110px]'>
                  Duration: <span className='font-medium'>15 Minutes</span>
                </div>
                <div className='flex-1 flex justify-center'>
                  <div className='flex items-center gap-1 min-w-[220px]'>
                    Weekly Repetition (Days):
                    {DAYS.map((d) => (
                      <span
                        key={d}
                        className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-semibold ml-1 ${item.daysOfWeek?.includes(d) ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300'}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <div className='flex items-center gap-1 min-w-[120px] justify-end pr-2'>
                  <Checkbox
                    checked={!!item.isMandatory}
                    onCheckedChange={(checked) => {
                      saveTaskMutation.mutate({
                        planId,
                        itemId: item.id,
                        data: { ...item, isMandatory: checked === true },
                      });
                    }}
                    className='scale-90'
                  />
                  <span className='text-gray-700 text-xs'>Mandatory Task?</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className='rounded-3xl shadow-2xl bg-white p-6 sm:p-10 w-full mx-0 mt-8' style={{ borderColor: '#B0B3B8' }}>
        <div className='flex items-center justify-between mb-2 sm:mb-4 border-b pb-2'>
          <div className='font-bold text-lg sm:text-xl flex items-center gap-2 text-gray-900 text-left underline underline-offset-4'>
            <span>✧</span> Complementary Tasks
          </div>
          <Button size='sm' variant='ghost' className='text-primary font-semibold'>
            + Generate More
          </Button>
        </div>
        <div className='space-y-0 divide-y divide-gray-200'>
          {suggestedItems.map((item: SuggestedActionItem) => (
            <div key={item.id} className='flex flex-col py-4 w-full'>
              <div className='flex flex-row items-center w-full'>
                <div
                  className='font-semibold text-base sm:text-lg text-gray-900 flex items-center gap-2 min-w-[140px] flex-1 cursor-pointer hover:underline'
                  onClick={() => setViewingSuggestion(item)}
                >
                  {item.description}
                </div>
                <div className='flex-1' />
                <div className='min-w-[140px] pl-2 flex items-center justify-end'>
                  <Button
                    size='sm'
                    variant='outline'
                    className='font-medium border-2 border-gray-800 rounded-lg'
                    onClick={() => handleApproveSuggestion(item.id)}
                    disabled={approveSuggestionMutation.isPending}
                  >
                    Add to Action Plan
                  </Button>
                </div>
              </div>
              <div className='flex flex-row items-center w-full mt-1 text-xs'>
                <div className='text-gray-700 min-w-[110px]'>
                  Duration: <span className='font-medium'>15 Minutes</span>
                </div>
                <div className='flex-1 flex justify-center'>
                  <div className='flex items-center gap-1 min-w-[220px]'>
                    Weekly Repetition (Days):
                    {DAYS.map((d) => (
                      <span
                        key={d}
                        className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-semibold ml-1 ${item.daysOfWeek?.includes(d) ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300'}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <div className='flex items-center gap-1 min-w-[120px] justify-end pr-2'>
                  <Checkbox
                    checked={!!item.isMandatory}
                    onCheckedChange={(checked) => {
                      editSuggestionMutation.mutate({
                        suggestionId: item.id,
                        updatedData: { ...item, isMandatory: checked === true },
                      });
                    }}
                    className='scale-90'
                  />
                  <span className='text-gray-700 text-xs'>Mandatory Task?</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <TaskEditorDialog
        open={showTaskDialog}
        onClose={() => setShowTaskDialog(false)}
        onSave={handleTaskDialogSave}
        initialValues={taskDialogInitialValues}
      />
      <TaskEditorDialog
        open={!!viewingSuggestion}
        onClose={() => setViewingSuggestion(null)}
        onSave={() => {}}
        initialValues={viewingSuggestion}
        readOnly={true}
      />
    </div>
  );
};
