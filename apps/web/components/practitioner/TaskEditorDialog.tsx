import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Button } from '@repo/ui/components/button';
import { useDropzone } from 'react-dropzone';
import type { FileWithPath } from 'react-dropzone';
import { useUploadResource } from '@/lib/hooks/use-api';
import { toast } from 'sonner';

const DAYS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];

export interface TaskEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
  initialValues?: any;
  readOnly?: boolean;
}

interface Resource {
  type: 'LINK' | 'PDF' | 'IMAGE' | 'DOCX';
  url: string;
  title?: string;
}

export const TaskEditorDialog: React.FC<TaskEditorDialogProps> = ({
  open,
  onClose,
  onSave,
  initialValues,
  readOnly = false,
}) => {
  const [form, setForm] = useState({
    isMandatory: initialValues?.isMandatory || false,
    description: initialValues?.description || '',
    category: initialValues?.category || '',
    weeklyRepetitions: initialValues?.weeklyRepetitions || 1,
    daysOfWeek: initialValues?.daysOfWeek || [],
    whyImportant: initialValues?.whyImportant || '',
    recommendedActions: initialValues?.recommendedActions || '',
    toolsToHelp: initialValues?.toolsToHelp || '',
  });

  const [resources, setResources] = useState<Resource[]>(initialValues?.resources || []);
  const [newFiles, setNewFiles] = useState<FileWithPath[]>([]);
  const [newLinks, setNewLinks] = useState<Resource[]>([]);
  const [linkInput, setLinkInput] = useState<string>('');
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const uploadResourceMutation = useUploadResource();

  // Update form when initialValues change
  React.useEffect(() => {
    if (initialValues) {
      setForm({
        isMandatory: initialValues.isMandatory || false,
        description: initialValues.description || '',
        category: initialValues.category || '',
        weeklyRepetitions: initialValues.weeklyRepetitions || 1,
        daysOfWeek: initialValues.daysOfWeek || [],
        whyImportant: initialValues.whyImportant || '',
        recommendedActions: initialValues.recommendedActions || '',
        toolsToHelp: initialValues.toolsToHelp || '',
      });
      // Reset resource states when initialValues change
      setResources(initialValues.resources || []);
      setNewFiles([]);
      setNewLinks([]);
      setLinkInput('');
      setShowLinkInput(false);
      setUploadingFiles(new Set());
    } else {
      // Reset everything when no initialValues (new task)
      setForm({
        isMandatory: false,
        description: '',
        category: '',
        weeklyRepetitions: 1,
        daysOfWeek: [],
        whyImportant: '',
        recommendedActions: '',
        toolsToHelp: '',
      });
      setResources([]);
      setNewFiles([]);
      setNewLinks([]);
      setLinkInput('');
      setShowLinkInput(false);
      setUploadingFiles(new Set());
    }
  }, [initialValues]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const days = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d: string) => d !== day)
        : [...prev.daysOfWeek, day];
      return { ...prev, daysOfWeek: days };
    });
  };

  const onDrop = async (acceptedFiles: FileWithPath[]) => {
    setNewFiles((prev: FileWithPath[]) => [...prev, ...acceptedFiles]);

    // Upload files to backend
    for (const file of acceptedFiles) {
      setUploadingFiles((prev) => new Set(prev).add(file.name));
      try {
        const result = await uploadResourceMutation.mutateAsync(file);
        setResources((prev) => [
          ...prev,
          {
            type: result.type,
            url: result.url,
            title: result.title,
          },
        ]);
        // Remove from newFiles since it's now in resources
        setNewFiles((prev) => prev.filter((f) => f.name !== file.name));
      } catch (error) {
        console.error('Failed to upload file:', error);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(file.name);
          return newSet;
        });
      }
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleAddLink = () => {
    if (linkInput.trim()) {
      setNewLinks((prev: Resource[]) => [...prev, { url: linkInput.trim(), type: 'LINK' }]);
      setLinkInput('');
      setShowLinkInput(false);
    }
  };
  const handleRemoveFile = (idx: number) => {
    setNewFiles((prev: FileWithPath[]) => prev.filter((_, i) => i !== idx));
  };
  const handleRemoveLink = (idx: number) => {
    setNewLinks((prev: Resource[]) => prev.filter((_, i) => i !== idx));
  };
  const handleRemoveExistingResource = (idx: number) => {
    setResources((prev: Resource[]) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    // Combine existing resources with new links
    const allResources = [...resources, ...newLinks];
    onSave({ ...form, resources: allResources });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='w-[95vw] max-w-2xl md:max-w-3xl lg:max-w-4xl border border-gray-300 rounded-2xl shadow-lg p-0 overflow-hidden !fixed !top-1/2 !left-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 !z-[9999]'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!readOnly) handleSave();
          }}
          className='p-8 rounded-2xl w-full'
        >
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold mb-1'>Tasks</DialogTitle>
            <DialogDescription className='text-base font-medium mb-4'>Daily Targeted Goals</DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <Input
              placeholder='Task name'
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
              disabled={readOnly}
            />
            <Input
              placeholder='Category'
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
              disabled={readOnly}
            />
            <div>
              <div className='font-medium mb-2'>Select Days</div>
              <div className='flex gap-2'>
                {DAYS.map((d) => (
                  <button
                    type='button'
                    key={d}
                    className={`w-8 h-8 rounded-full border-2 text-base font-semibold flex items-center justify-center transition-colors ml-1 ${form.daysOfWeek.includes(d) ? 'border-black text-black bg-white' : 'border-gray-300 text-gray-500 bg-white'}`}
                    onClick={() => !readOnly && toggleDay(d)}
                    disabled={readOnly}
                    style={readOnly ? { cursor: 'not-allowed', opacity: 0.9 } : {}}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className='font-medium mb-2'>Why Important</div>
              <Textarea
                placeholder='Why is this task important?'
                value={form.whyImportant}
                onChange={(e) => handleChange('whyImportant', e.target.value)}
                className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base min-h-[40px] ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
                disabled={readOnly}
              />
            </div>
            <div>
              <div className='font-medium mb-2'>Recommended Actions</div>
              <Textarea
                placeholder='• Try a 20-minute High-Intensity Interval Training (HIIT) workout at home.\n• Go for a 30-minute brisk walk or light jog.\n• Take a 30-minute swim, alternating between faster and slower laps.'
                value={form.recommendedActions}
                onChange={(e) => handleChange('recommendedActions', e.target.value)}
                className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base min-h-[60px] ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
                disabled={readOnly}
              />
            </div>
            <div>
              <div className='font-medium mb-2'>Tools to help</div>
              <div className='flex gap-2 items-center'>
                <Input
                  placeholder='Add Description'
                  value={form.toolsToHelp}
                  onChange={(e) => handleChange('toolsToHelp', e.target.value)}
                  className={`bg-white border border-gray-300 rounded-md px-3 py-2 text-base flex-1 ${readOnly ? 'text-gray-900 bg-gray-50' : ''}`}
                  disabled={readOnly}
                />
                {/* File upload button */}
                <div
                  {...getRootProps()}
                  className='flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-300 cursor-pointer hover:bg-gray-200'
                >
                  <input {...getInputProps()} />
                  <span role='img' aria-label='Attach file'>
                    📎
                  </span>
                </div>
                {/* Link add button */}
                <button
                  type='button'
                  onClick={() => setShowLinkInput(true)}
                  className='w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-200'
                >
                  <span role='img' aria-label='Add link'>
                    🔗
                  </span>
                </button>
              </div>
              {/* Link input, only shown when typing a link */}
              {showLinkInput && (
                <div className='flex gap-2 mt-2'>
                  <Input
                    placeholder='Paste a link (https://...)'
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className='flex-1'
                  />
                  <Button type='button' onClick={handleAddLink} className='px-3'>
                    Add
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setShowLinkInput(false);
                      setLinkInput('');
                    }}
                    className='px-3'
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {/* Show all attachments as chips/icons below the input */}
              <div className='flex flex-wrap gap-2 mt-2'>
                {/* New files being uploaded */}
                {newFiles.map((file, idx) => (
                  <div
                    key={`new-file-${idx}`}
                    className='flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm'
                  >
                    <span role='img' aria-label='File' className='text-yellow-600'>
                      📄
                    </span>
                    <span className='text-yellow-800 font-medium truncate max-w-[200px]' title={file.name}>
                      {file.name}
                    </span>
                    {uploadingFiles.has(file.name) && <span className='text-yellow-600 text-xs'>Uploading...</span>}
                    {!readOnly && !uploadingFiles.has(file.name) && (
                      <button
                        type='button'
                        onClick={() => handleRemoveFile(idx)}
                        className='text-red-500 hover:text-red-700 ml-1'
                        title='Remove file'
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {/* Existing resources */}
                {resources.map((res, idx) => (
                  <div
                    key={`existing-resource-${idx}`}
                    className='flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors'
                  >
                    {res.type === 'LINK' ? (
                      <>
                        <span role='img' aria-label='Link' className='text-green-600'>
                          🔗
                        </span>
                        <a
                          href={res.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-green-800 font-medium truncate max-w-[200px] hover:underline'
                          title={res.title || res.url}
                        >
                          {res.title || res.url}
                        </a>
                      </>
                    ) : (
                      <>
                        <span role='img' aria-label='File' className='text-purple-600'>
                          📄
                        </span>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${res.url}`}
                          download
                          className='text-purple-800 font-medium truncate max-w-[200px] hover:underline'
                          title={res.title || res.url}
                        >
                          {res.title || res.url}
                        </a>
                      </>
                    )}
                    {!readOnly && (
                      <button
                        type='button'
                        onClick={() => handleRemoveExistingResource(idx)}
                        className='text-red-500 hover:text-red-700 ml-1'
                        title='Remove resource'
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {/* New links */}
                {newLinks.map((link, idx) => (
                  <div
                    key={`new-link-${idx}`}
                    className='flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm hover:bg-green-100 transition-colors'
                  >
                    <span role='img' aria-label='Link' className='text-green-600'>
                      🔗
                    </span>
                    <a
                      href={link.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-green-800 font-medium truncate max-w-[200px] hover:underline'
                      title={link.url}
                    >
                      {link.url}
                    </a>
                    {!readOnly && (
                      <button
                        type='button'
                        onClick={() => handleRemoveLink(idx)}
                        className='text-red-500 hover:text-red-700 ml-1'
                        title='Remove link'
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className='flex justify-end mt-8'>
            {!readOnly && (
              <Button
                type='submit'
                className='bg-black text-white rounded-full px-6 py-2 text-base font-semibold shadow-none hover:bg-gray-900'
              >
                Save Task
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
