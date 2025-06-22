'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { intakeFormSchema, CreateIntakeFormDto, questionTypeEnum } from '@repo/shared-types/schemas';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Switch } from '@repo/ui/components/switch';
import { Trash2, Plus, GripVertical, Copy, ChevronLeft } from 'lucide-react';

type QuestionType = z.infer<typeof questionTypeEnum>;

const questionTypeLabels: Record<QuestionType, string> = {
  SHORT_ANSWER: 'Short Answer',
  LONG_ANSWER: 'Paragraph',
  MULTIPLE_CHOICE: 'Multiple Choice',
  CHECKBOXES: 'Checkboxes',
  DROPDOWN: 'Drop-down',
  FILE_UPLOAD: 'File upload',
  SCALE: 'Linear Scale',
  RATING: 'Rating',
  MULTIPLE_CHOICE_GRID: 'Multiple choice grid',
  TICK_BOX_GRID: 'Tick box grid',
};

interface IntakeFormBuilderProps {
  onSubmit: (data: CreateIntakeFormDto) => void;
  onBack: () => void;
  isLoading?: boolean;
  initialData?: CreateIntakeFormDto;
}

const QuestionOptions = ({
  questionIndex,
  control,
  type,
}: {
  questionIndex: number;
  control: any;
  type: QuestionType;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  if (type !== 'MULTIPLE_CHOICE' && type !== 'CHECKBOXES' && type !== 'DROPDOWN') {
    return null;
  }

  return (
    <div className='mt-4 space-y-2 pl-4'>
      <Label>Choices</Label>
      {fields.map((field, optionIndex) => (
        <div key={field.id} className='flex items-center gap-2'>
          <Controller
            control={control}
            name={`questions.${questionIndex}.options.${optionIndex}.text`}
            render={({ field }) => <Input {...field} placeholder={`Option ${optionIndex + 1}`} className='flex-grow' />}
          />
          <Button type='button' variant='ghost' size='icon' onClick={() => remove(optionIndex)}>
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      ))}
      <Button type='button' variant='outline' size='sm' onClick={() => append({ text: '' })}>
        <Plus className='h-4 w-4 mr-2' />
        Add Option
      </Button>
    </div>
  );
};

export function IntakeFormBuilder({ onSubmit, onBack, isLoading, initialData }: IntakeFormBuilderProps) {
  const form = useForm<CreateIntakeFormDto>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: initialData || {
      title: 'Intake Survey',
      description: 'Please fill out this form before our first session.',
      questions: [
        {
          text: 'Why do you want to begin therapy?',
          type: 'SHORT_ANSWER',
          isRequired: true,
          order: 0,
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const addQuestion = (type: QuestionType) => {
    append({
      text: '',
      type,
      isRequired: false,
      order: fields.length,
      options: type === 'MULTIPLE_CHOICE' || type === 'CHECKBOXES' || type === 'DROPDOWN' ? [{ text: '' }] : undefined,
    });
  };

  return (
    <Card className='max-w-4xl mx-auto'>
      <CardHeader>
        <CardTitle>Create an Intake Form</CardTitle>
        <CardDescription>Build a custom form to gather information from your clients.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='form-title'>Form Title</Label>
            <Input id='form-title' {...form.register('title')} placeholder='e.g. Pre-Session Questionnaire' />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='form-description'>Description</Label>
            <Input
              id='form-description'
              {...form.register('description')}
              placeholder='A short description for your client'
            />
          </div>

          <div className='border-t pt-6 space-y-4'>
            {fields.map((field, index) => {
              const questionType = form.watch(`questions.${index}.type`);
              return (
                <Card key={field.id} className='bg-muted/40 p-4'>
                  <div className='flex items-start gap-4'>
                    <Button variant='ghost' size='icon' className='cursor-grab'>
                      <GripVertical className='h-5 w-5' />
                    </Button>
                    <div className='flex-grow space-y-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <Controller
                          control={form.control}
                          name={`questions.${index}.text`}
                          render={({ field }) => (
                            <Input {...field} placeholder='Enter your question' className='text-base' />
                          )}
                        />
                        <Controller
                          control={form.control}
                          name={`questions.${index}.type`}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder='Select a type' />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(questionTypeLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <QuestionOptions questionIndex={index} control={form.control} type={questionType} />
                    </div>
                  </div>

                  <div className='flex justify-end items-center gap-4 mt-4 pt-4 border-t'>
                    <div className='flex items-center gap-2'>
                      <Controller
                        control={form.control}
                        name={`questions.${index}.isRequired`}
                        render={({ field }) => (
                          <Switch
                            id={`required-switch-${index}`}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor={`required-switch-${index}`}>Required</Label>
                    </div>
                    <Button type='button' variant='ghost' size='icon' onClick={() => remove(index)}>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <Button type='button' variant='outline' onClick={() => addQuestion('SHORT_ANSWER')}>
            <Plus className='h-4 w-4 mr-2' />
            Add Question
          </Button>

          <div className='flex justify-between items-center pt-6 border-t'>
            <Button type='button' variant='outline' onClick={onBack}>
              <ChevronLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <Button type='submit' disabled={isLoading} className='px-8 bg-gray-900 text-white hover:bg-gray-800'>
              {isLoading ? 'Saving...' : 'Preview & Continue'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
