'use client';

import { CreateIntakeFormDto } from '@repo/shared-types/schemas';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/card';
import { Label } from '@repo/ui/components/label';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { Checkbox } from '@repo/ui/components/checkbox';
import { ChevronLeft } from 'lucide-react';

interface Props {
  formData: CreateIntakeFormDto;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function IntakeFormPreview({ formData, onBack, onSubmit, isLoading }: Props) {
  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Preview Intake Form</h1>
          <p className='text-muted-foreground'>This is how the form will look to your client.</p>
        </div>
      </div>

      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle>{formData.title}</CardTitle>
          {formData.description && <CardDescription>{formData.description}</CardDescription>}
        </CardHeader>
        <CardContent className='space-y-6'>
          {formData.questions
            .sort((a, b) => a.order - b.order)
            .map((q, index) => (
              <div key={index} className='space-y-3 p-4 rounded-lg bg-background border'>
                <Label className='font-semibold text-base'>
                  {q.text} {q.isRequired && <span className='text-destructive'>*</span>}
                </Label>
                <div className='pl-2'>
                  {q.type === 'SHORT_ANSWER' && <Input disabled placeholder='Short answer text' />}
                  {q.type === 'LONG_ANSWER' && <Textarea disabled placeholder='Long answer text' />}
                  {(q.type === 'MULTIPLE_CHOICE' || q.type === 'DROPDOWN') && (
                    <RadioGroup disabled>
                      {q.options?.map((opt, i) => (
                        <div key={i} className='flex items-center space-x-3'>
                          <RadioGroupItem value={opt.text} id={`q${index}-opt${i}`} />
                          <Label htmlFor={`q${index}-opt${i}`} className='font-normal'>
                            {opt.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  {q.type === 'CHECKBOXES' && (
                    <div className='space-y-3'>
                      {q.options?.map((opt, i) => (
                        <div key={i} className='flex items-center space-x-3'>
                          <Checkbox id={`q${index}-opt${i}`} disabled />
                          <Label htmlFor={`q${index}-opt${i}`} className='font-normal'>
                            {opt.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Add other question types here as needed */}
              </div>
            ))}
        </CardContent>
      </Card>
      <div className='flex justify-between items-center pt-6 border-t'>
        <Button type='button' variant='outline' onClick={onBack}>
          <ChevronLeft className='mr-2 h-4 w-4' />
          Back to Edit
        </Button>
        <Button onClick={onSubmit} disabled={isLoading} className='px-8 bg-gray-900 text-white hover:bg-gray-800'>
          {isLoading ? 'Sending...' : 'Confirm and Send Invite'}
        </Button>
      </div>
    </div>
  );
}
