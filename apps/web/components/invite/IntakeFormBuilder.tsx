'use client';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { intakeFormSchema, CreateIntakeFormDto } from '@repo/shared-types/schemas';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Trash2, Plus, GripVertical, Copy } from 'lucide-react';
import { QuestionType } from '@repo/db/question-type';
import { useInviteContext } from '@/context/InviteContext';
import { useEffect, useState } from 'react';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Textarea } from '@repo/ui/components/textarea';

function QuestionOptions({ questionIndex, control, register }: any) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });
  return (
    <div className='space-y-2 pt-4'>
      <Label>Choices</Label>
      {fields.map((field, optionIndex) => (
        <div key={field.id} className='flex items-center gap-2'>
          <Input
            placeholder={`Option ${optionIndex + 1}`}
            {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}
          />
          <Button type='button' variant='ghost' size='icon' onClick={() => remove(optionIndex)} className='shrink-0'>
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      ))}
      <Button
        type='button'
        variant='link'
        className='p-0 h-auto text-sm font-semibold'
        onClick={() => append({ text: '' })}
      >
        <Plus className='h-4 w-4 mr-1' />
        Add Option
      </Button>
    </div>
  );
}

interface IntakeFormBuilderProps {
  onSubmit: (data: CreateIntakeFormDto) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const questionTypeOptions = [
  { value: QuestionType.SHORT_ANSWER, label: 'Short Answer' },
  { value: QuestionType.LONG_ANSWER, label: 'Paragraph' },
  { value: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice' },
  { value: QuestionType.CHECKBOXES, label: 'Checkboxes' },
  { value: QuestionType.DROPDOWN, label: 'Drop-down' },
  { value: QuestionType.FILE_UPLOAD, label: 'File upload' },
  { value: QuestionType.SCALE, label: 'Linear Scale' },
  { value: QuestionType.RATING, label: 'Rating' },
  { value: QuestionType.MULTIPLE_CHOICE_GRID, label: 'Multiple choice grid' },
  { value: QuestionType.TICK_BOX_GRID, label: 'Tick box grid' },
];

export function IntakeFormBuilder({ onSubmit, onBack, isLoading }: IntakeFormBuilderProps) {
  const { inviteData, setInviteData } = useInviteContext();

  // Determine if this is a new form or editing an existing template
  const isNewForm = !inviteData.intakeFormId;

  // Store the original form data to detect changes
  const [originalFormData, setOriginalFormData] = useState<CreateIntakeFormDto | null>(null);

  const form = useForm<CreateIntakeFormDto>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues:
      inviteData.newIntakeForm ||
      ({
        title: '',
        description: '',
        questions: [
          {
            text: '',
            type: QuestionType.MULTIPLE_CHOICE,
            isRequired: true,
            order: 0,
            options: [{ text: '' }],
          },
        ],
      } as CreateIntakeFormDto),
  });

  // Initialize original form data when component mounts
  useEffect(() => {
    if (inviteData.intakeFormId && inviteData.newIntakeForm && !originalFormData) {
      setOriginalFormData(JSON.parse(JSON.stringify(inviteData.newIntakeForm)));
    }
  }, [inviteData.intakeFormId, inviteData.newIntakeForm, originalFormData]);

  // Save form data when component unmounts
  useEffect(() => {
    return () => {
      const currentFormData = form.getValues();
      setInviteData({
        newIntakeForm: currentFormData,
      });
    };
  }, [setInviteData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const addQuestion = () => {
    append({
      text: '',
      type: QuestionType.MULTIPLE_CHOICE,
      isRequired: true,
      order: fields.length,
      options: [{ text: '' }],
    });
  };

  const handleFormSubmit = (formData: CreateIntakeFormDto) => {
    // Check for changes when submitting
    let hasChanges = false;
    if (originalFormData && inviteData.intakeFormId) {
      hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    }

    // Update hasChanges in context
    setInviteData({ hasChanges });

    // Always pass false for saveAsTemplate from builder - this will be handled in preview
    onSubmit(formData);
  };
  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className='space-y-6 max-w-none'>
      <div className='space-y-2'>
        <Label htmlFor='form-title' className='text-lg font-semibold'>
          Form Title
        </Label>
        <Input
          id='form-title'
          placeholder='Enter the form title'
          {...form.register('title')}
          className='text-xl border-gray-700'
        />
        {form.formState.errors.title && (
          <p className='text-sm text-destructive'>{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className='space-y-2'>
        <Label htmlFor='form-description' className='text-lg font-semibold'>
          Form Description
        </Label>
        <Textarea
          id='form-description'
          placeholder='Enter a description for this form (optional)'
          {...form.register('description')}
          className='text-base border-gray-700'
          rows={3}
        />
        {form.formState.errors.description && (
          <p className='text-sm text-destructive'>{form.formState.errors.description.message}</p>
        )}
      </div>
      <div className='space-y-4'>
        {fields.map((field, index) => (
          <div key={field.id} className='rounded-xl border border-gray-700 bg-card p-4 sm:p-6 text-card-foreground'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor={`question-${index}`}>Question</Label>
                <Input
                  id={`question-${index}`}
                  placeholder='Why do you want to begin therapy?'
                  {...form.register(`questions.${index}.text`)}
                  className='text-base'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor={`question-type-${index}`}>Type of question</Label>
                <Controller
                  control={form.control}
                  name={`questions.${index}.type`}
                  render={({ field: selectField }) => (
                    <Select value={selectField.value || ''} onValueChange={selectField.onChange}>
                      <SelectTrigger className='w-full'>
                        <SelectValue
                          placeholder={
                            <div className='flex items-center gap-2 text-muted-foreground'>
                              <GripVertical className='h-5 w-5' />
                              <span>-- select --</span>
                            </div>
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className='flex items-center gap-2'>
                              <GripVertical className='h-5 w-5 text-muted-foreground' />
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            {form.watch(`questions.${index}.type`) === QuestionType.MULTIPLE_CHOICE && (
              <QuestionOptions questionIndex={index} control={form.control} register={form.register} />
            )}
            {form.watch(`questions.${index}.type`) === QuestionType.CHECKBOXES && (
              <QuestionOptions questionIndex={index} control={form.control} register={form.register} />
            )}
            {form.watch(`questions.${index}.type`) === QuestionType.DROPDOWN && (
              <QuestionOptions questionIndex={index} control={form.control} register={form.register} />
            )}
            <div className='flex items-center space-x-2 pt-4'>
              <Checkbox
                id={`required-${index}`}
                checked={form.watch(`questions.${index}.isRequired`)}
                onCheckedChange={(checked) => form.setValue(`questions.${index}.isRequired`, Boolean(checked))}
              />
              <Label htmlFor={`required-${index}`} className='text-sm font-medium'>
                Required question
              </Label>
            </div>
            <div className='flex justify-end items-center gap-2 pt-4 mt-4'>
              <Button type='button' variant='ghost' size='icon'>
                <Copy className='h-5 w-5' />
              </Button>
              <Button type='button' variant='ghost' size='icon' onClick={() => remove(index)}>
                <Trash2 className='h-5 w-5' />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button type='button' variant='link' onClick={addQuestion} className='p-0 h-auto font-semibold'>
        <Plus className='h-4 w-4 mr-2' />
        Add Question
      </Button>
      <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-between pt-4'>
        <Button type='button' variant='secondary' onClick={onBack} className='w-full sm:w-auto'>
          Cancel
        </Button>
        <Button type='submit' disabled={isLoading} className='w-full sm:w-auto'>
          {isLoading ? 'Saving...' : 'Preview'}
        </Button>
      </div>
    </form>
  );
}
