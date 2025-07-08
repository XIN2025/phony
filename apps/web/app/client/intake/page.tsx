'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Slider } from '@repo/ui/components/slider';
import { Progress } from '@repo/ui/components/progress';
import { Loader2, Star, Upload } from 'lucide-react';
import { Logo } from '@repo/ui/components/logo';
import { toast } from 'sonner';
import { useGetClientIntakeForm, useSubmitIntakeForm } from '@/lib/hooks/use-api';

interface Question {
  id: string;
  text: string;
  type: string;
  options: (string | { id?: string; label?: string; value?: string })[];
  isRequired: boolean;
  order: number;
}

interface FormAnswers {
  [questionId: string]: string | string[] | boolean | number | undefined;
}

export default function IntakePage() {
  const router = useRouter();
  const { status, data: session, update } = useSession();
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const shouldFetchForm = !hasSubmitted && !isRedirecting;

  const { data: form, isLoading, error } = useGetClientIntakeForm(shouldFetchForm);
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

    if (session.user.clientStatus === 'INTAKE_COMPLETED') {
      router.push('/client');
      return;
    }

    if (session.user.clientStatus === 'ACTIVE') {
      router.push('/client');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (error && !isRedirecting) {
      const errorMessage = error.message;
      if (errorMessage.includes('Client has already completed intake') || errorMessage.includes('already completed')) {
        setIsRedirecting(true);
        toast.info('You have already completed your intake form.');
        router.push('/client');
        return;
      } else if (errorMessage.includes('No invitation found') || errorMessage.includes('No intake form attached')) {
        setIsRedirecting(true);
        toast.error('No intake form found. Please contact your practitioner.');
        router.push('/client');
      } else {
        toast.error('Failed to load intake form. Please contact your practitioner.');
      }
    }
  }, [error, router, isRedirecting]);

  React.useEffect(() => {
    return () => {
      setHasSubmitted(false);
      setIsRedirecting(false);
      setIsProcessing(false);

      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    };
  }, []);

  const processingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
          case 'SHORT_TEXT':
          case 'LONG_TEXT':
          case 'TEXT':
          case 'TEXTAREA':
          case 'EMAIL':
          case 'PHONE':
          case 'URL':
          case 'NUMBER':
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
              return false;
            }
            break;

          case 'MULTIPLE_CHOICE':
          case 'SELECT':
          case 'RADIO':
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
              return false;
            }
            break;

          case 'CHECKBOX':
          case 'CHECKBOXES':
            if (!Array.isArray(answer) || answer.length === 0) {
              return false;
            }
            break;

          case 'DATE':
          case 'TIME':
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
              return false;
            }
            break;

          case 'FILE_UPLOAD':
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
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

    if (hasSubmitted || isSubmitting || isRedirecting || isProcessing) {
      return;
    }

    if (!form) return;

    if (!validateForm()) {
      toast.error('Please complete all required questions before submitting.');
      return;
    }

    setIsProcessing(true);
    setHasSubmitted(true);

    processingTimeoutRef.current = setTimeout(() => {
      setIsProcessing(false);
      setHasSubmitted(false);
      toast.error('Request timed out. Please try again.');
    }, 30000);

    submitForm(
      {
        formId: form?.id || '',
        answers: answers,
      },
      {
        onSuccess: async (data: { success: boolean; submissionId: string; clientStatus: string }) => {
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
          }

          try {
            setIsRedirecting(true);

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
            }, 100);
          } catch (error) {
            router.push('/client');
          }
        },
        onError: async (error: any) => {
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
          }

          setHasSubmitted(false);
          setIsProcessing(false);

          const errorMessage =
            error?.message || error?.response?.data?.message || 'Failed to submit form. Please try again.';

          if (errorMessage.includes('already been submitted') || errorMessage.includes('already completed')) {
            toast.info('You have already completed your intake form.');
            setIsRedirecting(true);
            router.push('/client');
          } else {
            toast.error(errorMessage);
          }
        },
      },
    );
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'SHORT_TEXT':
      case 'TEXT':
        return (
          <Input
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your answer'
            className='mt-2'
          />
        );

      case 'LONG_TEXT':
      case 'TEXTAREA':
        return (
          <Textarea
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your detailed answer'
            className='mt-2'
            rows={4}
          />
        );

      case 'EMAIL':
        return (
          <Input
            type='email'
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your email'
            className='mt-2'
          />
        );

      case 'PHONE':
        return (
          <Input
            type='tel'
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your phone number'
            className='mt-2'
          />
        );

      case 'NUMBER':
        return (
          <Input
            type='number'
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter a number'
            className='mt-2'
          />
        );

      case 'DATE':
        return (
          <Input
            type='date'
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className='mt-2'
          />
        );

      case 'TIME':
        return (
          <Input
            type='time'
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className='mt-2'
          />
        );

      case 'URL':
        return (
          <Input
            type='url'
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter a URL'
            className='mt-2'
          />
        );

      case 'MULTIPLE_CHOICE':
      case 'RADIO':
        return (
          <RadioGroup
            value={(currentAnswer as string) || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className='mt-2'
          >
            {Array.isArray(question.options) &&
              question.options.map((option, index) => {
                const optionValue =
                  typeof option === 'string' ? option : option?.value || option?.label || String(option);
                const optionLabel =
                  typeof option === 'string' ? option : option?.label || option?.value || String(option);

                return (
                  <div key={index} className='flex items-center space-x-2'>
                    <RadioGroupItem value={optionValue} id={`${question.id}-${index}`} />
                    <Label htmlFor={`${question.id}-${index}`}>{optionLabel}</Label>
                  </div>
                );
              })}
          </RadioGroup>
        );

      case 'CHECKBOX':
        return (
          <div className='mt-2 space-y-2'>
            {Array.isArray(question.options) &&
              question.options.map((option, index) => {
                const optionValue =
                  typeof option === 'string' ? option : option?.value || option?.label || String(option);
                const optionLabel =
                  typeof option === 'string' ? option : option?.label || option?.value || String(option);

                return (
                  <div key={index} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`${question.id}-${index}`}
                      checked={Array.isArray(currentAnswer) && currentAnswer.includes(optionValue)}
                      onCheckedChange={(checked) => {
                        const currentArray = Array.isArray(currentAnswer) ? (currentAnswer as string[]) : [];
                        if (checked) {
                          handleAnswerChange(question.id, [...currentArray, optionValue]);
                        } else {
                          handleAnswerChange(
                            question.id,
                            currentArray.filter((item: string) => item !== optionValue),
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`${question.id}-${index}`}>{optionLabel}</Label>
                  </div>
                );
              })}
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
            value={(currentAnswer as string) || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder='Enter your answer'
            className='mt-2'
          />
        );
    }
  };

  if (isLoading || isRedirecting) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <div className='w-full max-w-2xl text-center'>
          <div className='mb-8 text-center'>
            <Logo className='mx-auto h-8 w-8 sm:h-10 sm:w-10' />
          </div>
          <div className='bg-card rounded-lg shadow-lg p-8'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
            <h2 className='text-xl font-semibold mb-2'>
              {isRedirecting ? 'Redirecting...' : 'Loading your intake form...'}
            </h2>
            <p className='text-muted-foreground'>
              {isRedirecting
                ? 'Please wait while we redirect you to your dashboard.'
                : 'Please wait while we load your personalized intake form.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!form || !form.questions) {
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

  const completedQuestions =
    form.questions && Array.isArray(form.questions)
      ? form.questions.filter((q) => {
          const answer = answers[q.id];
          return answer !== undefined && answer !== null && answer !== '';
        }).length
      : 0;

  const progress = form.questions && form.questions.length > 0 ? (completedQuestions / form.questions.length) * 100 : 0;

  const renderQuestions =
    form.questions && Array.isArray(form.questions)
      ? form.questions.map((question, index) => (
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
        ))
      : null;

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
              {completedQuestions} of {form.questions?.length || 0} questions completed
            </span>
          </div>
          <Progress value={progress} className='h-2' />
        </div>

        <form key='intake-form' onSubmit={handleSubmit} className='space-y-6'>
          {renderQuestions}

          <div className='flex justify-end gap-4 pt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/client')}
              disabled={isSubmitting || hasSubmitted || isProcessing || isRedirecting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || hasSubmitted || isProcessing || isRedirecting}
              key='submit-button'
            >
              {(isSubmitting || isProcessing) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {hasSubmitted || isProcessing ? 'Submitting...' : 'Submit Form'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
