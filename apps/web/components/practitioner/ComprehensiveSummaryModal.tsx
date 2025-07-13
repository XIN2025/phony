'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Loader2, Download, Copy, Check } from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { toast } from 'sonner';

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
  isCached?: boolean;
}

export function ComprehensiveSummaryModal({
  isOpen,
  onClose,
  summary,
  isLoading,
  clientName,
  isCached = false,
}: ComprehensiveSummaryModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    if (!summary) return;

    const textToCopy = `${summary.title}\n\n${summary.summary}\n\nKey Insights:\n${summary.keyInsights.map((insight) => `• ${insight}`).join('\n')}\n\nRecommendations:\n${summary.recommendations.map((rec) => `• ${rec}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Summary copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy summary');
    }
  };

  const handleDownloadSummary = () => {
    if (!summary) return;

    const content = `${summary.title}\n\n${summary.summary}\n\nKey Insights:\n${summary.keyInsights.map((insight) => `• ${insight}`).join('\n')}\n\nRecommendations:\n${summary.recommendations.map((rec) => `• ${rec}`).join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientName}-comprehensive-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto my-8'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold'>{summary?.title || 'Comprehensive Summary'}</DialogTitle>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <span>Client: {clientName}</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString()}</span>
            {isCached && (
              <>
                <span>•</span>
                <Badge variant='secondary'>Cached</Badge>
              </>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-primary' />
              <p className='text-muted-foreground'>Generating comprehensive summary...</p>
              <p className='text-sm text-muted-foreground mt-2'>
                This may take a few moments as we analyze all sessions
              </p>
            </div>
          </div>
        ) : summary ? (
          <div className='space-y-6'>
            {/* Action buttons */}
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={handleCopySummary} className='flex items-center gap-2'>
                {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </Button>
              <Button variant='outline' size='sm' onClick={handleDownloadSummary} className='flex items-center gap-2'>
                <Download className='h-4 w-4' />
                Download
              </Button>
            </div>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {summary.keyInsights.map((insight, index) => (
                    <div key={index} className='flex items-start gap-3'>
                      <Badge variant='secondary' className='mt-1 flex-shrink-0'>
                        {index + 1}
                      </Badge>
                      <p className='text-sm'>{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main Summary */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='prose prose-sm max-w-none'>
                  <MarkdownRenderer content={summary.summary} />
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {summary.recommendations.map((recommendation, index) => (
                    <div key={index} className='flex items-start gap-3'>
                      <Badge variant='outline' className='mt-1 flex-shrink-0'>
                        {index + 1}
                      </Badge>
                      <p className='text-sm'>{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='text-center py-12'>
            <p className='text-muted-foreground'>No summary available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
