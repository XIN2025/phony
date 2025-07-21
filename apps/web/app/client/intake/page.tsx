'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Slider } from '@repo/ui/components/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetClientIntakeForm, useSubmitIntakeForm, useUploadIntakeFormFile } from '@/lib/hooks/use-api';
import { getFileUrl } from '@/lib/utils';
import { AuthLayout } from '@repo/ui/components/auth-layout';
import { AuthHeader } from '@/components/PageHeader';

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
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { status, data: session, update } = useSession();
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const shouldFetchForm = !hasSubmitted && !isRedirecting;

  const { data: form, isLoading, error } = useGetClientIntakeForm(shouldFetchForm);
  const { mutate: submitForm, isPending: isSubmitting } = useSubmitIntakeForm();
  const uploadFileMutation = useUploadIntakeFormFile();

  useEffect(() => {
    console.log('[IntakePage] Session-based redirect effect running');
    // Prevent session-based redirects if just submitted
    if (typeof window !== 'undefined' && localStorage.getItem('intakeJustSubmitted') === 'true') {
      console.log('[IntakePage] Skipping session-based redirects due to intakeJustSubmitted flag');
      return;
    }
    if (hasSubmitted) {
      console.log('[IntakePage] Skipping redirects: hasSubmitted is true');
      return;
    }
    if (status === 'loading') {
      console.log('[IntakePage] Skipping redirects: status is loading');
      return;
    }

    if (status === 'unauthenticated') {
      console.log('[IntakePage] Redirect: unauthenticated, going to signup');
      toast.error('Please complete account creation first.');
      router.push(`/client/auth/signup?token=${token}`);
      return;
    }

    if (!session?.user) {
      console.log('[IntakePage] Redirect: no user, going to signup');
      toast.error('Please complete account creation first.');
      router.push(`/client/auth/signup?token=${token}`);
      return;
    }

    if (session.user.role !== 'CLIENT') {
      console.log('[IntakePage] Redirect: not a client, going to practitioner');
      router.push('/practitioner');
      return;
    }

    if (session.user.clientStatus === 'INTAKE_COMPLETED') {
      console.log('[IntakePage] Redirect: intake completed, going to /client');
      router.push('/client');
      return;
    }

    if (session.user.clientStatus === 'ACTIVE') {
      console.log('[IntakePage] Redirect: client active, going to /client');
      router.push('/client');
      return;
    }
    console.log('[IntakePage] No redirect triggered in session-based effect');
  }, [status, session, router, token, hasSubmitted]);

  useEffect(() => {
    if (hasSubmitted) return; // Prevent redirect logic after submission
    if (error && !isRedirecting) {
      const errorMessage = error.message;
      if (errorMessage.includes('Client has already completed intake') || errorMessage.includes('already completed')) {
        setIsRedirecting(true);
        console.log('[IntakePage] Redirect: already completed intake, going to /client');
        toast.info('You have already completed your intake form.');
        router.push('/client');
        return;
      } else if (errorMessage.includes('No invitation found') || errorMessage.includes('No intake form attached')) {
        setIsRedirecting(true);
        console.log('[IntakePage] Redirect: no intake form found, going to /client');
        toast.error('No intake form found. Please contact your practitioner.');
        router.push('/client');
      } else {
        console.log('[IntakePage] Error loading intake form:', errorMessage);
        toast.error('Failed to load intake form. Please contact your practitioner.');
      }
    }
  }, [error, router, isRedirecting, hasSubmitted]);

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
          case 'SHORT_ANSWER':
          case 'LONG_ANSWER':
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
          case 'DROPDOWN':
          case 'SELECT':
          case 'RADIO':
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
              return false;
            }
            break;

          case 'CHECKBOXES':
          case 'CHECKBOX':
          case 'TICK_BOX_GRID':
            if (!Array.isArray(answer) || answer.length === 0) {
              return false;
            }
            break;

          case 'SCALE':
          case 'RATING':
          case 'SLIDER':
            if (typeof answer !== 'number' || answer === 0) {
              return false;
            }
            break;

          case 'MULTIPLE_CHOICE_GRID':
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
              return false;
            }
            break;

          case 'FILE_UPLOAD':
            if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
              return false;
            }
            break;

          case 'DATE':
          case 'TIME':
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
      console.log('[IntakePage] Prevented double submission or redirect');
      return;
    }

    if (!form) {
      console.log('[IntakePage] No form loaded, cannot submit');
      return;
    }

    if (!validateForm()) {
      console.log('[IntakePage] Form validation failed');
      toast.error('Please complete all required questions before submitting.');
      return;
    }

    setIsProcessing(true);
    setHasSubmitted(true);
    console.log('[IntakePage] Submitting intake form...');

    processingTimeoutRef.current = setTimeout(() => {
      setIsProcessing(false);
      setHasSubmitted(false);
      toast.error('Request timed out. Please try again.');
      console.log('[IntakePage] Submission timed out');
    }, 30000);

    submitForm(
      {
        formId: form?.id || '',
        answers,
      },
      {
        onSuccess: async (response) => {
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
          }

          setIsRedirecting(true);
          toast.success('Intake form submitted successfully!');
          console.log(
            '[IntakePage] Intake form submitted successfully, updating session and redirecting to response-sent',
          );

          try {
            await update();
          } catch (error) {
            console.warn('[IntakePage] Failed to update session after intake submission:', error);
          }

          // Set localStorage flag before redirect
          if (typeof window !== 'undefined') {
            localStorage.setItem('intakeJustSubmitted', 'true');
          }

          // Immediately redirect to success page
          router.replace(`/client/response-sent?token=${token}`);
        },
        onError: (error: any) => {
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
          }

          setIsProcessing(false);
          setHasSubmitted(false);

          const errorMessage = error?.message || 'Failed to submit form. Please try again.';
          if (errorMessage.includes('already completed')) {
            console.log('[IntakePage] Submission error: already completed, redirecting to /client');
            router.push('/client');
          } else {
            console.log('[IntakePage] Submission error:', errorMessage);
            toast.error(errorMessage);
          }
        },
      },
    );
  };

  const renderQuestion = (question: Question) => {
    const { id, text, type, options, isRequired } = question;
    const value = answers[id];

    const commonLabel = (
      <Label htmlFor={id} className='block text-sm font-medium mb-2'>
        {text}
        {isRequired && <span className='text-destructive ml-1'>*</span>}
      </Label>
    );

    switch (type) {
      case 'SHORT_ANSWER':
      case 'SHORT_TEXT':
      case 'TEXT':
        return (
          <div key={id} className='space-y-2'>
            {commonLabel}
            <Input
              id={id}
              value={(value as string) || ''}
              onChange={(e) => handleAnswerChange(id, e.target.value)}
              required={isRequired}
              className='w-full'
            />
          </div>
        );
      case 'LONG_ANSWER':
      case 'LONG_TEXT':
      case 'TEXTAREA':
        return (
          <div key={id} className='space-y-2'>
            {commonLabel}
            <Textarea
              id={id}
              value={(value as string) || ''}
              onChange={(e) => handleAnswerChange(id, e.target.value)}
              required={isRequired}
              className='min-h-[100px] w-full'
            />
          </div>
        );
      case 'NUMBER':
        return (
          <div key={id} className='space-y-2'>
            {commonLabel}
            <Input
              id={id}
              type='number'
              value={(value as number) || ''}
              onChange={(e) => handleAnswerChange(id, e.target.value)}
              required={isRequired}
              className='w-full'
            />
          </div>
        );
      case 'MULTIPLE_CHOICE':
      case 'RADIO':
        return (
          <fieldset key={id} className='space-y-3'>
            <legend className='block text-sm font-medium mb-2'>
              {text}
              {isRequired && <span className='text-destructive ml-1'>*</span>}
            </legend>
            <RadioGroup
              value={value as string}
              onValueChange={(val) => handleAnswerChange(id, val)}
              required={isRequired}
              className='space-y-2'
            >
              {options.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option.value || `option-${index}`;
                const optionLabel = typeof option === 'string' ? option : option.label || `Option ${index + 1}`;
                return (
                  <div key={optionValue} className='flex items-center space-x-2'>
                    <RadioGroupItem value={optionValue} id={`${id}-${optionValue}`} />
                    <Label htmlFor={`${id}-${optionValue}`} className='text-sm'>
                      {optionLabel}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </fieldset>
        );

      case 'CHECKBOXES':
      case 'CHECKBOX':
        const checkedValues = (Array.isArray(value) ? value : []) as string[];
        return (
          <fieldset key={id} className='space-y-3'>
            <legend className='block text-sm font-medium mb-2'>
              {text}
              {isRequired && <span className='text-destructive ml-1'>*</span>}
            </legend>
            <div className='space-y-2'>
              {options.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option.value || `option-${index}`;
                const optionLabel = typeof option === 'string' ? option : option.label || `Option ${index + 1}`;
                return (
                  <div key={optionValue} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`${id}-${optionValue}`}
                      checked={checkedValues.includes(optionValue)}
                      onCheckedChange={(checked) => {
                        const newValues = checked
                          ? [...checkedValues, optionValue]
                          : checkedValues.filter((v) => v !== optionValue);
                        handleAnswerChange(id, newValues);
                      }}
                    />
                    <Label htmlFor={`${id}-${optionValue}`} className='text-sm'>
                      {optionLabel}
                    </Label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        );

      case 'DROPDOWN':
        return (
          <div key={id} className='space-y-2'>
            {commonLabel}
            <Select value={(value as string) || ''} onValueChange={(val) => handleAnswerChange(id, val)}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select an option...' />
              </SelectTrigger>
              <SelectContent>
                {options.map((option, index) => {
                  const optionValue = typeof option === 'string' ? option : option.value || `option-${index}`;
                  const optionLabel = typeof option === 'string' ? option : option.label || `Option ${index + 1}`;
                  return (
                    <SelectItem key={optionValue} value={optionValue}>
                      {optionLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        );

      case 'SCALE':
      case 'SLIDER':
        const scaleOptions = options
          .map((o) =>
            typeof o === 'string'
              ? parseInt(o)
              : typeof o === 'object' && o.value
                ? parseInt(o.value)
                : parseInt(String(o)),
          )
          .filter((o) => !isNaN(o));
        const minValue = scaleOptions.length >= 2 ? Math.min(...scaleOptions) : 1;
        const maxValue = scaleOptions.length >= 2 ? Math.max(...scaleOptions) : 10;
        const scaleValue = typeof value === 'number' ? value : minValue;
        return (
          <div key={id} className='space-y-2'>
            {commonLabel}
            <Slider
              id={id}
              min={minValue}
              max={maxValue}
              step={1}
              value={[scaleValue]}
              onValueChange={([val]) => handleAnswerChange(id, val)}
              className='my-4'
            />
            <div className='text-center text-sm text-muted-foreground'>
              {scaleValue} / {maxValue}
            </div>
          </div>
        );

      case 'RATING':
        const maxRating = options.length > 0 ? parseInt(options[0] as string) || 5 : 5;
        const ratingValue = typeof value === 'number' ? value : 0;
        return (
          <div key={id} className='space-y-2'>
            {commonLabel}
            <div className='flex space-x-1'>
              {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
                <button
                  key={rating}
                  type='button'
                  onClick={() => handleAnswerChange(id, rating)}
                  className={`w-8 h-8 text-xl ${
                    rating <= ratingValue ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                  } transition-colors`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <div className='text-sm text-muted-foreground'>
              {ratingValue > 0 ? `${ratingValue} / ${maxRating} stars` : 'Click to rate'}
            </div>
          </div>
        );

      case 'FILE_UPLOAD':
        return (
          <div key={id} className='space-y-2'>
            {commonLabel}
            <Input
              id={id}
              type='file'
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const result = await uploadFileMutation.mutateAsync(file);
                    handleAnswerChange(id, result.url);
                  } catch (err) {
                    toast.error('File upload failed');
                  }
                }
              }}
              required={isRequired}
              className='w-full'
            />
            {value && typeof value === 'string' && value.startsWith('/uploads/') && (
              <div className='text-sm text-muted-foreground'>
                <a href={getFileUrl(value)} target='_blank' rel='noopener noreferrer' className='underline'>
                  View uploaded file
                </a>
              </div>
            )}
          </div>
        );

      case 'MULTIPLE_CHOICE_GRID':
        return (
          <fieldset key={id} className='space-y-3'>
            <legend className='block text-sm font-medium mb-2'>
              {text}
              {isRequired && <span className='text-destructive ml-1'>*</span>}
            </legend>
            <div className='p-4 border rounded-md'>
              <p className='text-sm text-muted-foreground mb-2'>Grid format (simplified view):</p>
              <RadioGroup
                value={value as string}
                onValueChange={(val) => handleAnswerChange(id, val)}
                required={isRequired}
                className='space-y-2'
              >
                {options.map((option, index) => {
                  const optionValue = typeof option === 'string' ? option : option.value || `option-${index}`;
                  const optionLabel = typeof option === 'string' ? option : option.label || `Option ${index + 1}`;
                  return (
                    <div key={optionValue} className='flex items-center space-x-2'>
                      <RadioGroupItem value={optionValue} id={`${id}-${optionValue}`} />
                      <Label htmlFor={`${id}-${optionValue}`} className='text-sm'>
                        {optionLabel}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </fieldset>
        );

      case 'TICK_BOX_GRID':
        const gridCheckedValues = (Array.isArray(value) ? value : []) as string[];
        return (
          <fieldset key={id} className='space-y-3'>
            <legend className='block text-sm font-medium mb-2'>
              {text}
              {isRequired && <span className='text-destructive ml-1'>*</span>}
            </legend>
            <div className='p-4 border rounded-md'>
              <p className='text-sm text-muted-foreground mb-2'>Grid format (simplified view):</p>
              <div className='space-y-2'>
                {options.map((option, index) => {
                  const optionValue = typeof option === 'string' ? option : option.value || `option-${index}`;
                  const optionLabel = typeof option === 'string' ? option : option.label || `Option ${index + 1}`;
                  return (
                    <div key={optionValue} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`${id}-${optionValue}`}
                        checked={gridCheckedValues.includes(optionValue)}
                        onCheckedChange={(checked) => {
                          const newValues = checked
                            ? [...gridCheckedValues, optionValue]
                            : gridCheckedValues.filter((v) => v !== optionValue);
                          handleAnswerChange(id, newValues);
                        }}
                      />
                      <Label htmlFor={`${id}-${optionValue}`} className='text-sm'>
                        {optionLabel}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </fieldset>
        );

      default:
        return <div key={id}>Unsupported question type: {type}</div>;
    }
  };

  const isFormLoading = isLoading || status === 'loading' || !form;

  // Prevent any flash of the intake form after submission
  if (typeof window !== 'undefined' && localStorage.getItem('intakeJustSubmitted') === 'true') {
    console.log('[IntakePage] intakeJustSubmitted flag set, showing loader only');
    return (
      <div className='min-h-[200px] flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  // If redirecting or hasSubmitted, show loader (but only if intakeJustSubmitted is not set)
  if (isRedirecting || hasSubmitted) {
    return (
      <div className='min-h-[200px] flex items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <AuthLayout>
      {/* Top bar for mobile - fixed with conditional blur background */}
      <div
        className={`block sm:hidden fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2 w-full transition-all duration-300 ${
          isScrolled ? 'backdrop-blur-md bg-black/5' : ''
        }`}
      >
        <AuthHeader />
      </div>
      {/* Add proper top margin for mobile to avoid overlap with fixed header */}
      <div className='block sm:hidden' style={{ marginTop: '80px' }}></div>
      {/* Centered card for desktop, full width for mobile */}
      <div className='flex-1 flex flex-col items-center justify-center w-full relative'>
        <div className='w-full max-w-md mx-auto flex flex-col items-center justify-center rounded-xl py-4 px-4 sm:px-8 sm:mt-0 mt-2 relative z-10'>
          {/* Top bar for desktop */}
          <div className='hidden sm:flex w-full mb-4'>
            <AuthHeader />
          </div>
          {/* Intake Survey heading (always below header) */}
          <h2
            className='text-xl font-semibold mb-3 w-full text-left relative z-10'
            style={{ color: '#7A6E5A', fontFamily: 'DM Serif Display, serif' }}
          >
            {form?.title || 'Intake Survey'}
          </h2>
          {form?.description && (
            <div className='mb-3 w-full text-left relative z-10'>
              <p className='text-muted-foreground'>{form.description}</p>
            </div>
          )}
          <form className='flex flex-col items-center w-full relative z-10' onSubmit={handleSubmit}>
            <div className='w-full'>
              {form?.questions
                .sort((a, b) => a.order - b.order)
                .map((question) => (
                  <div key={question.id} className='bg-white rounded-xl shadow-sm p-4 mb-3 relative z-10'>
                    {renderQuestion(question)}
                  </div>
                ))}
            </div>
            <div className='w-full mt-3'>
              <Button
                type='submit'
                disabled={isSubmitting || hasSubmitted}
                className='w-full rounded-full h-12 text-base font-semibold'
              >
                {isSubmitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                {hasSubmitted ? 'Submitting...' : 'Continue'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
