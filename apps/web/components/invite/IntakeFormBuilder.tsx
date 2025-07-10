'use client';
import { useForm, useFieldArray, Controller, Control, UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { intakeFormSchema, CreateIntakeFormDto, QuestionType } from '@repo/shared-types';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useInviteContext } from '@/context/InviteContext';
import { useEffect, useState } from 'react';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Textarea } from '@repo/ui/components/textarea';

interface QuestionOptionsProps {
  questionIndex: number;
  control: any;
  register: any;
  form: any;
}

function QuestionOptions({ questionIndex, control, register, form }: QuestionOptionsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  useEffect(() => {
    fields.forEach((field, index) => {
      const currentLabel = form.watch(`questions.${questionIndex}.options.${index}.label`);
      const currentValue = form.watch(`questions.${questionIndex}.options.${index}.value`);

      if (currentLabel && !currentValue) {
        form.setValue(`questions.${questionIndex}.options.${index}.value`, currentLabel);
      }
      if (currentValue && !currentLabel) {
        form.setValue(`questions.${questionIndex}.options.${index}.label`, currentValue);
      }
    });
  }, [fields, form, questionIndex]);

  return (
    <div className='space-y-2 pt-4'>
      <Label>Choices</Label>
      {fields.map((field, optionIndex) => (
        <div key={field.id} className='flex items-center gap-2'>
          <Controller
            control={control}
            name={`questions.${questionIndex}.options.${optionIndex}.label`}
            render={({ field: inputField }) => (
              <Input
                placeholder={`Option ${optionIndex + 1}`}
                value={inputField.value || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  inputField.onChange(newValue);
                  form.setValue(`questions.${questionIndex}.options.${optionIndex}.value`, newValue);
                }}
                onBlur={(e) => {
                  const newValue = e.target.value;
                  form.setValue(`questions.${questionIndex}.options.${optionIndex}.value`, newValue);
                }}
              />
            )}
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
        onClick={() => {
          const newId = crypto.randomUUID();
          append({ id: newId, label: '', value: '' });
        }}
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
  onDelete?: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  buttonText?: string;
  initialFormData?: CreateIntakeFormDto | null;
}

const questionTypeOptions = [
  { value: QuestionType.SHORT_ANSWER, label: 'Short Answer' },
  { value: QuestionType.LONG_ANSWER, label: 'Paragraph' },
  { value: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice' },
  { value: QuestionType.CHECKBOXES, label: 'Checkboxes' },
  { value: QuestionType.DROPDOWN, label: 'Drop-down' },
  { value: QuestionType.FILE_UPLOAD, label: 'File upload' },
  { value: QuestionType.SCALE, label: 'Number' },
  { value: QuestionType.RATING, label: 'Rating' },
];

export function IntakeFormBuilder({
  onSubmit,
  onBack,
  onDelete,
  isLoading,
  isEditMode = false,
  buttonText,
  initialFormData,
}: IntakeFormBuilderProps) {
  const { inviteData, setInviteData } = useInviteContext();

  const [originalFormData, setOriginalFormData] = useState<CreateIntakeFormDto | null>(null);

  const form = useForm({
    resolver: zodResolver(intakeFormSchema),
    mode: 'onChange',
    defaultValues: initialFormData ||
      inviteData.newIntakeForm || {
        title: '',
        description: '',
        questions: [
          {
            id: crypto.randomUUID(),
            title: '',
            type: QuestionType.MULTIPLE_CHOICE,
            required: true,
            options: [{ id: crypto.randomUUID(), label: '', value: '' }],
          },
        ],
      },
  });

  useEffect(() => {
    if (inviteData.intakeFormId && inviteData.newIntakeForm && !originalFormData) {
      setOriginalFormData(JSON.parse(JSON.stringify(inviteData.newIntakeForm)));
    }
  }, [inviteData.intakeFormId, inviteData.newIntakeForm, originalFormData]);

  // Reset form when context data changes (for edit mode)
  useEffect(() => {
    if (inviteData.newIntakeForm && inviteData.intakeFormId) {
      form.reset(inviteData.newIntakeForm);
    }
  }, [inviteData.newIntakeForm, inviteData.intakeFormId, form]);

  useEffect(() => {
    return () => {
      const currentFormData = form.getValues();
      setInviteData({
        newIntakeForm: currentFormData as CreateIntakeFormDto,
      });
    };
  }, [setInviteData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const addQuestion = () => {
    append({
      id: crypto.randomUUID(),
      title: '',
      type: QuestionType.MULTIPLE_CHOICE,
      required: true,
      options: [{ id: crypto.randomUUID(), label: '', value: '' }],
    });
  };

  const handleFormSubmit = (formData: any) => {
    // Basic validation
    if (!formData.title || formData.title.trim() === '') {
      alert('Please enter a form title');
      return;
    }

    if (!formData.questions || formData.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    // Check that all questions have titles
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];
      if (!question.title || question.title.trim() === '') {
        alert(`Please enter a title for question ${i + 1}`);
        return;
      }
    }

    // Ensure options have the value field populated
    const processedFormData = {
      ...formData,
      questions: formData.questions.map((question: any) => ({
        ...question,
        options:
          question.options?.map((option: any) => ({
            id: option.id || crypto.randomUUID(),
            label: option.label || '',
            value: option.value || option.label || '',
          })) || [],
      })),
    };

    let hasChanges = false;
    if (originalFormData && inviteData.intakeFormId) {
      hasChanges = JSON.stringify(processedFormData) !== JSON.stringify(originalFormData);
    }

    setInviteData({ hasChanges });

    onSubmit(processedFormData as CreateIntakeFormDto);
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className='w-full max-w-[1250px] mx-auto flex flex-col gap-8'>
      {/* Form Title & Description Card */}
      <div className='bg-white rounded-2xl shadow p-8 flex flex-col gap-6'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='title' className='text-base font-semibold'>
            Form Title
          </Label>
          <Input
            id='title'
            {...form.register('title')}
            className='rounded-lg shadow-sm'
            placeholder='Add Form Title Here'
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='form-description' className='text-base font-semibold'>
            Form Description
          </Label>
          <Textarea
            id='form-description'
            placeholder='Enter a description for this form (optional)'
            {...form.register('description')}
            className='rounded-lg shadow-sm'
            rows={3}
          />
          {form.formState.errors.description && (
            <p className='text-sm text-destructive'>{form.formState.errors.description?.message as string}</p>
          )}
        </div>
      </div>
      {/* Question Cards */}
      <div className='flex flex-col gap-6'>
        {fields.map((field, index) => (
          <div key={field.id} className='bg-white rounded-2xl shadow p-8 flex flex-col gap-4'>
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1'>
                <Label>Question</Label>
                <Input
                  {...form.register(`questions.${index}.title`)}
                  className='rounded-lg shadow-sm'
                  placeholder='Type your question here'
                />
              </div>
              <div className='flex-1'>
                <Label>Type of question</Label>
                <Controller
                  control={form.control}
                  name={`questions.${index}.type`}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      value={value}
                      onValueChange={(val) => {
                        onChange(val);
                        // If switching to a type that doesn't use options, clear options
                        if (!['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(val)) {
                          form.setValue(`questions.${index}.options`, []);
                        } else if (['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(val)) {
                          // If switching to a type that uses options and options are empty, add one
                          const options = form.getValues(`questions.${index}.options`);
                          if (!options || options.length === 0) {
                            form.setValue(`questions.${index}.options`, [
                              { id: crypto.randomUUID(), label: '', value: '' },
                            ]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className='rounded-lg shadow-sm'>
                        <SelectValue placeholder='-- select --' />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            {form.watch(`questions.${index}.type`) === QuestionType.MULTIPLE_CHOICE && (
              <QuestionOptions questionIndex={index} control={form.control} register={form.register} form={form} />
            )}
            {form.watch(`questions.${index}.type`) === QuestionType.CHECKBOXES && (
              <QuestionOptions questionIndex={index} control={form.control} register={form.register} form={form} />
            )}
            {form.watch(`questions.${index}.type`) === QuestionType.DROPDOWN && (
              <QuestionOptions questionIndex={index} control={form.control} register={form.register} form={form} />
            )}
            <div className='flex items-center space-x-2 pt-4'>
              <Checkbox
                id={`required-${index}`}
                checked={form.watch(`questions.${index}.required`)}
                onCheckedChange={(checked) => form.setValue(`questions.${index}.required`, Boolean(checked))}
              />
              <Label htmlFor={`required-${index}`} className='text-sm font-medium'>
                Required question
              </Label>
            </div>
            <div className='flex justify-end items-center gap-2 pt-4 mt-4'>
              <Button type='button' variant='ghost' size='icon' onClick={() => remove(index)}>
                <Trash2 className='h-5 w-5' />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {/* Add Question Button */}
      <Button
        type='button'
        onClick={addQuestion}
        variant='ghost'
        className='rounded-full border border-dashed border-gray-300 py-3 px-6 text-gray-700 hover:bg-gray-50 w-fit self-start'
      >
        + Add Question
      </Button>
      {/* Action Buttons */}
      <div className='flex flex-col gap-4 pt-8 sm:flex-row sm:justify-between'>
        {onBack && (
          <Button
            type='button'
            variant='outline'
            onClick={onBack}
            className='w-full rounded-full px-8 py-2 border border-black text-black bg-white hover:bg-gray-100 shadow-sm sm:w-auto'
          >
            Cancel
          </Button>
        )}
        <Button
          type='submit'
          disabled={isLoading}
          className='w-full rounded-full px-8 py-2 bg-black text-white shadow-sm hover:bg-gray-900 sm:w-auto'
        >
          {buttonText || 'Preview'}
        </Button>
      </div>
    </form>
  );
}
