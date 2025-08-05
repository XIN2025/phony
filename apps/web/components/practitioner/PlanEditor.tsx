'use client';

import {
  useAddCustomActionItem,
  useDeleteActionItem,
  useGenerateMoreTasks,
  useGetPlanWithSuggestions,
  useUpdateActionItem,
} from '@/lib/hooks/use-api';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';
import { TaskEditorDialog } from './TaskEditorDialog';

interface ActionItem {
  id: string;
  description: string;
  category?: string;
  target?: string;
  weeklyRepetitions?: number;
  isMandatory?: boolean;
  isOneOff?: boolean;
  duration?: string;
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
  completedAt?: string;
}

interface PlanEditorProps {
  planId: string;
  sessionId: string;
  clientId: string;
  onPlanUpdated?: () => void;
  showHeader?: boolean;
  onPublishClick?: () => void;
  isPublishing?: boolean;
  onSaveChangesClick?: () => void;
}

const DAYS = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'];

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
      className={`bg-[#807171] text-white rounded-full px-6 py-2 font-semibold shadow-none transition-all duration-200 ${
        isPublishing ? 'opacity-75 cursor-not-allowed animate-pulse' : 'hover:bg-primary/90 hover:scale-105'
      }`}
    >
      {isPublishing ? (
        <div className='flex items-center gap-2'>
          <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
          Publishing...
        </div>
      ) : (
        'Publish Plan'
      )}
    </Button>
  );
}

const PlanEditorComponent = forwardRef<{ savePendingChanges: () => Promise<void> }, PlanEditorProps>(
  (
    { planId, sessionId, clientId, onPlanUpdated, showHeader = true, onPublishClick, isPublishing, onSaveChangesClick },
    ref,
  ) => {
    const [showTaskDialog, setShowTaskDialog] = useState(false);
    const [taskDialogInitialValues, setTaskDialogInitialValues] = useState<any>(null);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
      description: '',
      target: '',
      frequency: '',
      weeklyRepetitions: 1,
      isMandatory: false,
      whyImportant: '',
      recommendedActions: '',
      toolsToHelp: '',
    });

    const router = useRouter();
    const allowNavRef = useRef(false);

    const {
      data: planData,
      isLoading: isPlanDataLoading,
      error: planDataError,
      refetch: refetchPlanData,
    } = useGetPlanWithSuggestions(planId);

    const addCustomActionMutation = useAddCustomActionItem();
    const deleteActionItemMutation = useDeleteActionItem();
    const saveTaskMutation = useUpdateActionItem();
    const generateMoreTasksMutation = useGenerateMoreTasks();

    const handleDeleteActionItem = (itemId: string) => {
      deleteActionItemMutation.mutate(
        { planId, itemId },
        {
          onSuccess: () => {
            onPlanUpdated?.();
          },
          onError: () => {
            toast.error('Failed to delete action item');
          },
        },
      );
    };

    const handleTaskDialogSave = (values: any) => {
      if (isEditingTask && editingTaskId) {
        const { id, ...rest } = values;
        saveTaskMutation.mutate(
          { planId, itemId: editingTaskId, data: rest },
          {
            onSuccess: () => {
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

    const handleGenerateMoreTasks = () => {
      generateMoreTasksMutation.mutate(planId, {
        onSuccess: (data) => {
          onPlanUpdated?.();
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to generate additional tasks');
        },
      });
    };

    const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());
    const isAnyTaskUpdating = updatingTaskIds.size > 0;

    const updateMandatory = (item: ActionItem, value: boolean) => {
      saveTaskMutation.mutate(
        { planId, itemId: item.id, data: { ...item, isMandatory: value } },
        {
          onSuccess: () => {
            onPlanUpdated?.();
          },
          onError: () => {
            toast.error('Failed to update task');
          },
        },
      );
    };

    const updateDaysOfWeek = (item: ActionItem, days: string[]) => {
      setUpdatingTaskIds((prev) => new Set(prev).add(item.id));
      saveTaskMutation.mutate(
        {
          planId,
          itemId: item.id,
          data: { ...item, daysOfWeek: days },
        },
        {
          onSettled: async () => {
            await refetchPlanData();
            setUpdatingTaskIds((prev) => {
              const next = new Set(prev);
              next.delete(item.id);
              return next;
            });
          },
        },
      );
    };

    const hasPendingChanges = false;

    const savePendingChanges = useCallback(async () => {
      return Promise.resolve();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        savePendingChanges,
      }),
      [savePendingChanges],
    );

    useEffect(() => {
      if (!hasPendingChanges) return;

      const origPush = router.push;
      const origBack = router.back;

      router.push = (href, options) => {
        if (hasPendingChanges && !allowNavRef.current) {
          setPendingNavigation(href);
          setShowUnsavedChangesDialog(true);
          return;
        }
        allowNavRef.current = false;
        return origPush.call(router, href, options);
      };

      router.back = () => {
        if (hasPendingChanges && !allowNavRef.current) {
          setPendingNavigation('BACK');
          setShowUnsavedChangesDialog(true);
          return;
        }
        allowNavRef.current = false;
        return origBack.call(router);
      };
      return () => {
        router.push = origPush;
        router.back = origBack;
      };
    }, [hasPendingChanges, router]);

    useEffect(() => {
      (window as any).__CONTINUUM_BLOCK_NAV__ = (navFn: () => void) => {
        if (hasPendingChanges) {
          setPendingNavigation(null);
          setShowUnsavedChangesDialog(true);
          return false;
        }
        return true;
      };
      return () => {
        delete (window as any).__CONTINUUM_BLOCK_NAV__;
      };
    }, [hasPendingChanges]);

    useEffect(() => {
      if (!hasPendingChanges) return;
      const clickHandler = (e: MouseEvent) => {
        if (e.button !== 0) return;
        let el = e.target as HTMLElement | null;
        while (el) {
          if (el.tagName === 'A' && (el as HTMLAnchorElement).href) {
            const href = (el as HTMLAnchorElement).href;
            if (href && !href.startsWith(window.location.href + '#')) {
              e.preventDefault();
              setPendingNavigation(href);
              setShowUnsavedChangesDialog(true);
              return;
            }
          }
          if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
            const navHref = el.getAttribute('data-href');
            if (navHref) {
              e.preventDefault();
              setPendingNavigation(navHref);
              setShowUnsavedChangesDialog(true);
              return;
            }
          }
          el = el.parentElement;
        }
      };
      document.addEventListener('click', clickHandler, true);
      return () => {
        document.removeEventListener('click', clickHandler, true);
      };
    }, [hasPendingChanges]);

    useEffect(() => {
      if (!hasPendingChanges) return;
      const origAssign = window.location.assign;
      const origReplace = window.location.replace;
      const origOpen = window.open;
      try {
        Object.defineProperty(window.location, 'assign', {
          configurable: true,
          writable: true,
          value: function (url: string) {
            if (hasPendingChanges && !allowNavRef.current) {
              setPendingNavigation(url);
              setShowUnsavedChangesDialog(true);
              return;
            }
            allowNavRef.current = false;
            return origAssign.call(window.location, url);
          },
        });
        Object.defineProperty(window.location, 'replace', {
          configurable: true,
          writable: true,
          value: function (url: string) {
            if (hasPendingChanges && !allowNavRef.current) {
              setPendingNavigation(url);
              setShowUnsavedChangesDialog(true);
              return;
            }
            allowNavRef.current = false;
            return origReplace.call(window.location, url);
          },
        });
      } catch (e) {}
      window.open = function (...args) {
        if (hasPendingChanges && !allowNavRef.current) {
          setPendingNavigation(null);
          setShowUnsavedChangesDialog(true);
          return null;
        }
        allowNavRef.current = false;
        return origOpen.apply(window, args);
      };
      return () => {
        try {
          Object.defineProperty(window.location, 'assign', { value: origAssign });
          Object.defineProperty(window.location, 'replace', { value: origReplace });
        } catch (e) {}
        window.open = origOpen;
      };
    }, [hasPendingChanges, allowNavRef]);

    const handleSaveAndContinue = async () => {
      await savePendingChanges();
      setShowUnsavedChangesDialog(false);
      if (pendingNavigation) {
        allowNavRef.current = true;
        if (pendingNavigation === 'BACK') {
          router.back();
        } else if (pendingNavigation.startsWith('http')) {
          window.location.href = pendingNavigation;
        } else {
          router.push(pendingNavigation);
        }
      }
      setPendingNavigation(null);
    };
    const handleDiscardChanges = () => {
      setShowUnsavedChangesDialog(false);
      if (pendingNavigation) {
        allowNavRef.current = true;
        if (pendingNavigation === 'BACK') {
          router.back();
        } else if (pendingNavigation.startsWith('http')) {
          window.location.href = pendingNavigation;
        } else {
          router.push(pendingNavigation);
        }
      }
      setPendingNavigation(null);
      toast.info('Changes discarded');
    };
    const handleCancelNavigation = () => {
      setShowUnsavedChangesDialog(false);
      setPendingNavigation(null);
    };

    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

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

    const sessionItems = actionItems.filter((item: ActionItem) => item.source !== 'AI_SUGGESTED');
    const aiSuggestedItems = actionItems.filter((item: ActionItem) => item.source === 'AI_SUGGESTED');

    return (
      <div className='space-y-8 w-full max-w-full  mx-auto px-2 sm:px-6 md:px-10'>
        {}
        {showHeader && (
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4'>
            <h2
              className='text-lg sm:text-xl md:text-2xl font-bold leading-tight'
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Edit Action Plan
            </h2>
            <div className='flex gap-2'>
              {onPublishClick && (
                <PublishPlanButton
                  onClick={onPublishClick}
                  disabled={!!isPublishing || isAnyTaskUpdating}
                  isPublishing={!!isPublishing}
                />
              )}
            </div>
          </div>
        )}
        {}
        <div className='rounded-3xl shadow-2xl bg-white p-4 sm:p-10 w-full mx-0' style={{ borderColor: '#B0B3B8' }}>
          {}
          <div className='flex items-center justify-between mb-2 sm:mb-4'>
            <div className='font-bold text-lg sm:text-xl text-gray-900 text-left tracking-tighter'>
              Tasks Mentioned In Session
            </div>
            <Button
              size='sm'
              variant='ghost'
              className='text-primary font-semibold'
              onClick={handleAddTaskClick}
              disabled={isAnyTaskUpdating}
            >
              + Add Task
            </Button>
          </div>
          <div className='space-y-0 divide-y divide-gray-200'>
            {sessionItems.map((item: ActionItem) => {
              const isUpdating = updatingTaskIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`py-4 w-full cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
                  onClick={() => handleEditTaskClick(item)}
                >
                  <div className='flex flex-col sm:flex-row items-start sm:items-center w-full gap-2 sm:gap-0'>
                    <div className='font-semibold text-base sm:text-lg text-gray-900 flex items-center gap-2 min-w-0 flex-1 break-words underline underline-offset-4'>
                      {item.description}
                    </div>
                    <div className='flex-1 min-w-0' />
                    <div
                      className='flex flex-wrap items-center gap-1 min-w-0 justify-end'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant='ghost'
                        size='icon'
                        className='hover:bg-gray-100'
                        onClick={() => handleEditTaskClick(item)}
                        disabled={isUpdating || isAnyTaskUpdating}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='hover:bg-gray-100 text-destructive'
                        onClick={() => handleDeleteActionItem(item.id)}
                        disabled={deleteActionItemMutation.isPending || isUpdating || isAnyTaskUpdating}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  <div className='flex flex-col sm:flex-row items-start sm:items-center w-full mt-1 text-xs gap-2 sm:gap-0'>
                    <div className='text-gray-700 min-w-[110px]'>
                      Duration: <span className='font-medium'>{item.duration || '15 Minutes'}</span>
                    </div>
                    <div className='flex-1 flex justify-center'>
                      <div className='flex flex-wrap items-center gap-1 min-w-[220px]'>
                        Weekly Repetition (Days):
                        {DAYS.map((d) => (
                          <span
                            key={d}
                            className={`w-7 h-7 flex items-center justify-center rounded-full border-2 text-xs font-semibold ml-1 cursor-pointer ${(item.daysOfWeek || []).includes(d) ? 'border-black text-black bg-white' : 'border-gray-300 text-gray-500 bg-white'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentDays = item.daysOfWeek || [];
                              const newDays = currentDays.includes(d)
                                ? currentDays.filter((day: string) => day !== d)
                                : [...currentDays, d];
                              updateDaysOfWeek(item, newDays);
                            }}
                            style={{
                              pointerEvents: isUpdating || isAnyTaskUpdating ? 'none' : undefined,
                              opacity: isUpdating || isAnyTaskUpdating ? 0.5 : 1,
                            }}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div
                      className='flex flex-wrap items-center gap-1 min-w-[120px] justify-end pr-2'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={item.isMandatory || false}
                        onCheckedChange={(checked) => {
                          updateMandatory(item, checked === true);
                        }}
                        className='scale-90'
                        disabled={isUpdating || isAnyTaskUpdating}
                      />
                      <span className='text-gray-700 text-xs'>Mandatory Task?</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {}
          <div className='flex items-center justify-between mt-8 mb-2 sm:mb-4'>
            <div className='font-bold text-lg sm:text-xl flex items-center gap-2 text-gray-900 text-left tracking-tghter'>
              <span>✧</span> AI Task Suggestions
            </div>
            <Button
              size='sm'
              variant='ghost'
              className='text-primary font-semibold'
              onClick={handleGenerateMoreTasks}
              disabled={generateMoreTasksMutation.isPending}
            >
              {generateMoreTasksMutation.isPending ? 'Generating...' : '+ Generate More'}
            </Button>
          </div>
          <div className='space-y-0 divide-y divide-gray-200'>
            {aiSuggestedItems.map((item: ActionItem) => (
              <div
                key={item.id}
                className='py-4 w-full cursor-pointer hover:bg-gray-50 rounded-lg transition-colors'
                onClick={() => handleEditTaskClick(item)}
              >
                <div className='flex flex-col sm:flex-row items-start sm:items-center w-full gap-2 sm:gap-0'>
                  <div className='font-semibold text-base sm:text-lg text-gray-900 flex items-center gap-2 min-w-0 flex-1 break-words underline underline-offset-4'>
                    {item.description}
                  </div>
                  <div className='flex-1 min-w-0' />
                  <div
                    className='min-w-0 pl-2 flex flex-wrap items-center justify-end gap-2'
                    onClick={(e) => e.stopPropagation()}
                  >
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
                <div className='flex flex-col sm:flex-row items-start sm:items-center w-full mt-1 text-xs gap-2 sm:gap-0'>
                  <div className='text-gray-700 min-w-[110px]'>
                    Duration: <span className='font-medium'>{item.duration || '15 Minutes'}</span>
                  </div>
                  <div className='flex-1 flex justify-center'>
                    <div className='flex flex-wrap items-center gap-1 min-w-[220px]'>
                      Weekly Repetition (Days):
                      {DAYS.map((d) => (
                        <span
                          key={d}
                          className={`w-7 h-7 flex items-center justify-center rounded-full border-2 text-xs font-semibold ml-1 cursor-pointer ${(item.daysOfWeek || []).includes(d) ? 'border-black text-black bg-white' : 'border-gray-300 text-gray-500 bg-white'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentDays = item.daysOfWeek || [];
                            const newDays = currentDays.includes(d)
                              ? currentDays.filter((day: string) => day !== d)
                              : [...currentDays, d];
                            updateDaysOfWeek(item, newDays);
                          }}
                          style={{
                            pointerEvents: saveTaskMutation.isPending ? 'none' : undefined,
                            opacity: saveTaskMutation.isPending ? 0.5 : 1,
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    className='flex flex-wrap items-center gap-1 min-w-[120px] justify-end pr-2'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={item.isMandatory || false}
                      onCheckedChange={(checked) => {
                        updateMandatory(item, checked === true);
                      }}
                      className='scale-90'
                      disabled={saveTaskMutation.isPending}
                    />
                    <span className='text-gray-700 text-xs'>Mandatory Task?</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {}
        <TaskEditorDialog
          open={showTaskDialog}
          onClose={() => setShowTaskDialog(false)}
          onSave={handleTaskDialogSave}
          initialValues={taskDialogInitialValues}
        />

        {}
        {showUnsavedChangesDialog && (
          <div className='fixed inset-0 backdrop-blur-3xl bg-black/20 flex items-center justify-center z-[9999] p-4'>
            <div className='bg-white border border-gray-200 rounded-lg shadow-2xl max-w-md w-full p-6 relative z-[10000]'>
              <div className='flex items-center mb-4'>
                <div className='flex-shrink-0'>
                  <svg className='h-6 w-6 text-orange-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-lg font-medium text-gray-900'>Unsaved Changes</h3>
                </div>
              </div>
              <div className='mb-6'>
                <p className='text-sm text-gray-600'>
                  You have unsaved changes to your action plan. Do you want to save them before leaving?
                </p>
              </div>
              <div className='flex flex-col sm:flex-row gap-3 justify-end'>
                <Button variant='outline' onClick={handleDiscardChanges} className='w-full sm:w-auto'>
                  Discard Changes
                </Button>
                <Button variant='outline' onClick={handleCancelNavigation} className='w-full sm:w-auto'>
                  Cancel
                </Button>
                <Button onClick={handleSaveAndContinue} className='w-full sm:w-auto'>
                  Save & Continue
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

PlanEditorComponent.displayName = 'PlanEditor';

export const PlanEditor = PlanEditorComponent;
