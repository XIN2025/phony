'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Textarea } from '@repo/ui/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Slider } from '@repo/ui/components/slider';
import { Progress } from '@repo/ui/components/progress';
import { Loader2, Upload, Star } from 'lucide-react';
import { Logo } from '@repo/ui/components/logo';
import { useGetClientIntakeForm, useSubmitIntakeForm } from '@/lib/hooks/use-api';
import React from 'react';

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
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isSubmittingRef = React.useRef(false);

  const { data: form, isLoading, error } = useGetClientIntakeForm();
  const { mutate: submitForm, isPending: isSubmitting } = useSubmitIntakeForm();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/client/auth');
      return;
    }

    if (!session?.user) {
      router.push('/client/auth');
      return;
    }

    if (session.user.role !== 'CLIENT') {
      router.push('/practitioner');
      return;
    }

    if (session.user.clientStatus === 'COMPLETED') {
      router.push('/client');
      return;
    }

    if (session.user.clientStatus === 'PENDING' || session.user.clientStatus === 'ACTIVE') {
      router.push('/client');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (error) {
      const errorMessage = error.message;
      if (errorMessage.includes('Client has already completed intake')) {
        toast.info('You have already completed your intake form.');
        router.push('/client');
        return;
      } else if (errorMessage.includes('No invitation found') || errorMessage.includes('No intake form attached')) {
        toast.error('No intake form found. Please contact your practitioner.');
        router.push('/client');
      } else {
        toast.error('Failed to load intake form. Please contact your practitioner.');
      }
    }
  }, [error, router]);

  const handleAnswerChange = (questionId: string, value: string | string[] | boolean | number | undefined) => {
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

    if (hasSubmitted || isSubmitting || isSubmittingRef.current) {
      return;
    }

    if (!form) return;

    if (!validateForm()) {
      toast.error('Please complete all required questions before submitting.');
      return;
    }

    isSubmittingRef.current = true;
    setHasSubmitted(true);

    submitForm(
      {
        formId: form?.id || '',
        answers: answers,
      },
      {
        onSuccess: async (data: { clientStatus: string }) => {
          try {
            await update({
              ...session,
              user: {
                ...session?.user,
                clientStatus: data.clientStatus,
              },
            });

            toast.success('Intake form submitted successfully!');
            setTimeout(() => {
              router.push('/client');
            }, 1000);
          } catch (_error: unknown) {
            window.location.href = '/client';
          }
        },
        onError: async (error: Error) => {
          setHasSubmitted(false);
          isSubmittingRef.current = false;
          toast.error(error.message || 'Failed to submit form. Please try again.');
        },
      },
    );
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'SHORT_ANSWER':
        return (
          <Input
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your answer'
            className='mt-2'
          />
        );

      case 'LONG_ANSWER':
        return (
          <Textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your detailed answer'
            className='mt-2'
            rows={4}
          />
        );

      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup
            value={currentAnswer || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className='mt-2'
          >
            {question.options.map((option, index) => (
              <div key={index} className='flex items-center space-x-2'>
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'CHECKBOXES':
        return (
          <div className='mt-2 space-y-2'>
            {question.options.map((option, index) => (
              <div key={index} className='flex items-center space-x-2'>
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={Array.isArray(currentAnswer) && currentAnswer.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentArray = Array.isArray(currentAnswer) ? currentAnswer : [];
                    if (checked) {
                      handleAnswerChange(question.id, [...currentArray, option]);
                    } else {
                      handleAnswerChange(
                        question.id,
                        currentArray.filter((item) => item !== option),
                      );
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'DROPDOWN':
        return (
          <select
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className='mt-2 w-full p-2 border border-gray-300 rounded-md'
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
        return (
          <div className='mt-2'>
            <Slider
              value={[currentAnswer || 0]}
              onValueChange={(value) => handleAnswerChange(question.id, value[0])}
              max={10}
              min={0}
              step={1}
              className='w-full'
            />
            <div className='flex justify-between text-sm text-muted-foreground mt-1'>
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
            <div className='text-center mt-2'>
              <span className='text-lg font-semibold'>{currentAnswer || 0}</span>
            </div>
          </div>
        );

      case 'RATING':
        return (
          <div className='mt-2 flex space-x-1'>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type='button'
                onClick={() => handleAnswerChange(question.id, star)}
                className={`p-1 ${
                  currentAnswer >= star ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              >
                <Star className='h-6 w-6 fill-current' />
              </button>
            ))}
            <span className='ml-2 text-sm text-muted-foreground'>
              {currentAnswer ? `${currentAnswer} star${currentAnswer > 1 ? 's' : ''}` : 'No rating'}
            </span>
          </div>
        );

      case 'FILE_UPLOAD':
        return (
          <div className='mt-2'>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
              <Upload className='mx-auto h-8 w-8 text-gray-400 mb-2' />
              <p className='text-sm text-gray-600'>Click to upload or drag and drop</p>
              <input
                type='file'
                onChange={(e) => handleAnswerChange(question.id, e.target.files?.[0]?.name || '')}
                className='hidden'
                id={`file-${question.id}`}
              />
              <label
                htmlFor={`file-${question.id}`}
                className='mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer'
              >
                Choose File
              </label>
            </div>
            {currentAnswer && <p className='mt-2 text-sm text-gray-600'>Selected: {currentAnswer}</p>}
          </div>
        );

      default:
        return (
          <Input
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your answer'
            className='mt-2'
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <div className='w-full max-w-2xl text-center'>
          <div className='mb-8 text-center'>
            <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10' />
          </div>
          <div className='bg-card rounded-lg shadow-lg p-8'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
            <h2 className='text-xl font-semibold mb-2'>Loading your intake form...</h2>
            <p className='text-muted-foreground'>Please wait while we load your personalized intake form.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <div className='w-full max-w-2xl text-center'>
          <div className='mb-8 text-center'>
            <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10' />
          </div>
          <div className='bg-card rounded-lg shadow-lg p-8'>
            <h2 className='text-xl font-semibold mb-2'>No Intake Form Available</h2>
            <p className='text-muted-foreground mb-4'>
              No intake form has been assigned to you. Please contact your practitioner.
            </p>
            <Button onClick={() => router.push('/client')}>Go to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const completedQuestions = form.questions.filter((q) => {
    const answer = answers[q.id];
    return answer !== undefined && answer !== null && answer !== '';
  }).length;

  const progress = (completedQuestions / form.questions.length) * 100;

  return (
    <div className='min-h-screen bg-background p-4'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8 text-center'>
          <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-4' />
          <h1 className='text-2xl font-bold mb-2'>{form.title}</h1>
          {form.description && <p className='text-muted-foreground max-w-2xl mx-auto'>{form.description}</p>}
        </div>

        <div className='mb-6'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm font-medium'>Progress</span>
            <span className='text-sm text-muted-foreground'>
              {completedQuestions} of {form.questions.length} questions completed
            </span>
          </div>
          <Progress value={progress} className='h-2' />
        </div>

        <form key='intake-form' onSubmit={handleSubmit} className='space-y-6'>
          {form.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className='flex items-start gap-2'>
                  <span className='text-sm text-muted-foreground min-w-[2rem]'>{index + 1}.</span>
                  <span className='flex-1'>
                    {question.text}
                    {question.isRequired && <span className='text-red-500 ml-1'>*</span>}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>{renderQuestion(question)}</CardContent>
            </Card>
          ))}

          <div className='flex justify-end gap-4 pt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/client')}
              disabled={isSubmitting || hasSubmitted}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting || hasSubmitted} key='submit-button'>
              {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {hasSubmitted ? 'Submitted' : 'Submit Form'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
