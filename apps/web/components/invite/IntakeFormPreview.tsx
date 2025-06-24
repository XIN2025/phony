'use client';
import { useInviteContext } from '@/context/InviteContext';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';
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
  onSubmit: (saveAsTemplate: boolean) => void;
  isLoading: boolean;
  isNewForm: boolean;
}

export function IntakeFormPreview({ formData, onBack, onSubmit, isLoading, isNewForm }: Props) {
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
      case 'SHORT_ANSWER':
        return <Input {...commonProps} placeholder='I have issues' />;
      case 'LONG_ANSWER':
        return (
          <Textarea
            {...commonProps}
            placeholder='A lot of issues that are affecting my everyday life. I am very unhappy with how things are and I am stuck in a loop trying to get myself out of this mess.'
          />
        );
      case 'MULTIPLE_CHOICE':
      case 'DROPDOWN':
        return (
          <RadioGroup disabled>
            {question.options?.map((opt, i) => (
              <div key={i} className='mb-2'>
                <Label
                  htmlFor={`q-preview-${i}`}
                  className='flex items-center space-x-2 p-3 rounded-md bg-gray-100 border border-gray-300'
                >
                  <RadioGroupItem value={opt.text} id={`q-preview-${i}`} />
                  <span>
                    {String.fromCharCode(65 + i)}. {opt.text}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'CHECKBOXES':
        return (
          <div className='space-y-2'>
            {question.options?.map((opt, i) => (
              <Label
                key={i}
                htmlFor={`q-preview-check-${i}`}
                className='flex items-center space-x-2 p-3 rounded-md bg-gray-100 border border-gray-300'
              >
                <Checkbox id={`q-preview-check-${i}`} disabled />
                <span>
                  {String.fromCharCode(65 + i)}. {opt.text}
                </span>
              </Label>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-grow overflow-y-auto'>
        <Card className='rounded-2xl border-2 shadow-none'>
          <CardContent className='p-6 space-y-6'>
            <h2 className='text-xl font-semibold text-center'>{formData.title}</h2>
            {formData.questions
              .sort((a, b) => a.order - b.order)
              .map((q, index) => (
                <div key={index} className='space-y-3'>
                  <Label className='font-semibold text-base'>
                    {q.text} {q.isRequired && <span className='text-destructive'>*</span>}
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
          onClick={() => onSubmit(shouldShowSaveOption ? saveAsTemplate : false)}
          disabled={isLoading}
          className='rounded-full bg-black px-6 text-white hover:bg-gray-800'
        >
          {isLoading
            ? shouldShowSaveOption && saveAsTemplate
              ? 'Saving Form & Sending...'
              : 'Sending Invitation...'
            : shouldShowSaveOption && saveAsTemplate
              ? 'Send & Save Template'
              : 'Send Invitation'}
        </Button>
      </div>
    </div>
  );
}
