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
    <div className='flex flex-col min-h-screen bg-background'>
      {/* Header */}
      <div className='flex flex-col gap-0 border-b bg-background px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold leading-tight'>My Forms</h1>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              onClick={handleNewForm}
              className='bg-foreground text-background hover:bg-foreground/90 rounded-full px-4 sm:px-6 py-2 text-sm font-medium'
            >
              <Plus className='h-4 w-4 mr-2' />
              New Form
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 w-full py-4 sm:py-6 lg:py-8 bg-background'>
        <div className='w-full px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8'>
          {/* Search and View Controls */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='relative flex-1 max-w-md'>
              <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                <Search className='h-4 w-4 text-muted-foreground' />
              </div>
              <Input
                placeholder='Search Content'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 rounded-full border-border'
              />
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('grid')}
                className='rounded-lg'
              >
                <Grid className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('list')}
                className='rounded-lg'
              >
                <List className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='space-y-4'>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-8 w-8 animate-spin' />
              </div>
            ) : error ? (
              <div className='text-center py-12'>
                <div className='max-w-md mx-auto'>
                  <FileText className='h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50' />
                  <h3 className='text-lg font-semibold mb-2'>Failed to load forms</h3>
                  <p className='text-muted-foreground mb-6'>
                    We couldn't load your forms. Check your connection and try again, or create a new form.
                  </p>
                  <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                    <Button onClick={() => window.location.reload()} variant='outline'>
                      Try Again
                    </Button>
                    <Button onClick={handleNewForm} className='bg-foreground text-background hover:bg-foreground/90'>
                      <Plus className='h-4 w-4 mr-2' />
                      Create New Form
                    </Button>
                  </div>
                </div>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className='text-center py-12'>
                <div className='max-w-md mx-auto'>
                  <FileText className='h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50' />
                  <h3 className='text-lg font-semibold mb-2'>
                    {searchQuery ? 'No forms match your search' : 'No forms yet'}
                  </h3>
                  <p className='text-muted-foreground mb-6'>
                    {searchQuery
                      ? `Try adjusting your search terms or create a new form.`
                      : 'Get started by creating your first intake form. You can use it to collect information from your clients.'}
                  </p>
                  <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                    <Button onClick={handleNewForm} className='bg-foreground text-background hover:bg-foreground/90'>
                      <Plus className='h-4 w-4 mr-2' />
                      Create Your First Form
                    </Button>
                    {searchQuery && (
                      <Button variant='outline' onClick={() => setSearchQuery('')}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'>
                {filteredForms.map((form) => (
                  <Card
                    key={form.id}
                    className='bg-background border border-border rounded-2xl shadow-none cursor-pointer hover:bg-muted/20 transition-colors'
                    onClick={() => handleFormClick(form.id)}
                  >
                    <CardContent className='p-4 sm:p-6'>
                      <div className='aspect-[4/3] bg-muted rounded-lg mb-4 flex items-center justify-center'>
                        <FileText className='h-8 w-8 text-muted-foreground' />
                      </div>
                      <div className='space-y-2'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <h3 className='font-medium text-sm sm:text-base line-clamp-2'>{form.title}</h3>
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
                            className='p-1 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
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
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
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
