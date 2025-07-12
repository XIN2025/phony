import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Calendar, Target, Info, ExternalLink, FileText, CheckCircle, Clock, Star } from 'lucide-react';

interface TaskDetailModalProps {
  open: boolean;
  onClose: () => void;
  task: {
    id: string;
    description: string;
    target?: string;
    weeklyRepetitions?: number;
    isMandatory?: boolean;
    whyImportant?: string;
    recommendedActions?: string;
    toolsToHelp?: string;
    category?: string;
    isCompleted: boolean;
    resources?: Array<{
      type: 'LINK' | 'PDF';
      url: string;
      title?: string;
    }>;
    daysOfWeek?: string[];
  } | null;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ open, onClose, task }) => {
  if (!task) return null;

  const DAYS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='!fixed !top-1/2 !left-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 w-[90vw] max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm border border-white/50 shadow-xl !z-[9999]'>
        <div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 border-b border-gray-200/50'>
          <DialogHeader className='space-y-3'>
            <div className='flex items-start justify-between'>
              <div className='flex-1 min-w-0'>
                <DialogTitle className='text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight'>
                  {task.description}
                </DialogTitle>
                <div className='flex items-center gap-1 mb-2'>
                  {DAYS.map((d) => (
                    <span
                      key={d}
                      className={`w-7 h-7 flex items-center justify-center rounded-full border-2 text-xs font-semibold ml-1 ${task.daysOfWeek?.includes?.(d) ? 'border-black text-black bg-white' : 'border-gray-300 text-gray-500 bg-white'}`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className='flex flex-wrap items-center gap-2 mb-3'>
                  {task.isMandatory && (
                    <Badge variant='destructive' className='text-xs bg-red-100 text-red-700 border-red-200'>
                      <Star className='w-3 h-3 mr-1' />
                      Mandatory
                    </Badge>
                  )}
                  {task.category && (
                    <Badge variant='outline' className='text-xs bg-blue-100 text-blue-700 border-blue-200'>
                      {task.category}
                    </Badge>
                  )}
                  {task.isCompleted && (
                    <Badge variant='default' className='text-xs bg-green-100 text-green-700 border-green-200'>
                      <CheckCircle className='w-3 h-3 mr-1' />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant='ghost' size='sm' onClick={onClose} className='text-gray-500 hover:text-gray-700 p-2'>
                ✕
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className='p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto'>
          {/* Task Details */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {task.target && (
              <Card className='bg-white/60 backdrop-blur-sm border border-gray-200/50'>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Target className='w-4 h-4 text-gray-600' />
                    <span className='text-sm font-medium text-gray-700'>Target</span>
                  </div>
                  <p className='text-sm text-gray-900'>{task.target}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Why Important */}
          {task.whyImportant && (
            <Card className='bg-white/60 backdrop-blur-sm border border-gray-200/50'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <Info className='w-4 h-4 text-blue-600' />
                  <span className='text-sm font-semibold text-gray-900'>Why This Task is Important</span>
                </div>
                <p className='text-sm text-gray-700 leading-relaxed'>{task.whyImportant}</p>
              </CardContent>
            </Card>
          )}

          {/* Recommended Actions */}
          {task.recommendedActions && (
            <Card className='bg-white/60 backdrop-blur-sm border border-gray-200/50'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <Target className='w-4 h-4 text-green-600' />
                  <span className='text-sm font-semibold text-gray-900'>Recommended Actions</span>
                </div>
                <div className='text-sm text-gray-700 leading-relaxed whitespace-pre-line'>
                  {task.recommendedActions}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tools to Help */}
          {task.toolsToHelp && (
            <Card className='bg-white/60 backdrop-blur-sm border border-gray-200/50'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <Info className='w-4 h-4 text-purple-600' />
                  <span className='text-sm font-semibold text-gray-900'>Tools to Help</span>
                </div>
                <p className='text-sm text-gray-700 leading-relaxed'>{task.toolsToHelp}</p>
              </CardContent>
            </Card>
          )}

          {/* Resources */}
          {task.resources && task.resources.length > 0 && (
            <Card className='bg-white/60 backdrop-blur-sm border border-gray-200/50'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <FileText className='w-4 h-4 text-orange-600' />
                  <span className='text-sm font-semibold text-gray-900'>Resources</span>
                </div>
                <div className='space-y-2'>
                  {task.resources.map((resource, index) => (
                    <div key={index} className='flex items-center gap-2 p-2 bg-gray-50 rounded-lg'>
                      {resource.type === 'LINK' ? (
                        <ExternalLink className='w-4 h-4 text-blue-600' />
                      ) : (
                        <FileText className='w-4 h-4 text-gray-600' />
                      )}
                      <a
                        href={resource.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-blue-600 hover:text-blue-800 underline truncate flex-1'
                      >
                        {resource.title || resource.url}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className='p-6 sm:p-8 border-t border-gray-200/50 bg-gray-50/50'>
          <div className='flex justify-end'>
            <Button onClick={onClose} className='bg-gray-900 text-white hover:bg-gray-800 rounded-full px-6 py-2'>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
