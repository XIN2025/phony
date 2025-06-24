'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Label } from '@repo/ui/components/label';
import { Slider } from '@repo/ui/components/slider';
import { Progress } from '@repo/ui/components/progress';
import { Loader2, Upload, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ApiClient } from '@/lib/api-client';
import { Logo } from '@repo/ui/components/logo';

interface Question {
  id: string;
  text: string;
  type: string;
  options: string[];
  isRequired: boolean;
  order: number;
}

interface IntakeForm {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export default function ClientIntakePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<IntakeForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client/auth');
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'CLIENT') {
      // Check if client has already completed intake
      if (session.user.clientStatus === 'INTAKE_COMPLETED') {
        router.push('/client');
        return;
      }

      // Check if client needs intake
      if (session.user.clientStatus !== 'NEEDS_INTAKE') {
        router.push('/client');
        return;
      }

      loadIntakeForm();
    }
  }, [session, status, router]);

  const loadIntakeForm = async () => {
    try {
      const formData: IntakeForm = await ApiClient.get('/api/client/intake-form');
      setForm(formData);
    } catch (error: unknown) {
      console.error('Error loading intake form:', error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Client has already completed intake')) {
          // Client has already completed intake, redirect to dashboard
          toast.info('You have already completed your intake form.');
          router.push('/client');
          return;
        } else if (errorMessage.includes('No invitation found') || errorMessage.includes('No intake form attached')) {
          toast.error('No intake form found. Please contact your practitioner.');
          router.push('/client');
        } else {
          toast.error('Failed to load intake form. Please contact your practitioner.');
        }
      } else {
        toast.error('Failed to load intake form. Please contact your practitioner.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const validateForm = () => {
    if (!form) return false;

    for (const question of form.questions) {
      if (question.isRequired) {
        const answer = answers[question.id];

        // Handle different question types
        switch (question.type) {
          case 'SHORT_ANSWER':
          case 'LONG_ANSWER':
          case 'MULTIPLE_CHOICE':
          case 'DROPDOWN':
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
              return false;
            }
            break;

          case 'CHECKBOXES':
            if (!Array.isArray(answer) || answer.length === 0) {
              return false;
            }
            break;

          case 'SCALE':
          case 'RATING':
            if (answer === undefined || answer === null || answer === 0) {
              return false;
            }
            break;

          case 'FILE_UPLOAD':
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
              return false;
            }
            break;

          case 'MULTIPLE_CHOICE_GRID':
          case 'TICK_BOX_GRID':
            if (!answer || Object.keys(answer).length === 0) {
              return false;
            }
            break;

          default:
            if (!answer || (Array.isArray(answer) && answer.length === 0)) {
              return false;
            }
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setHasSubmitted(true);

    try {
      const response = await ApiClient.post('/api/client/intake-form/submit', {
        formId: form?.id,
        answers,
      });

      toast.success('Intake form submitted successfully!');

      // Update the session to reflect the new client status
      try {
        const updatedUser = await ApiClient.get('/api/auth/me');
        await update({
          user: updatedUser,
        });
      } catch (updateError) {
        console.error('Failed to update session:', updateError);
        // Continue with redirect even if session update fails
      }

      // Small delay to show success message before redirect
      setTimeout(() => {
        router.push('/client');
      }, 500);
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      setHasSubmitted(false);
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Client has already completed intake')) {
          setHasSubmitted(true);
          toast.info('You have already completed your intake form.');
          router.push('/client');
        } else {
          toast.error(errorMessage || 'Failed to submit form. Please try again.');
        }
      } else {
        toast.error('Failed to submit form. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'SHORT_ANSWER':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your answer'
          />
        );

      case 'LONG_ANSWER':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your answer'
            rows={4}
          />
        );

      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => handleAnswerChange(question.id, val)}
            className='space-y-3'
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className='flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className='text-sm font-medium cursor-pointer flex-1'>
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'CHECKBOXES':
        return (
          <div className='space-y-3'>
            {question.options.map((option, index) => (
              <div
                key={index}
                className='flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
              >
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={Array.isArray(value) && value.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      handleAnswerChange(question.id, [...currentValues, option]);
                    } else {
                      handleAnswerChange(
                        question.id,
                        currentValues.filter((v) => v !== option),
                      );
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className='text-sm font-medium cursor-pointer flex-1'>
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'DROPDOWN':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className='flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
          >
            <option value=''>Select an option</option>
            {question.options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'SCALE':
        const scaleValue = value || 0;
        const maxScale = question.options.length > 0 && question.options[0] ? parseInt(question.options[0]) : 10;
        return (
          <div className='space-y-4'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>0</span>
              <span className='font-medium'>{scaleValue}</span>
              <span className='text-muted-foreground'>{maxScale}</span>
            </div>
            <Slider
              value={[scaleValue]}
              onValueChange={(vals) => handleAnswerChange(question.id, vals[0])}
              max={maxScale}
              min={0}
              step={1}
            />
            <Progress value={(scaleValue / maxScale) * 100} />
          </div>
        );

      case 'RATING':
        const ratingValue = value || 0;
        const maxRating = question.options.length > 0 && question.options[0] ? parseInt(question.options[0]) : 5;
        return (
          <div className='space-y-3'>
            <div
              className='flex items-center space-x-2'
              role='radiogroup'
              aria-label={`Rate from 1 to ${maxRating} stars`}
            >
              {Array.from({ length: maxRating }, (_, index) => (
                <button
                  key={index}
                  type='button'
                  onClick={() => handleAnswerChange(question.id, index + 1)}
                  className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    index < ratingValue ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-400'
                  }`}
                  aria-label={`${index + 1} star${index + 1 === 1 ? '' : 's'}`}
                  aria-pressed={index < ratingValue}
                >
                  <Star className='h-6 w-6 fill-current' />
                </button>
              ))}
            </div>
            <p className='text-sm text-muted-foreground'>
              {ratingValue > 0 ? `${ratingValue} out of ${maxRating} stars` : 'Click to rate'}
            </p>
          </div>
        );

      case 'FILE_UPLOAD':
        return (
          <div className='space-y-3'>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors'>
              <Upload className='h-8 w-8 text-gray-400 mx-auto mb-2' />
              <p className='text-sm text-gray-600 mb-2'>Click to upload or drag and drop</p>
              <p className='text-xs text-gray-500'>PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
              <input
                type='file'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // For now, just store the file name
                    // In a real implementation, you'd upload to a server
                    handleAnswerChange(question.id, file.name);
                  }
                }}
                accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                className='hidden'
                id={`file-upload-${question.id}`}
              />
              <Button
                type='button'
                variant='outline'
                onClick={() => document.getElementById(`file-upload-${question.id}`)?.click()}
                className='mt-2'
              >
                Choose File
              </Button>
            </div>
            {value && <div className='text-sm text-muted-foreground'>Selected: {value}</div>}
          </div>
        );

      case 'MULTIPLE_CHOICE_GRID':
        // For grid questions, we need to handle multiple rows and columns
        const gridValue = value || {};
        const rows = question.options.slice(0, Math.floor(question.options.length / 2));
        const columns = question.options.slice(Math.floor(question.options.length / 2));

        return (
          <div className='space-y-4'>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr>
                    <th className='border border-gray-200 p-2 text-left bg-gray-50'></th>
                    {columns.map((col, colIndex) => (
                      <th key={colIndex} className='border border-gray-200 p-2 text-center bg-gray-50 text-sm'>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className='border border-gray-200 p-2 text-sm font-medium bg-gray-50'>{row}</td>
                      {columns.map((col, colIndex) => (
                        <td key={colIndex} className='border border-gray-200 p-2 text-center'>
                          <RadioGroup
                            value={gridValue[`${rowIndex}-${colIndex}`] || ''}
                            onValueChange={(val) => {
                              const newGridValue = { ...gridValue, [`${rowIndex}-${colIndex}`]: val };
                              handleAnswerChange(question.id, newGridValue);
                            }}
                          >
                            <RadioGroupItem value='selected' id={`${question.id}-${rowIndex}-${colIndex}`} />
                          </RadioGroup>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'TICK_BOX_GRID':
        // Similar to multiple choice grid but with checkboxes
        const tickGridValue = value || {};
        const tickRows = question.options.slice(0, Math.floor(question.options.length / 2));
        const tickColumns = question.options.slice(Math.floor(question.options.length / 2));

        return (
          <div className='space-y-4'>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr>
                    <th className='border border-gray-200 p-2 text-left bg-gray-50'></th>
                    {tickColumns.map((col, colIndex) => (
                      <th key={colIndex} className='border border-gray-200 p-2 text-center bg-gray-50 text-sm'>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className='border border-gray-200 p-2 text-sm font-medium bg-gray-50'>{row}</td>
                      {tickColumns.map((col, colIndex) => (
                        <td key={colIndex} className='border border-gray-200 p-2 text-center'>
                          <Checkbox
                            id={`${question.id}-${rowIndex}-${colIndex}`}
                            checked={tickGridValue[`${rowIndex}-${colIndex}`] || false}
                            onCheckedChange={(checked) => {
                              const newTickGridValue = { ...tickGridValue, [`${rowIndex}-${colIndex}`]: checked };
                              handleAnswerChange(question.id, newTickGridValue);
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your answer'
          />
        );
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p className='text-sm text-muted-foreground'>Loading intake form...</p>
        </div>
      </div>
    );
  }

  // Show loading state when form is being submitted
  if (isSubmitting || hasSubmitted) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p className='text-sm text-muted-foreground'>
            {isSubmitting ? 'Submitting your intake form...' : 'Redirecting to dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <p className='text-sm text-muted-foreground'>No intake form found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-2xl mx-auto'>
        <div className='mb-8 text-center'>
          <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-4' />
          <h1 className='text-2xl font-bold tracking-tight'>Complete Your Intake Form</h1>
          <p className='text-muted-foreground'>
            Please fill out the following information to help your practitioner better understand your needs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && <p className='text-muted-foreground'>{form.description}</p>}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {form.questions
                .sort((a, b) => a.order - b.order)
                .map((question) => (
                  <div key={question.id} className='space-y-2'>
                    <Label className='text-base font-medium'>
                      {question.text}
                      {question.isRequired && <span className='text-red-500 ml-1'>*</span>}
                    </Label>
                    {renderQuestion(question)}
                  </div>
                ))}

              <div className='flex justify-center pt-6'>
                <Button type='submit' disabled={isSubmitting || !validateForm()} className='min-w-[200px]'>
                  {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {isSubmitting ? 'Submitting...' : 'Submit Form'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
