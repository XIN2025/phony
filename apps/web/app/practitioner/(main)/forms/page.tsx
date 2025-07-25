'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Search, Grid, List, Plus, FileText, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetIntakeForms, useDeleteIntakeForm } from '@/lib/hooks/use-api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function FormsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const { data: forms, isLoading, error } = useGetIntakeForms();
  const { mutate: deleteForm, isPending: isDeleting } = useDeleteIntakeForm();

  const handleNewForm = () => {
    router.push('/practitioner/forms/new');
  };

  const handleFormClick = (formId: string) => {
    router.push(`/practitioner/forms/${formId}`);
  };

  const filteredForms = forms?.filter((form) => form.title.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return (
    <div className='flex flex-col min-h-screen min-w-0'>
      {/* Header */}
      <div className='flex flex-col gap-0  px-3 sm:px-4 lg:px-4 xl:px-6 pt-3 sm:pt-4 lg:pt-4 pb-2 sm:pb-3 lg:pb-2'>
        <div className='flex flex-row items-center bg-transparent justify-between gap-2 sm:gap-4'>
          <div className='flex items-center gap-2 min-w-0'>
            <h1
              className='font-semibold mb-2 sm:mb-0 truncate text-xl sm:text-2xl lg:text-[26px] xl:text-[32px]'
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              My Forms
            </h1>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              onClick={handleNewForm}
              className='bg-black text-white bg-[#807171] hover:bg-neutral-800 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-md transition-all w-full sm:w-auto'
            >
              <Plus className='h-4 w-4 mr-2' />
              New Intake Form
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 w-full py-3 sm:py-4 lg:py-4 xl:py-6 min-w-0'>
        <div className='w-full px-3 sm:px-4 lg:px-4 xl:px-6 space-y-4 sm:space-y-6 lg:space-y-4 min-w-0'>
          {/* Search and View Controls */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
            <div className='relative flex-1 max-w-md min-w-0'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                <Search className='h-4 w-4 text-muted-foreground' />
              </div>
              <Input
                placeholder='Search Forms'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 rounded-full border border-[#e5e7eb] bg-white/80 shadow-sm focus:ring-2 focus:ring-black/10 text-sm sm:text-base h-10 sm:h-12'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setViewMode('grid')}
                className={`rounded-lg border shadow-sm h-8 w-8 sm:h-10 sm:w-10 p-0 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-black text-white border-black hover:bg-neutral-800'
                    : 'bg-white border-[#e5e7eb] text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setViewMode('list')}
                className={`rounded-lg border shadow-sm h-8 w-8 sm:h-10 sm:w-10 p-0 transition-all ${
                  viewMode === 'list'
                    ? 'bg-black text-white border-black hover:bg-neutral-800'
                    : 'bg-white border-[#e5e7eb] text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='space-y-3 sm:space-y-4'>
            {isLoading ? (
              <div className='flex items-center justify-center py-6 sm:py-8'>
                <Loader2 className='h-6 w-6 sm:h-8 sm:w-8 animate-spin' />
              </div>
            ) : error ? (
              <div className='text-center py-8 sm:py-12'>
                <div className='max-w-md mx-auto'>
                  <FileText className='h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-muted-foreground opacity-50' />
                  <h3 className='text-base sm:text-lg font-semibold mb-2'>Failed to load forms</h3>
                  <p className='text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6'>
                    We couldn't load your forms. Check your connection and try again, or create a new form.
                  </p>
                  <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                    <Button onClick={() => window.location.reload()} variant='outline' className='text-sm sm:text-base'>
                      Try Again
                    </Button>
                    <Button
                      onClick={handleNewForm}
                      className='bg-foreground text-background hover:bg-foreground/90 text-sm sm:text-base'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Create New Form
                    </Button>
                  </div>
                </div>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className='text-center py-8 sm:py-12'>
                <div className='max-w-md mx-auto'>
                  <FileText className='h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-muted-foreground opacity-50' />
                  <h3 className='text-base sm:text-lg font-semibold mb-2'>
                    {searchQuery ? 'No forms match your search' : 'No forms yet'}
                  </h3>
                  <p className='text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6'>
                    {searchQuery
                      ? `Try adjusting your search terms or create a new form.`
                      : 'Get started by creating your first intake form. You can use it to collect information from your clients.'}
                  </p>
                  <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                    <Button
                      onClick={handleNewForm}
                      className='bg-black text-white hover:bg-neutral-800 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold shadow-md transition-all'
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Create Your First Form
                    </Button>
                    {searchQuery && (
                      <Button variant='outline' onClick={() => setSearchQuery('')} className='text-sm sm:text-base'>
                        Clear Search
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 min-w-0'>
                {filteredForms.map((form) => (
                  <Card
                    key={form.id}
                    className='bg-white rounded-xl sm:rounded-2xl shadow-md cursor-pointer hover:bg-gray-100 transition-colors border-0 min-w-0'
                    onClick={() => handleFormClick(form.id)}
                  >
                    <CardContent className='p-3 sm:p-4 lg:p-4'>
                      <div className='aspect-[4/3] bg-muted rounded-lg mb-3 sm:mb-4 flex items-center justify-center'>
                        <FileText className='h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground' />
                      </div>
                      <div className='space-y-2'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1 min-w-0'>
                            <h3 className='font-medium text-sm sm:text-base line-clamp-2 truncate'>{form.title}</h3>
                            <p className='text-xs text-muted-foreground'>
                              {format(new Date(form.updatedAt), 'MMM d, yyyy')}
                            </p>
                            <div className='flex items-center gap-2 mt-1'>
                              <span className='text-xs text-muted-foreground'>
                                {form.questions?.length || 0} questions
                              </span>
                              <span className='text-xs text-muted-foreground'>•</span>
                              <span className='text-xs text-muted-foreground'>
                                {form.submissionCount || 0} submissions
                              </span>
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='p-1 h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0'
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteForm(form.id, {
                                onSuccess: () => {
                                  toast.success('Form deleted successfully');
                                },
                                onError: () => {
                                  toast.error('Failed to delete form');
                                },
                              });
                            }}
                            disabled={isDeleting}
                          >
                            <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='space-y-2 sm:space-y-3'>
                {filteredForms.map((form) => (
                  <Card
                    key={form.id}
                    className='bg-white rounded-lg sm:rounded-xl shadow-md cursor-pointer hover:bg-gray-100 transition-colors border-0 min-w-0'
                    onClick={() => handleFormClick(form.id)}
                  >
                    <CardContent className='p-3 sm:p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3 min-w-0 flex-1'>
                          <div className='h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0'>
                            <FileText className='h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground' />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <h3 className='font-medium text-sm sm:text-base truncate'>{form.title}</h3>
                            <p className='text-xs text-muted-foreground'>
                              {format(new Date(form.updatedAt), 'MMM d, yyyy')}
                            </p>
                            <div className='flex items-center gap-2 mt-1'>
                              <span className='text-xs text-muted-foreground'>
                                {form.questions?.length || 0} questions
                              </span>
                              <span className='text-xs text-muted-foreground'>•</span>
                              <span className='text-xs text-muted-foreground'>
                                {form.submissionCount || 0} submissions
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='p-1 h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0'
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteForm(form.id, {
                              onSuccess: () => {
                                toast.success('Form deleted successfully');
                              },
                              onError: () => {
                                toast.error('Failed to delete form');
                              },
                            });
                          }}
                          disabled={isDeleting}
                        >
                          <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
