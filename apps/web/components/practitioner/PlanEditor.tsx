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

export const PlanEditor: React.FC<PlanEditorProps> = ({ planId, sessionId, clientId, onPlanUpdated }) => {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<SuggestedActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<SuggestedActionItem | null>(null);

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
            <Select
              value={item.weeklyRepetitions?.toString() || '1'}
              onValueChange={(value) => {
                console.log('Update weekly repetitions:', value);
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
                console.log('Update mandatory:', checked);
              }}
            />

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
    <div className='space-y-6'>
      {/* Plan Editor Description */}
      <Card className='bg-blue-50 border-blue-200'>
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            <Info className='h-5 w-5 text-blue-600 mt-0.5' />
            <div className='text-sm text-blue-800'>
              <h3 className='font-semibold mb-2'>How to Organize a Client Action Plan:</h3>
              <ul className='space-y-1 text-xs'>
                <li>
                  • <strong>Task Sources:</strong> Actions you stated during your session + AI suggestions based on
                  transcript
                </li>
                <li>
                  • <strong>Set Weekly Goals:</strong> For each task, set how many times per week you want your client
                  to complete it
                </li>
                <li>
                  • <strong>Client's Daily Plan:</strong> Continuum automatically creates a simple daily to-do list,
                  spreading tasks over the week
                </li>
                <li>
                  • <strong>Mandatory Tasks:</strong> Mark critical tasks as mandatory - they'll appear at the top of
                  your client's daily list
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>Your Actions</span>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size='sm' className='h-8'>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Action
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Add Custom Action Item</DialogTitle>
                  <DialogDescription>Create a new action item for your client's plan.</DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Description *</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder='e.g., Practice breathing exercises for 5 minutes'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Category</label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder='e.g., Mindfulness'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Target</label>
                      <Input
                        value={formData.target}
                        onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                        placeholder='e.g., Reduce anxiety'
                      />
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='text-sm font-medium'>Frequency</label>
                      <Input
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        placeholder='e.g., Daily'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Weekly Repetitions</label>
                      <Select
                        value={formData.weeklyRepetitions.toString()}
                        onValueChange={(value) => setFormData({ ...formData, weeklyRepetitions: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} time{num > 1 ? 's' : ''} per week
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='mandatory'
                      checked={!!formData.isMandatory}
                      onCheckedChange={(checked) => setFormData({ ...formData, isMandatory: checked === true })}
                    />
                    <label htmlFor='mandatory' className='text-sm font-medium'>
                      Mark as mandatory (appears at top of client's daily list)
                    </label>
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Why is this important?</label>
                    <Textarea
                      value={formData.whyImportant}
                      onChange={(e) => setFormData({ ...formData, whyImportant: e.target.value })}
                      placeholder='Explain why this task benefits the client...'
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Recommended actions</label>
                    <Textarea
                      value={formData.recommendedActions}
                      onChange={(e) => setFormData({ ...formData, recommendedActions: e.target.value })}
                      placeholder='Specific steps to complete this task...'
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Tools to help</label>
                    <Textarea
                      value={formData.toolsToHelp}
                      onChange={(e) => setFormData({ ...formData, toolsToHelp: e.target.value })}
                      placeholder='Apps, resources, or tools that could help...'
                      rows={2}
                    />
                  </div>
                </div>
                <div className='flex justify-end gap-2'>
                  <Button variant='outline' onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCustomAction} disabled={!formData.description}>
                    Add Action Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {actionItems.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                <p>No action items yet. Add your first action or approve AI suggestions below.</p>
              </div>
            ) : (
              actionItems.map((item) => renderActionItemRow(item))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suggested Complementary Actions Section */}
      {suggestedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-orange-500' />
              Suggested Complementary Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>{suggestedItems.map((item) => renderSuggestedItemRow(item))}</div>
          </CardContent>
        </Card>
      )}

      {/* Publish Button */}
      <div className='flex justify-end'>
        <Button
          onClick={handlePublishPlan}
          disabled={isPublishing || actionItems.length === 0}
          className='bg-green-600 hover:bg-green-700'
        >
          {isPublishing ? 'Publishing...' : 'Publish to Client'}
        </Button>
      </div>
    </div>
  );
};
