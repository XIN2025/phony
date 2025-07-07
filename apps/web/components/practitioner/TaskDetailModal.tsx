import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Edit2 } from 'lucide-react';

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    title: string;
    target: string;
    frequency: string;
    feedback: string;
    achieved: string;
    potentialActions?: string[];
    whyThisHelps?: string;
    toolsToHelp?: Array<{
      title: string;
      type: 'hyperlink' | 'PDF Doc';
      url?: string;
    }>;
  };
  readOnly?: boolean;
}

export function TaskDetailModal({ open, onOpenChange, task, readOnly = false }: TaskDetailModalProps) {
  const handleEdit = () => {
    console.log('Edit task:', task.title);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:w-[55vw] max-w-4xl max-h-[85vh] overflow-y-auto !left-[50%] !top-[50%] !translate-x-[-50%] !translate-y-[-50%]'
        showCloseButton={true}
      >
        <DialogHeader className='relative pb-4'>
          <DialogTitle className='text-lg sm:text-xl font-semibold pr-10'>Tasks</DialogTitle>
          {!readOnly && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleEdit}
              className='absolute top-0 right-0 p-2 hover:bg-muted rounded-md'
            >
              <Edit2 className='h-4 w-4' />
            </Button>
          )}
        </DialogHeader>

        <div className='space-y-4 sm:space-y-6'>
          <div>
            <h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4'>Daily Targeted Goals</h3>

            <Card className='border border-border rounded-lg'>
              <CardContent className='p-4 sm:p-6'>
                <div className='space-y-3 sm:space-y-4'>
                  <h4 className='text-base sm:text-lg font-semibold'>{task.title}</h4>

                  <div className='flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 text-sm'>
                    <div>
                      <span className='text-muted-foreground'>Target:</span>{' '}
                      <span className='font-medium'>{task.target}</span>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Frequency:</span>{' '}
                      <span className='font-medium'>{task.frequency}</span>
                    </div>
                  </div>

                  <div className='text-sm'>
                    <span className='text-muted-foreground'>Feedback:</span> <span>{task.feedback}</span>
                  </div>

                  <div className='text-sm'>
                    <span className='text-muted-foreground'>Achieved:</span>{' '}
                    <span className='font-medium'>{task.achieved}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {task.potentialActions && task.potentialActions.length > 0 && (
            <div>
              <h4 className='font-semibold mb-2 sm:mb-3 text-sm sm:text-base'>Potential Actions</h4>
              <Card className='border border-border rounded-lg'>
                <CardContent className='p-3 sm:p-4'>
                  <ul className='space-y-2'>
                    {task.potentialActions.map((action, index) => (
                      <li key={index} className='text-xs sm:text-sm flex items-start'>
                        <span className='mr-2 text-muted-foreground flex-shrink-0'>•</span>
                        <span className='leading-relaxed'>{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {task.whyThisHelps && (
            <div>
              <h4 className='font-semibold mb-2 sm:mb-3 text-sm sm:text-base'>Why this will help you</h4>
              <Card className='border border-border rounded-lg'>
                <CardContent className='p-3 sm:p-4'>
                  <p className='text-xs sm:text-sm text-foreground leading-relaxed'>{task.whyThisHelps}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {task.toolsToHelp && task.toolsToHelp.length > 0 && (
            <div>
              <h4 className='font-semibold mb-2 sm:mb-3 text-sm sm:text-base'>Tools to help</h4>
              <Card className='border border-border rounded-lg'>
                <CardContent className='p-3 sm:p-4'>
                  <div className='space-y-2'>
                    {task.toolsToHelp.map((tool, index) => (
                      <div key={index} className='text-xs sm:text-sm'>
                        {tool.url ? (
                          <a
                            href={tool.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-primary hover:text-primary/80 underline break-words'
                          >
                            {tool.title}
                          </a>
                        ) : (
                          <span className='break-words'>{tool.title}</span>
                        )}{' '}
                        <span className='text-muted-foreground'>({tool.type})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
