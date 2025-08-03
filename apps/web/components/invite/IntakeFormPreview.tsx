'use client';
import { useInviteContext } from '@/context/InviteContext';
import { CreateIntakeFormDto, QuestionType } from '@repo/shared-types';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { Textarea } from '@repo/ui/components/textarea';

interface Props {
  formData: CreateIntakeFormDto;
  onBack: () => void;
  onSubmit: (saveAsTemplate?: boolean) => void;
  isLoading: boolean;
  isNewForm: boolean;
  buttonText?: string;
  hideFixedBottomBar?: boolean;
}

export function IntakeFormPreview({
  formData,
  onBack,
  onSubmit,
  isLoading,
  isNewForm,
  buttonText,
  hideFixedBottomBar,
}: Props) {
  const { inviteData } = useInviteContext();

  const renderAnswer = (question: CreateIntakeFormDto['questions'][0]) => {
    const commonProps = {
      className: 'bg-white border-gray-200 rounded-md text-gray-700',
      disabled: true,
    };
    switch (question.type) {
      case QuestionType.SHORT_ANSWER:
        return <Input {...commonProps} placeholder='I have issues' />;
      case QuestionType.LONG_ANSWER:
        return (
          <Textarea
            {...commonProps}
            placeholder='A lot of issues that are affecting my everyday life. I am very unhappy with how things are and I am stuck in a loop trying to get myself out of this mess.'
          />
        );
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.DROPDOWN:
        return (
          <RadioGroup disabled>
            {question.options?.map((opt, i) => (
              <div key={opt.id || i} className='mb-2'>
                <Label
                  htmlFor={`q-preview-${opt.id || i}`}
                  className='flex items-center space-x-2 p-3 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-colors'
                >
                  <RadioGroupItem
                    value={opt.label}
                    id={`q-preview-${opt.id || i}`}
                    className='border-gray-400 data-[state=checked]:border-primary data-[state=checked]:bg-primary'
                  />
                  <span className='text-gray-700'>
                    {String.fromCharCode(65 + i)}. {opt.label}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case QuestionType.CHECKBOXES:
        return (
          <div className='space-y-2'>
            {question.options?.map((opt, i) => (
              <Label
                key={opt.id || i}
                htmlFor={`q-preview-check-${opt.id || i}`}
                className='flex items-center space-x-2 p-3 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-colors'
              >
                <Checkbox
                  id={`q-preview-check-${opt.id || i}`}
                  disabled
                  className='border-gray-400 data-[state=checked]:border-primary data-[state=checked]:bg-primary'
                />
                <span className='text-gray-700'>
                  {String.fromCharCode(65 + i)}. {opt.label}
                </span>
              </Label>
            ))}
          </div>
        );
      case QuestionType.SCALE:
        return <Input {...commonProps} type='number' placeholder='25' />;
      case QuestionType.RATING:
        return <Input {...commonProps} type='number' placeholder='5' />;
      case QuestionType.FILE_UPLOAD:
        return (
          <div className='border-2 border-dashed border-gray-300 rounded-md p-4 text-center bg-white'>
            <span className='text-gray-600'>File upload placeholder</span>
          </div>
        );
      default:
        return <Input {...commonProps} placeholder='Enter your answer' />;
    }
  };

  return (
    <div className='flex flex-col items-center w-full min-h-[70vh] pb-24'>
      <div className='w-full flex flex-col gap-6'>
        {/* Form Title Card */}
        <div
          className='bg-white rounded-2xl p-6 mb-2'
          style={{
            boxShadow:
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <h2 className='text-xl font-semibold'>{formData.title}</h2>
          {formData.description && <p className='text-gray-600 text-sm mt-2'>{formData.description}</p>}
        </div>
        {/* Question Cards */}
        {formData.questions.map((q, index) => (
          <div
            key={q.id || index}
            className='bg-white rounded-2xl p-6 flex flex-col gap-3'
            style={{
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Label className='font-semibold text-base'>
              {q.title} {q.required && <span className='text-destructive'>*</span>}
            </Label>
            {renderAnswer(q)}
          </div>
        ))}
        {/* Buttons */}
        {/* Fixed bar for small screens only */}
        {!hideFixedBottomBar && (
          <div className='fixed bottom-0 pb-15  left-0 w-full z-[9999] flex gap-4 px-4 py-3 block sm:hidden'>
            <Button
              type='button'
              variant='outline'
              onClick={onBack}
              className='border-gray-700 bg-transparent flex-1 rounded-full px -8 sm:hidden'
            >
              Back
            </Button>
            <Button
              onClick={() => onSubmit()}
              disabled={isLoading}
              className='flex-1 rounded-full bg-[#807171] sm:hidden px-8 text-white  '
            >
              {buttonText || (isLoading ? 'Creating Form...' : isNewForm ? 'Send Invitation' : 'Save Changes')}
            </Button>
          </div>
        )}
        {/* Normal row for sm+ only */}
        <div className='hidden sm:flex flex-row justify-end items-center gap-4 mt-8'>
          <div className='flex gap-4 w-full sm:w-auto'>
            <Button
              type='button'
              variant='outline'
              onClick={onBack}
              className='rounded-full bg-transparent border-gray-700 px-8'
            >
              Back
            </Button>
            <Button
              onClick={() => onSubmit()}
              disabled={isLoading}
              className='rounded-full bg-[#807171] px-8 text-white  '
            >
              {buttonText || (isLoading ? 'Creating Form...' : isNewForm ? 'Send Invitation' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
