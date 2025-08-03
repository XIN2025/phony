'use client';
import { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Badge } from '@repo/ui/components/badge';
import { Skeleton } from '@repo/ui/components/skeleton';
import { ChevronRight, FileText, Users, Heart, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { useGetIntakeFormTemplates, useCreateFormFromTemplate, IntakeFormTemplate } from '@/lib/hooks/use-api';

interface Props {
  onNext: (formId: string) => void;
  onBack: () => void;
}

const categoryIcons = {
  'Life Coach': Users,
  'Wellness Coach': Heart,
  Counselling: Heart,
  Psychology: Brain,
};

const categoryColors = {
  'Life Coach': 'bg-blue-100 text-blue-800 border-blue-200',
  'Wellness Coach': 'bg-green-100 text-green-800 border-green-200',
  Counselling: 'bg-purple-100 text-purple-800 border-purple-200',
  Psychology: 'bg-orange-100 text-orange-800 border-orange-200',
};

export function IntakeFormTemplateSelector({ onNext, onBack }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<IntakeFormTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  const { data: templates, isLoading: templatesLoading, error: templatesError } = useGetIntakeFormTemplates();
  const { mutate: createFormFromTemplate, isPending: isCreating } = useCreateFormFromTemplate();

  const handleTemplateSelect = (template: IntakeFormTemplate) => {
    setSelectedTemplate(template);
    setCustomTitle(template.name.replace(' Template', ''));
    setCustomDescription(template.description);
    setShowPreview(true);
  };

  const handleCreateForm = () => {
    if (!selectedTemplate || !customTitle.trim()) {
      toast.error('Please provide a title for your form');
      return;
    }

    createFormFromTemplate(
      {
        templateId: selectedTemplate.id,
        data: {
          title: customTitle.trim(),
          description: customDescription.trim() || selectedTemplate.description,
        },
      },
      {
        onSuccess: (form) => {
          toast.success('Form created successfully!');
          onNext(form.id);
        },
        onError: () => {
          toast.error('Failed to create form');
        },
      },
    );
  };

  const handleBack = () => {
    if (showPreview) {
      setShowPreview(false);
      setSelectedTemplate(null);
    } else {
      onBack();
    }
  };

  if (showPreview && selectedTemplate) {
    return (
      <div className='w-full max-w-[1450px] mx-auto p-8'>
        <div className='flex items-center justify-between mb-6'>
          <button
            onClick={handleBack}
            className='flex items-center text-sm font-medium text-primary hover:text-primary/80 transition'
          >
            ← Back to templates
          </button>
        </div>

        <div className='max-w-4xl mx-auto'>
          <div className='mb-8'>
            <h2 className='text-2xl font-semibold mb-2'>Customize Your Form</h2>
            <p className='text-gray-600'>Review and customize the template before creating your form</p>
          </div>

          <div className='grid lg:grid-cols-2 gap-8'>
            {/* Form Details */}
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Form Details</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Form Title *</label>
                    <input
                      type='text'
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent'
                      placeholder='Enter your form title'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Description</label>
                    <textarea
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      rows={3}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none'
                      placeholder='Enter a description for your form'
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleCreateForm} disabled={isCreating || !customTitle.trim()} className='w-full'>
                {isCreating ? 'Creating...' : 'Create Form'}
              </Button>
            </div>

            {/* Template Preview */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Template Preview</CardTitle>
                  <div className='flex items-center gap-2'>
                    <Badge className={categoryColors[selectedTemplate.category as keyof typeof categoryColors]}>
                      {selectedTemplate.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div>
                      <h3 className='font-semibold text-lg mb-2'>{selectedTemplate.name}</h3>
                      <p className='text-gray-600 text-sm'>{selectedTemplate.description}</p>
                    </div>
                    <div>
                      <h4 className='font-medium mb-2'>Questions ({selectedTemplate.questions.length})</h4>
                      <div className='space-y-2 max-h-64 overflow-y-auto'>
                        {selectedTemplate.questions.map((question, index) => (
                          <div key={index} className='flex items-start gap-2 text-sm'>
                            <span className='text-gray-500 min-w-[20px]'>{index + 1}.</span>
                            <span className='text-gray-700'>{question.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-[1450px] mx-auto p-8'>
      <div className='flex items-center justify-between mb-6'>
        <button
          onClick={handleBack}
          className='flex items-center text-sm font-medium text-primary hover:text-primary/80 transition'
        >
          ← Back
        </button>
      </div>

      <div className='mb-8'>
        <h2 className='text-2xl font-semibold mb-2'>Choose a Template</h2>
        <p className='text-gray-600'>
          Select a pre-built template to get started quickly, or create a form from scratch
        </p>
      </div>

      {templatesLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardHeader>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-20 w-full mb-4' />
                <Skeleton className='h-3 w-full mb-2' />
                <Skeleton className='h-3 w-2/3' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templatesError ? (
        <div className='text-center py-8'>
          <p className='text-destructive'>Error loading templates.</p>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
            {templates?.map((template) => {
              const IconComponent = categoryIcons[template.category as keyof typeof categoryIcons] || FileText;
              const colorClass =
                categoryColors[template.category as keyof typeof categoryColors] ||
                'bg-gray-100 text-gray-800 border-gray-200';

              return (
                <Card
                  key={template.id}
                  className='cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]'
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <CardTitle className='text-lg mb-2'>{template.name}</CardTitle>
                        <Badge className={colorClass}>
                          <IconComponent className='w-3 h-3 mr-1' />
                          {template.category}
                        </Badge>
                      </div>
                      <ChevronRight className='w-5 h-5 text-gray-400' />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className='text-gray-600 text-sm mb-4 line-clamp-3'>{template.description}</p>
                    <div className='flex items-center justify-between text-sm text-gray-500'>
                      <span>{template.questions.length} questions</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className='text-center'>
            <div className='inline-block'>
              <button
                onClick={() => onNext('create-new')}
                className='w-full max-w-2xl min-h-[120px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white/40 hover:bg-white/70 transition-all p-8 outline-none focus:ring-2 focus:ring-black/10'
                style={{
                  boxShadow:
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                }}
              >
                <span className='text-4xl font-bold text-gray-400 mb-2'>+</span>
                <span className='text-lg font-medium text-gray-700'>Start fresh with a new form</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
