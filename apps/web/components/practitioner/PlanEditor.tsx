'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Badge } from '@repo/ui/components/badge';
import { Plus, Trash2, Edit, Check, X, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { ApiClient } from '@/lib/api-client';
import { TaskEditorDialog } from './TaskEditorDialog';

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
}

const DAYS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];

export const PlanEditor: React.FC<PlanEditorProps> = ({ planId, sessionId, clientId, onPlanUpdated }) => {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<SuggestedActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
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

  useEffect(() => {
    loadPlanData();
  }, [planId]);

  const loadPlanData = async () => {
    try {
      setIsLoading(true);
      const planData = await ApiClient.get<PlanData>(`/api/plans/${planId}/with-suggestions`);

      setActionItems(planData.actionItems || []);
      setSuggestedItems(planData.suggestedActionItems || []);
    } catch (error) {
      console.error('Failed to load plan data:', error);
      toast.error('Failed to load plan data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSuggestion = async (suggestionId: string) => {
    try {
      await ApiClient.post(`/api/plans/suggestions/${suggestionId}/approve`);
      toast.success('Action item approved');
      loadPlanData();
      onPlanUpdated?.();
    } catch (error) {
      console.error('Failed to approve suggestion:', error);
      toast.error('Failed to approve action item');
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      await ApiClient.post(`/api/plans/suggestions/${suggestionId}/reject`);
      toast.success('Action item rejected');
      loadPlanData();
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
      toast.error('Failed to reject action item');
    }
  };

  const handleEditSuggestion = async (suggestionId: string, updatedData: Partial<SuggestedActionItem>) => {
    try {
      await ApiClient.patch(`/api/plans/suggestions/${suggestionId}`, updatedData);
      toast.success('Suggestion updated');
      loadPlanData();
    } catch (error) {
      console.error('Failed to update suggestion:', error);
      toast.error('Failed to update suggestion');
    }
  };

  const handleAddCustomAction = async () => {
    try {
      await ApiClient.post(`/api/plans/${planId}/action-items`, formData);
      toast.success('Custom action item added');
      setShowAddDialog(false);
      resetForm();
      loadPlanData();
      onPlanUpdated?.();
    } catch (error) {
      console.error('Failed to add custom action item:', error);
      toast.error('Failed to add action item');
    }
  };

  const handleDeleteActionItem = async (itemId: string) => {
    try {
      await ApiClient.delete(`/api/plans/${planId}/action-items/${itemId}`);
      toast.success('Action item deleted');
      loadPlanData();
      onPlanUpdated?.();
    } catch (error) {
      console.error('Failed to delete action item:', error);
      toast.error('Failed to delete action item');
    }
  };

  const handlePublishPlan = async () => {
    try {
      setIsPublishing(true);
      await ApiClient.patch(`/api/plans/${planId}/publish`);
      toast.success('Plan published to client!');
      await loadPlanData();
      onPlanUpdated?.();
    } catch (error) {
      console.error('Failed to publish plan:', error);
      toast.error('Failed to publish plan');
    } finally {
      setIsPublishing(false);
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

  function isSuggestedActionItem(item: any): item is SuggestedActionItem {
    return item && typeof item === 'object' && 'status' in item;
  }

  const renderActionItemRow = (item: ActionItem, isSuggested = false) => (
    <div key={item.id} className='flex items-center gap-4 p-4 border rounded-lg bg-background'>
      <div className='flex-1'>
        <div className='flex items-start gap-3'>
          <div className='flex-1'>
            <p className='font-medium text-sm'>{item.description}</p>
            <div className='flex flex-wrap gap-2 mt-2'>
              {item.category && (
                <Badge variant='secondary' className='text-xs'>
                  {item.category}
                </Badge>
              )}
              {item.target && (
                <Badge variant='outline' className='text-xs'>
                  Target: {item.target}
                </Badge>
              )}
              {item.frequency && (
                <Badge variant='outline' className='text-xs'>
                  {item.frequency}
                </Badge>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Select value={item.weeklyRepetitions?.toString() || '1'} onValueChange={(value) => {}}>
              <SelectTrigger className='w-20 h-8'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Checkbox checked={!!item.isMandatory} onCheckedChange={(checked) => {}} />

            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                if (isSuggested && isSuggestedActionItem(item)) {
                  setEditingSuggestion(item);
                } else {
                  setEditingItem(item);
                }
              }}
            >
              <Edit className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleDeleteActionItem(item.id)}
              className='text-destructive hover:text-destructive'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuggestedItemRow = (item: SuggestedActionItem) => (
    <div key={item.id} className='flex items-center gap-4 p-4 border rounded-lg bg-muted/20'>
      <div className='flex-1'>
        <div className='flex items-start gap-3'>
          <div className='flex-1'>
            <p className='font-medium text-sm'>{item.description}</p>
            <div className='flex flex-wrap gap-2 mt-2'>
              {item.category && (
                <Badge variant='secondary' className='text-xs'>
                  {item.category}
                </Badge>
              )}
              {item.target && (
                <Badge variant='outline' className='text-xs'>
                  Target: {item.target}
                </Badge>
              )}
              {item.frequency && (
                <Badge variant='outline' className='text-xs'>
                  {item.frequency}
                </Badge>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Select
              value={item.weeklyRepetitions?.toString() || '1'}
              onValueChange={(value) => {
                handleEditSuggestion(item.id, { weeklyRepetitions: parseInt(value) });
              }}
            >
              <SelectTrigger className='w-20 h-8'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Checkbox
              checked={!!item.isMandatory}
              onCheckedChange={(checked) => {
                handleEditSuggestion(item.id, { isMandatory: checked === true });
              }}
            />

            <Button variant='ghost' size='sm' onClick={() => setEditingSuggestion(item)}>
              <Edit className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleApproveSuggestion(item.id)}
              className='text-green-600 hover:text-green-700'
            >
              <Check className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleRejectSuggestion(item.id)}
              className='text-destructive hover:text-destructive'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper to toggle days
  function toggleDay(item: any, day: string, isSessionTask: boolean) {
    const key = 'daysOfWeek';
    const days = item[key] || [];
    const newDays = days.includes(day) ? days.filter((d: string) => d !== day) : [...days, day];
    if (isSessionTask) {
      setActionItems((prev) => prev.map((t) => (t.id === item.id ? { ...t, [key]: newDays } : t)));
    } else {
      setSuggestedItems((prev) => prev.map((t) => (t.id === item.id ? { ...t, [key]: newDays } : t)));
    }
  }

  // Open dialog for new task
  const handleAddTaskClick = () => {
    setTaskDialogInitialValues(null);
    setIsEditingTask(false);
    setEditingTaskId(null);
    setShowTaskDialog(true);
  };

  // Open dialog for editing
  const handleEditTaskClick = (item: ActionItem) => {
    setTaskDialogInitialValues(item);
    setIsEditingTask(true);
    setEditingTaskId(item.id);
    setShowTaskDialog(true);
  };

  // Save handler for dialog
  const handleTaskDialogSave = async (values: any) => {
    try {
      if (isEditingTask && editingTaskId) {
        await ApiClient.patch(`/api/plans/${planId}/action-items/${editingTaskId}`, values);
        toast.success('Task updated');
      } else {
        await ApiClient.post(`/api/plans/${planId}/action-items`, values);
        toast.success('Task added');
      }
      setShowTaskDialog(false);
      setTaskDialogInitialValues(null);
      setIsEditingTask(false);
      setEditingTaskId(null);
      loadPlanData();
      onPlanUpdated?.();
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-2 text-sm text-muted-foreground'>Loading plan editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 w-full px-2 sm:px-6 md:px-10   '>
      {/* Tasks mentioned during session */}
      <div
        className='rounded-3xl border-2 border-gray-700 shadow-sm bg-white p-4 sm:p-6 w-full mx-0'
        style={{ borderColor: '#B0B3B8' }}
      >
        <div className='flex items-center justify-between mb-2 sm:mb-4 border-b pb-2'>
          <div className='font-bold text-lg sm:text-xl text-gray-900 text-left underline underline-offset-4'>
            Tasks mentioned during session
          </div>
          <Button size='sm' variant='ghost' className='text-primary font-semibold' onClick={handleAddTaskClick}>
            + Add Task
          </Button>
        </div>
        <div className='space-y-0 divide-y divide-gray-200'>
          {actionItems.map((item) => (
            <div key={item.id} className='flex flex-col py-4 w-full'>
              {/* Top line: Task name + actions */}
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
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              {/* Bottom line: Duration, Days, Mandatory Task */}
              <div className='flex flex-row items-center w-full mt-1 text-xs'>
                <div className='text-gray-700 min-w-[110px]'>
                  Duration: <span className='font-medium'>15 Minutes</span>
                </div>
                {/* Centered Days */}
                <div className='flex-1 flex justify-center'>
                  <div className='flex items-center gap-1 min-w-[220px]'>
                    Weekly Repetition (Days):
                    {DAYS.map((d) => (
                      <span
                        key={d}
                        className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-semibold ml-1 cursor-pointer transition-colors ${item.daysOfWeek?.includes(d) ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}
                        onClick={() => toggleDay(item, d, true)}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Mandatory Task */}
                <div className='flex items-center gap-1 min-w-[120px] justify-end pr-2'>
                  <Checkbox
                    checked={!!item.isMandatory}
                    onCheckedChange={(checked) =>
                      setActionItems((prev) =>
                        prev.map((t) => (t.id === item.id ? { ...t, isMandatory: checked === true } : t)),
                      )
                    }
                    className='scale-90'
                  />
                  <span className='text-gray-700 text-xs'>Mandatory Task?</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Complementary Tasks */}
      <div
        className='rounded-3xl border-2 border-gray-900 shadow-sm bg-white p-4 sm:p-6 w-full mx-0 mt-8'
        style={{ borderColor: '#B0B3B8' }}
      >
        <div className='flex items-center justify-between mb-2 sm:mb-4 border-b pb-2'>
          <div className='font-bold text-lg sm:text-xl flex items-center gap-2 text-gray-900 text-left underline underline-offset-4'>
            <span>✧</span> Complementary Tasks
          </div>
          <Button size='sm' variant='ghost' className='text-primary font-semibold'>
            + Generate More
          </Button>
        </div>
        <div className='space-y-0 divide-y divide-gray-200'>
          {suggestedItems.map((item) => (
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
                  >
                    Add to Action Plan
                  </Button>
                </div>
              </div>
              {/* Bottom line: Duration, Days, Mandatory Task */}
              <div className='flex flex-row items-center w-full mt-1 text-xs'>
                <div className='text-gray-700 min-w-[110px]'>
                  Duration: <span className='font-medium'>15 Minutes</span>
                </div>
                {/* Centered Days */}
                <div className='flex-1 flex justify-center'>
                  <div className='flex items-center gap-1 min-w-[220px]'>
                    Weekly Repetition (Days):
                    {DAYS.map((d) => (
                      <span
                        key={d}
                        className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-semibold ml-1 cursor-pointer transition-colors ${item.daysOfWeek?.includes(d) ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}
                        onClick={() => toggleDay(item, d, false)}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Mandatory Task */}
                <div className='flex items-center gap-1 min-w-[120px] justify-end pr-2'>
                  <Checkbox
                    checked={!!item.isMandatory}
                    onCheckedChange={(checked) =>
                      setSuggestedItems((prev) =>
                        prev.map((t) => (t.id === item.id ? { ...t, isMandatory: checked === true } : t)),
                      )
                    }
                    className='scale-90'
                  />
                  <span className='text-gray-700 text-xs'>Mandatory Task?</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Task Editor Dialog for editing/adding */}
      <TaskEditorDialog
        open={showTaskDialog}
        onClose={() => setShowTaskDialog(false)}
        onSave={handleTaskDialogSave}
        initialValues={taskDialogInitialValues}
      />
      {/* Task Editor Dialog for viewing complementary task (read-only) */}
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
