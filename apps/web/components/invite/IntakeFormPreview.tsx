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
}

export function IntakeFormPreview({ formData, onBack, onSubmit, isLoading, isNewForm, buttonText }: Props) {
  const { inviteData, setInviteData } = useInviteContext();

  const hasChanges = inviteData.hasChanges || false;
  const shouldShowSaveOption = isNewForm || (inviteData.intakeFormId && hasChanges);

  const saveAsTemplate = isNewForm ? (inviteData.saveAsTemplate ?? true) : true;

  const handleSaveAsTemplateChange = (checked: boolean) => {
    if (shouldShowSaveOption) {
      setInviteData({ saveAsTemplate: checked });
    }
  };

  const renderAnswer = (question: CreateIntakeFormDto['questions'][0]) => {
    const commonProps = {
      className: 'bg-gray-100 border-gray-300 rounded-md',
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
                  className='flex items-center space-x-2 p-3 rounded-md bg-gray-100 border border-gray-300'
                >
                  <RadioGroupItem value={opt.label} id={`q-preview-${opt.id || i}`} />
                  <span>
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
                className='flex items-center space-x-2 p-3 rounded-md bg-gray-100 border border-gray-300'
              >
                <Checkbox id={`q-preview-check-${opt.id || i}`} disabled />
                <span>
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
          <div className='border-2 border-dashed border-gray-300 rounded-md p-4 text-center bg-gray-100'>
            <span className='text-gray-500'>File upload placeholder</span>
          </div>
        );
      default:
        return <Input {...commonProps} placeholder='Enter your answer' />;
    }
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-grow overflow-y-auto'>
        <Card className='rounded-2xl border-2 shadow-none'>
          <CardContent className='p-6 space-y-6'>
            <h2 className='text-xl font-semibold text-center'>{formData.title}</h2>
            {formData.description && <p className='text-center text-muted-foreground'>{formData.description}</p>}
            {formData.questions.map((q, index) => (
              <div key={q.id || index} className='space-y-3'>
                <Label className='font-semibold text-base'>
                  {q.title} {q.required && <span className='text-destructive'>*</span>}
                </Label>
                {renderAnswer(q)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className='flex justify-end items-center pt-6 mt-4 gap-4 border-t'>
        {shouldShowSaveOption && (
          <div className='flex items-center space-x-2 mr-auto'>
            <Checkbox
              id='save-template-preview'
              checked={saveAsTemplate}
              onCheckedChange={handleSaveAsTemplateChange}
            />
            <label htmlFor='save-template-preview' className='text-sm font-medium leading-none'>
              Save form as a template
            </label>
          </div>
        )}
        <Button type='button' variant='outline' onClick={onBack} className='rounded-full px-6'>
          Back
        </Button>
        <Button
          onClick={() => onSubmit()}
          disabled={isLoading}
          className='rounded-full bg-black px-6 text-white hover:bg-gray-800'
        >
          {buttonText || (isLoading ? 'Creating Form...' : 'Create Form')}
        </Button>
      </div>
    </div>
  );
}
