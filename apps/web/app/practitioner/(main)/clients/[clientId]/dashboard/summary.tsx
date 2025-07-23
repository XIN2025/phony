import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ClipboardList, BookText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { Card } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { DateRange } from 'react-date-range';
import { createPortal } from 'react-dom';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { getAvatarUrl, getFileUrl, getInitials, isSameDay } from '@/lib/utils';
import {
  useGetClient,
  useGetClientActionItemsInRange,
  useGetClientJournalEntries,
  useGenerateComprehensiveSummary,
  useGetSessionsByClient,
} from '@/lib/hooks/use-api';
import { useRouter } from 'next/navigation';

function getAvgFeedbackForDay(tasks: any[]) {
  if (!tasks || tasks.length === 0) return 'Nil';
  const allCompletions = tasks.flatMap((task) => task.completions || []);
  if (allCompletions.length === 0) return 'Nil';
  const totalRating = allCompletions.reduce((sum, completion) => sum + (completion.rating || 0), 0);
  const avgRating = totalRating / allCompletions.length;
  if (avgRating >= 4) return 'Happy';
  if (avgRating >= 2.5) return 'Neutral';
  return 'Sad';
}

function getDateRangeArray(start: Date, end: Date) {
  const arr = [];
  let dt = new Date(start);
  while (dt <= end) {
    arr.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}

export default function SummaryTab({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6);
    return {
      startDate: lastWeek,
      endDate: today,
      key: 'selection',
    };
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMounted, setDatePickerMounted] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    setDatePickerMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (showDatePicker && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      const pickerHeight = 380;
      const pickerWidth = 350;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      let top = rect.bottom + window.scrollY;
      if (spaceBelow < pickerHeight && spaceAbove > pickerHeight) {
        top = rect.top + window.scrollY - pickerHeight;
      }
      let left = rect.left + window.scrollX;
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 8;
      }
      setPickerPosition({ top, left, width: rect.width });
    }
  }, [showDatePicker]);

  useEffect(() => {
    if (!showDatePicker) return;
    const handleClick = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node) &&
        dateButtonRef.current &&
        !dateButtonRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowDatePicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showDatePicker]);

  const { data: client, isLoading: isClientLoading } = useGetClient(clientId);
  const { data: sessions = [], isLoading: isSessionsLoading } = useGetSessionsByClient(clientId);
  const { data: journalEntries = [] } = useGetClientJournalEntries(clientId);
  const { data: rangedActionItems = [], isLoading: isActionItemsLoading } = useGetClientActionItemsInRange(
    clientId,
    dateRange.startDate.toISOString().split('T')[0] || '',
    dateRange.endDate.toISOString().split('T')[0] || '',
  );
  const [showComprehensiveSummary, setShowComprehensiveSummary] = useState(false);
  const [comprehensiveSummary, setComprehensiveSummary] = useState<any>(null);
  const [isSummaryCached, setIsSummaryCached] = useState(false);
  const generateComprehensiveSummaryMutation = useGenerateComprehensiveSummary();

  const filteredTasks = rangedActionItems;
  const filteredJournals = useMemo(() => {
    const { startDate, endDate } = dateRange;
    return (journalEntries || []).filter((j) => {
      const d = new Date(j.createdAt);
      return d >= startDate && d <= endDate;
    });
  }, [journalEntries, dateRange]);

  const weekDates = getDateRangeArray(dateRange.startDate, dateRange.endDate);
  const totalTasks = weekDates.reduce((sum, date) => {
    return (
      sum +
      filteredTasks.filter((t) => {
        const dayOfWeek = date.getDay();
        const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
        const selectedDayShort = dayMap[dayOfWeek];
        if (t.isMandatory) {
          if (t.daysOfWeek && t.daysOfWeek.length > 0) {
            return t.daysOfWeek.some((day: string) => day === selectedDayShort);
          }
          return true;
        } else {
          if (t.daysOfWeek && t.daysOfWeek.length > 0) {
            return t.daysOfWeek.some((day: string) => day === selectedDayShort);
          }
          return true;
        }
      }).length
    );
  }, 0);
  const completedTasks = weekDates.reduce((sum, date) => {
    return (
      sum +
      filteredTasks.filter((t) => {
        const dayOfWeek = date.getDay();
        const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
        const selectedDayShort = dayMap[dayOfWeek];
        if (t.completions && t.completions.length > 0) {
          if (t.daysOfWeek && t.daysOfWeek.length > 0) {
            return t.daysOfWeek.some((day: string) => day === selectedDayShort);
          }
          return true;
        }
        return false;
      }).length
    );
  }, 0);

  const completion = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    const completed = filteredTasks.filter((t) => t.completions && t.completions.length > 0).length;
    return Math.round((completed / filteredTasks.length) * 100);
  }, [filteredTasks]);

  const handleGenerateComprehensiveSummary = async () => {
    if (isSummaryCached && comprehensiveSummary && comprehensiveSummary.lastSessionCount === sessions.length) {
      setShowComprehensiveSummary(true);
      return;
    }
    try {
      setShowComprehensiveSummary(true);
      setIsSummaryCached(false);
      const summary = await generateComprehensiveSummaryMutation.mutateAsync(clientId);
      setComprehensiveSummary({ ...summary, lastSessionCount: sessions.length });
      setIsSummaryCached(summary.isCached || false);
    } catch (error: any) {
      setShowComprehensiveSummary(false);
    }
  };

  const feedbackBadge = (feedback: string) => {
    let badgeClass = 'bg-gray-200 text-gray-700';
    let emoji = '';
    if (feedback === 'Happy') {
      badgeClass = 'bg-[#C7E8D4] text-black';
      emoji = '😊';
    } else if (feedback === 'Neutral') {
      badgeClass = 'bg-[#F8EFC7] text-black';
      emoji = '😐';
    } else if (feedback === 'Sad') {
      badgeClass = 'bg-[#F8D7D7] text-black';
      emoji = '🙁';
    } else if (feedback === 'Nil') {
      badgeClass = 'bg-[#D1CDCB] text-black';
      emoji = '';
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-5 py-1.5 text-sm font-semibold ${badgeClass}`}
        style={{ minWidth: 80, justifyContent: 'center' }}
      >
        {emoji && <span className='mr-1'>{emoji}</span>}
        {feedback}
      </span>
    );
  };

  const journalBadge = (journal: string) => journal;

  // Helper to format date for URL (YYYY-MM-DD)
  function formatDateForUrl(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (isClientLoading || isSessionsLoading || isActionItemsLoading) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  // --- UI ---
  return (
    <div className='flex flex-col gap-6 w-full mb-8'>
      {/* Date Picker Button */}
      <div className='flex flex-row items-center justify-between gap-2 sm:gap-4 mb-4'>
        <h2
          className='text-2xl md:text-3xl lg:text-4xl font-semibold'
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Summary
        </h2>
        <button
          ref={dateButtonRef}
          className='flex items-center gap-2 px-2 py-1 sm:px-4 sm:py-2 rounded-full border border-[#ececec] border-gray-700 shadow-sm text-xs sm:text-base font-semibold hover:bg-[#f6f5f4] transition-all min-w-[120px] sm:min-w-[220px]'
          onClick={() => setShowDatePicker((v) => !v)}
          aria-label='Select date range'
          type='button'
        >
          <span className='mr-2'>
            <svg width='20' height='20' fill='none' viewBox='0 0 24 24'>
              <rect x='3' y='5' width='18' height='16' rx='3' stroke='#222' strokeWidth='1.5' />
              <path d='M16 3v4M8 3v4' stroke='#222' strokeWidth='1.5' strokeLinecap='round' />
            </svg>
          </span>
          {dateRange.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          <span className='mx-1'>-</span>
          {dateRange.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </button>
      </div>
      {/* Calendar Overlay */}
      {datePickerMounted &&
        showDatePicker &&
        createPortal(
          <div
            ref={datePickerRef}
            style={{
              position: 'absolute',
              top: pickerPosition.top,
              left: pickerPosition.left,
              zIndex: 50,
              width: typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 350,
              maxWidth: '95vw',
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid #ececec',
              padding: typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : 16,
            }}
            className='calendar-float'
          >
            <DateRange
              ranges={[dateRange]}
              onChange={(ranges) => {
                const range = ranges.selection || {};
                setDateRange({
                  startDate: range.startDate || dateRange.startDate,
                  endDate: range.endDate || dateRange.endDate,
                  key: 'selection',
                });
                setShowDatePicker(false);
              }}
              moveRangeOnFirstSelection={false}
              months={1}
              direction='horizontal'
              rangeColors={['#222']}
              editableDateInputs={false}
              showMonthAndYearPickers={true}
            />
          </div>,
          document.body,
        )}
      {/* End Date Picker */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-full'>
        <div className='bg-white rounded-2xl shadow-md border border-[#ececec] p-6 flex flex-col items-start gap-2'>
          <div className='flex items-center justify-between w-full'>
            <div
              className='text-[2rem] font-extrabold'
              style={{ fontFamily: "'DM Serif Display', serif", color: '#807171' }}
            >
              {completion}%
            </div>
            <ClipboardList className='h-10 w-10 text-[#807171]' />
          </div>
          <div className='text-base font-semibold text-black/80'>Avg Daily Tasks Completion</div>
        </div>
        <div className='bg-white rounded-2xl shadow-md border border-[#ececec] p-6 flex flex-col items-start gap-2'>
          <div className='flex items-center justify-between w-full'>
            <div
              className='text-[2rem] font-extrabold'
              style={{ fontFamily: "'DM Serif Display', serif", color: '#807171' }}
            >
              {filteredJournals.length}
            </div>
            <BookText className='h-10 w-10 text-[#807171]' />
          </div>
          <div className='text-base font-semibold text-black/80'>Journal Entries</div>
        </div>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-full'>
        <div className='bg-white rounded-2xl shadow-md border border-[#ececec] p-0 flex-1 min-w-0'>
          <div className='p-6 pb-2'>
            <div className='text-2xl font-bold mb-4' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Last Week's Overview
            </div>
          </div>
          <div className='overflow-x-auto w-full'>
            <Table className='min-w-[320px] sm:min-w-[600px] bg-white rounded-2xl overflow-hidden text-xs sm:text-sm'>
              <TableHeader>
                <TableRow className='bg-white'>
                  <TableHead className='px-7 py-4 text-left text-base font-bold text-black border-b border-[#e5e5e5]'>
                    Date
                  </TableHead>
                  <TableHead className='px-7 py-4 text-left text-base font-bold text-black border-b border-[#e5e5e5]'>
                    Tasks
                  </TableHead>
                  <TableHead className='px-7 py-4 text-left text-base font-bold text-black border-b border-[#e5e5e5]'>
                    Avg Task Feedback
                  </TableHead>
                  <TableHead className='px-7 py-4 text-left text-base font-bold text-black border-b border-[#e5e5e5]'>
                    Journal Entry
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getDateRangeArray(dateRange.startDate, dateRange.endDate)
                  .reverse()
                  .map((date) => {
                    const dayTasks = filteredTasks.filter((t) => {
                      const dayOfWeek = date.getDay();
                      const dayMap = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
                      const selectedDayShort = dayMap[dayOfWeek];
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selectedDate = new Date(date);
                      selectedDate.setHours(0, 0, 0, 0);
                      if (t.isMandatory) {
                        const isCompleted = t.completions && t.completions.length > 0;
                        if (isCompleted) {
                          if (t.daysOfWeek && t.daysOfWeek.length > 0) {
                            return t.daysOfWeek.some((day: string) => day === selectedDayShort);
                          }
                          return true;
                        } else {
                          if (selectedDate >= today) {
                            return true;
                          }
                          if (t.daysOfWeek && t.daysOfWeek.length > 0) {
                            return t.daysOfWeek.some((day: string) => day === selectedDayShort);
                          }
                          return true;
                        }
                      } else {
                        if (t.daysOfWeek && t.daysOfWeek.length > 0) {
                          return t.daysOfWeek.some((day: string) => day === selectedDayShort);
                        }
                        return true;
                      }
                    });
                    const completed = dayTasks.filter((t) => t.completions && t.completions.length > 0).length;
                    const feedback = getAvgFeedbackForDay(dayTasks);
                    const journal = filteredJournals.some((j) => isSameDay(new Date(j.createdAt), date)) ? 'Yes' : 'No';
                    return (
                      <TableRow
                        key={date.toISOString()}
                        className='border-b last:border-b-0 border-[#ececec] bg-white hover:bg-[#f6f5f4] transition-colors cursor-pointer'
                        onClick={() => router.push(`/practitioner/clients/${clientId}/tasks/${formatDateForUrl(date)}`)}
                      >
                        <TableCell className='px-7 py-4 whitespace-nowrap text-base text-black'>
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className='px-7 py-4 whitespace-nowrap text-base text-black'>{`${completed}/${dayTasks.length}`}</TableCell>
                        <TableCell className='px-7 py-4 whitespace-nowrap'>{feedbackBadge(feedback)}</TableCell>
                        <TableCell className='px-7 py-4 whitespace-nowrap'>{journalBadge(journal)}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className='bg-white rounded-2xl shadow-md border border-[#ececec] p-4 sm:p-6 flex flex-col gap-4 w-full min-w-0'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
            <div className='text-2xl font-bold flex items-center' style={{ fontFamily: "'DM Serif Display', serif" }}>
              Snapshot
              {isSummaryCached && (
                <span className='ml-2 px-2 py-0.5 text-xs rounded-full bg-[#f6f5f4] text-gray-600 border border-gray-300'>
                  Cached
                </span>
              )}
            </div>
            <Button
              variant='outline'
              className='rounded-full border border-black px-4 py-1.5 text-base font-semibold hover:bg-[#f6f5f4] transition-all w-full sm:w-auto mt-2 sm:mt-0'
              onClick={handleGenerateComprehensiveSummary}
              disabled={generateComprehensiveSummaryMutation.isPending}
            >
              {generateComprehensiveSummaryMutation.isPending ? 'Generating...' : 'Generate Snapshot'}
            </Button>
          </div>
          <div className='text-lg font-semibold text-[#2d4739] mb-2'>Last Week's Progress</div>
          <div className='flex flex-col sm:flex-row gap-3 mb-2'>
            <div className='flex-1 bg-white border border-[#ececec] rounded-xl p-3 sm:p-4 flex flex-col items-center mb-2 sm:mb-0'>
              <div className='text-xs text-gray-500 mb-1'>Tasks Done</div>
              <div className='text-xl font-bold'>
                {completedTasks}/{totalTasks}
              </div>
            </div>
            <div className='flex-1 bg-white border border-[#ececec] rounded-xl p-3 sm:p-4 flex flex-col items-center'>
              <div className='text-xs text-gray-500 mb-1'>Avg Task Feedback</div>
              <div className='text-xl font-bold flex items-center gap-1'>
                <span>
                  {(() => {
                    const avgFeedback = getAvgFeedbackForDay(filteredTasks);
                    if (avgFeedback === 'Happy') return '😊';
                    if (avgFeedback === 'Neutral') return '😐';
                    if (avgFeedback === 'Sad') return '🙁';
                    return '';
                  })()}
                </span>
                <span>
                  {(() => {
                    const avgFeedback = getAvgFeedbackForDay(filteredTasks);
                    if (avgFeedback === 'Happy') return 'Happy';
                    if (avgFeedback === 'Neutral') return 'Neutral';
                    if (avgFeedback === 'Sad') return 'Sad';
                    return 'Nil';
                  })()}
                </span>
              </div>
            </div>
          </div>
          <div className='bg-white border border-[#ececec] rounded-xl p-3 sm:p-4 mb-2 overflow-x-auto'>
            <div className='text-xs font-semibold mb-1'>Previous Session Summary</div>
            <div className='text-sm text-gray-700'>
              {comprehensiveSummary?.summary ? (
                <MarkdownRenderer content={comprehensiveSummary.summary} />
              ) : (
                'No summary available.'
              )}
            </div>
          </div>
          <div className='bg-white border border-[#ececec] rounded-xl p-3 sm:p-4'>
            <div className='text-xs font-semibold mb-1'>Insights</div>
            <div className='text-sm text-gray-700'>
              {Array.isArray(comprehensiveSummary?.keyInsights)
                ? comprehensiveSummary.keyInsights.map((insight: string, idx: number) => (
                    <div key={idx} className='mb-1'>
                      • {insight}
                    </div>
                  ))
                : 'No insights available.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
