'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { intakeFormSchema, CreateIntakeFormDto } from '@repo/shared-types/schemas';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Switch } from '@repo/ui/components/switch';
import { Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { QuestionType } from '@repo/db';

interface IntakeFormBuilderProps {
  initialData?: Partial<CreateIntakeFormDto>;
  onSubmit: (data: CreateIntakeFormDto) => void;
  isLoading?: boolean;
}

export function IntakeFormBuilder({ initialData, onSubmit, isLoading }: IntakeFormBuilderProps) {
  const form = useForm<CreateIntakeFormDto>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      questions: initialData?.questions || [],
    },
  });

  const { fields, append, remove, swap } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const addQuestion = (type: QuestionType) => {
    append({
      text: '',
      type,
      isRequired: true,
      order: fields.length,
      options: type === 'MULTIPLE_CHOICE' || type === 'CHECKBOXES' ? [''] : undefined,
    });
  };

  const removeQuestion = (index: number) => {
    remove(index);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      swap(index, newIndex);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>Enter the title and description for your form.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title</Label>
            <Input id='title' {...form.register('title')} placeholder='Client Intake Form' />
            {form.formState.errors.title && (
              <p className='text-sm text-destructive'>{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='description'>Description (Optional)</Label>
            <Textarea
              id='description'
              {...form.register('description')}
              placeholder="A brief description of the form's purpose."
            />
          </div>
        </CardContent>
      </Card>

      <div className='space-y-4 mt-6'>
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>Question {index + 1}</CardTitle>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => moveQuestion(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className='h-4 w-4' />
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => moveQuestion(index, 'down')}
                  disabled={index === fields.length - 1}
                >
                  <ArrowDown className='h-4 w-4' />
                </Button>
                <Button type='button' variant='destructive' size='sm' onClick={() => removeQuestion(index)}>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Question Text</Label>
                <Input
                  {...form.register(`questions.${index}.text`)}
                  placeholder='e.g., What are your primary health concerns?'
                />
                {form.formState.errors.questions?.[index]?.text && (
                  <p className='text-sm text-destructive'>{form.formState.errors.questions[index]?.text?.message}</p>
                )}
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Question Type</Label>
                  <Controller
                    control={form.control}
                    name={`questions.${index}.type`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='SHORT_ANSWER'>Short Answer</SelectItem>
                          <SelectItem value='LONG_ANSWER'>Long Answer</SelectItem>
                          <SelectItem value='MULTIPLE_CHOICE'>Multiple Choice</SelectItem>
                          <SelectItem value='CHECKBOXES'>Checkboxes</SelectItem>
                          <SelectItem value='SCALE'>Scale (1-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className='flex items-center space-x-2 pt-8'>
                  <Controller
                    control={form.control}
                    name={`questions.${index}.isRequired`}
                    render={({ field }) => (
                      <Switch id={`isRequired-${index}`} checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <Label htmlFor={`isRequired-${index}`}>Required</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='flex justify-between items-center mt-6'>
        <div>
          <Select onValueChange={(value) => addQuestion(value as QuestionType)}>
            <SelectTrigger>
              <Plus className='h-4 w-4 mr-2' />
              Add Question
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='SHORT_ANSWER'>Short Answer</SelectItem>
              <SelectItem value='LONG_ANSWER'>Long Answer</SelectItem>
              <SelectItem value='MULTIPLE_CHOICE'>Multiple Choice</SelectItem>
              <SelectItem value='CHECKBOXES'>Checkboxes</SelectItem>
              <SelectItem value='SCALE'>Scale (1-5)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type='submit' disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Form'}
        </Button>
      </div>
    </form>
  );
}
