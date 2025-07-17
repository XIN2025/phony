'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Loader2, X } from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { createPortal } from 'react-dom';

interface ComprehensiveSummary {
  title: string;
  summary: string;
  keyInsights: string[];
  recommendations: string[];
}

interface ComprehensiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ComprehensiveSummary | null;
  isLoading: boolean;
  clientName: string;
}

export function ComprehensiveSummaryModal({
  isOpen,
  onClose,
  summary,
  isLoading,
  clientName,
}: ComprehensiveSummaryModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />

      {/* Modal */}
      <div className='relative bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-2 sm:p-6'>
        {/* Header */}
        <div className='flex items-start justify-between mb-4 gap-4'>
          <div className='flex-1 min-w-0'>
            <h2 className='text-lg sm:text-xl font-bold break-words'>{summary?.title || 'Comprehensive Summary'}</h2>
            <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-1'>
              <span>Client: {clientName}</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <Button variant='ghost' size='sm' onClick={onClose} className='h-8 w-8 p-0 flex-shrink-0'>
            <X className='h-4 w-4' />
          </Button>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-8 sm:py-12'>
            <div className='text-center'>
              <Loader2 className='h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary' />
              <p className='text-sm sm:text-base text-muted-foreground'>Generating comprehensive summary...</p>
              <p className='text-xs sm:text-sm text-muted-foreground mt-2'>
                This may take a few moments as we analyze all sessions
              </p>
            </div>
          </div>
        ) : summary ? (
          <div className='space-y-4 sm:space-y-6'>
            {/* Key Insights */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base sm:text-lg'>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {summary.keyInsights.map((insight, index) => (
                    <div key={index} className='flex items-start gap-2 sm:gap-3'>
                      <Badge variant='secondary' className='mt-0.5 sm:mt-1 flex-shrink-0 text-xs'>
                        {index + 1}
                      </Badge>
                      <p className='text-xs sm:text-sm leading-relaxed'>{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main Summary */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base sm:text-lg'>Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='prose prose-sm max-w-none text-xs sm:text-sm'>
                  <MarkdownRenderer content={summary.summary} />
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base sm:text-lg'>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {summary.recommendations.map((recommendation, index) => (
                    <div key={index} className='flex items-start gap-2 sm:gap-3'>
                      <Badge variant='outline' className='mt-0.5 sm:mt-1 flex-shrink-0 text-xs'>
                        {index + 1}
                      </Badge>
                      <p className='text-xs sm:text-sm leading-relaxed'>{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='text-center py-8 sm:py-12'>
            <p className='text-sm sm:text-base text-muted-foreground'>No summary available</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
