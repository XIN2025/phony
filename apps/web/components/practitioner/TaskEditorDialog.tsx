import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Button } from '@repo/ui/components/button';

const DAYS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];

export interface TaskEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
  initialValues?: any;
  readOnly?: boolean;
}

export const TaskEditorDialog: React.FC<TaskEditorDialogProps> = ({
  open,
  onClose,
  onSave,
  initialValues,
  readOnly = false,
}) => {
  const [form, setForm] = useState({
    isMandatory: initialValues?.isMandatory || false,
    description: initialValues?.description || '',
    category: initialValues?.category || '',
    frequency: initialValues?.frequency || '',
    weeklyRepetitions: initialValues?.weeklyRepetitions || 1,
    daysOfWeek: initialValues?.daysOfWeek || [],
    whyImportant: initialValues?.whyImportant || '',
    recommendedActions: initialValues?.recommendedActions || '',
    toolsToHelp: initialValues?.toolsToHelp || '',
  });

  // Update form when initialValues change
  React.useEffect(() => {
    if (initialValues) {
      setForm({
        isMandatory: initialValues.isMandatory || false,
        description: initialValues.description || '',
        category: initialValues.category || '',
        frequency: initialValues.frequency || '',
        weeklyRepetitions: initialValues.weeklyRepetitions || 1,
        daysOfWeek: initialValues.daysOfWeek || [],
        whyImportant: initialValues.whyImportant || '',
        recommendedActions: initialValues.recommendedActions || '',
        toolsToHelp: initialValues.toolsToHelp || '',
      });
    }
  }, [initialValues]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const days = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d: string) => d !== day)
        : [...prev.daysOfWeek, day];
      return { ...prev, daysOfWeek: days };
    });
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='test-center-modal max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl w-full border border-gray-300 rounded-2xl bg-white shadow-sm p-0 overflow-hidden'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!readOnly) handleSave();
          }}
          className='bg-white p-8 rounded-2xl w-full'
        >
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold mb-1'>Tasks</DialogTitle>
            <DialogDescription className='text-base font-medium mb-4'>Daily Targeted Goals</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Checkbox
                checked={form.isMandatory}
                onCheckedChange={(checked) => !readOnly && handleChange('isMandatory', checked === true)}
                disabled={readOnly}
              />
              <span className='font-medium text-gray-900'>Task</span>
            </div>
            <Input
              placeholder='Task name'
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
              disabled={readOnly}
            />
            <Input
              placeholder='Category'
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
              disabled={readOnly}
            />
            <Input
              placeholder='Frequency (e.g., daily, weekly)'
              value={form.frequency}
              onChange={(e) => handleChange('frequency', e.target.value)}
              className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
              disabled={readOnly}
            />
            <div>
              <div className='font-medium mb-2'>Weekly Repetition</div>
              <div className='flex gap-2'>
                {DAYS.map((d) => (
                  <button
                    type='button'
                    key={d}
                    className={`w-8 h-8 rounded-full border text-base font-semibold flex items-center justify-center transition-colors ${form.daysOfWeek.includes(d) ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}
                    onClick={() => !readOnly && toggleDay(d)}
                    disabled={readOnly}
                    style={readOnly ? { cursor: 'not-allowed', opacity: 0.9 } : {}}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className='font-medium mb-2'>Why Important</div>
              <Textarea
                placeholder='Why is this task important?'
                value={form.whyImportant}
                onChange={(e) => handleChange('whyImportant', e.target.value)}
                className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base min-h-[40px] ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
                disabled={readOnly}
              />
            </div>
            <div>
              <div className='font-medium mb-2'>Recommended Actions</div>
              <Textarea
                placeholder='• Try a 20-minute High-Intensity Interval Training (HIIT) workout at home.\n• Go for a 30-minute brisk walk or light jog.\n• Take a 30-minute swim, alternating between faster and slower laps.'
                value={form.recommendedActions}
                onChange={(e) => handleChange('recommendedActions', e.target.value)}
                className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base min-h-[60px] ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
                disabled={readOnly}
              />
            </div>
            <div>
              <div className='font-medium mb-2'>Tools to help</div>
              <Input
                placeholder='Add Description'
                value={form.toolsToHelp}
                onChange={(e) => handleChange('toolsToHelp', e.target.value)}
                className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
                disabled={readOnly}
              />
            </div>
          </div>
          <div className='flex justify-end mt-8'>
            {!readOnly && (
              <Button
                type='submit'
                className='bg-black text-white rounded-full px-6 py-2 text-base font-semibold shadow-none hover:bg-gray-900'
              >
                Save Task
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
