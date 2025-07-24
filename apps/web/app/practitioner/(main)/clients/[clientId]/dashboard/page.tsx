'use client';
import { JournalDetailModal } from '@/components/practitioner/JournalDetailModal';
import { AudioRecorderProvider } from '@/context/AudioRecorderContext';
import { ActionItem, ActionItemCompletion, Plan, Resource, Session } from '@repo/db';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import Link from 'next/link';

import JournalTab from './journal';
import PlansTab from './plans';
import ProfileTab from './profile';
import SessionsTab from './sessions';
import SummaryTab from './summary';

type PopulatedActionItem = ActionItem & { resources: Resource[]; completions: ActionItemCompletion[] };
type PopulatedPlan = Plan & { actionItems: PopulatedActionItem[] };
type PopulatedSession = Session & { plan: PopulatedPlan | null };

const TABS = [
  { key: 'dashboard', label: 'Summary' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'plans', label: 'Plans' },
  { key: 'journal', label: 'Journal' },
  { key: 'profile', label: 'Profile' },
];

const ClientDashboardContent = ({ clientId }: { clientId: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Add dateRange and handleJournalClick state/logic for JournalTab
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 6);
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>({
    startDate: lastWeek,
    endDate: today,
  });
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const handleJournalClick = (journal: any) => setSelectedJournal(journal);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && TABS.some((tab) => tab.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('dashboard');
    }
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const newUrl = new URL(window.location.href);
    if (newTab === 'dashboard') {
      newUrl.searchParams.delete('tab');
    } else {
      newUrl.searchParams.set('tab', newTab);
    }
    router.replace(newUrl.pathname + newUrl.search);
  };

  return (
    <div className='flex flex-col min-h-screen pt-6 sm:pt-8'>
      <div className='flex-1 w-full flex'>
        <div className='w-full px-4 sm:px-8 lg:px-16 flex flex-col gap-6 sm:gap-8'>
          <div className='w-full'>
            <div className='flex flex-row p-1 bg-[#f6f5f4] border border-[#d1d1d1] rounded-full shadow-sm w-full sm:w-fit mb-6 overflow-x-auto whitespace-nowrap'>
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={
                    tab.key === 'dashboard'
                      ? `/practitioner/clients/${clientId}/dashboard?tab=dashboard`
                      : `/practitioner/clients/${clientId}/dashboard?tab=${tab.key}`
                  }
                  className={`flex-1 text-center rounded-full p-1 px-7 py-2 text-base font-normal transition-colors border border-transparent ${
                    activeTab === tab.key
                      ? 'bg-[#D1CCE9] text-black font-semibold shadow-none'
                      : 'bg-transparent text-[#b0acae]'
                  }`}
                  scroll={false}
                  replace
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            {activeTab === 'dashboard' && <SummaryTab clientId={clientId} />}
            {activeTab === 'sessions' && <SessionsTab clientId={clientId} />}
            {activeTab === 'plans' && <PlansTab clientId={clientId} />}
            {activeTab === 'journal' && (
              <JournalTab clientId={clientId} dateRange={dateRange} handleJournalClick={handleJournalClick} />
            )}
            {activeTab === 'profile' && <ProfileTab clientId={clientId} />}
          </div>
        </div>
      </div>
      {/* Optionally, show JournalDetailModal if selectedJournal is set */}
      {selectedJournal && (
        <JournalDetailModal
          open={!!selectedJournal}
          onClose={() => setSelectedJournal(null)}
          journal={selectedJournal}
        />
      )}
    </div>
  );
};

export default function ClientDashboardPage({ params }: { params: Promise<{ clientId: string }> }) {
  const [clientId, setClientId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    params.then((resolvedParams) => {
      setClientId(resolvedParams.clientId);
    });
  }, [params]);

  if (!clientId) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
  }

  return (
    <AudioRecorderProvider>
      <ClientDashboardContent clientId={clientId} />
    </AudioRecorderProvider>
  );
}

function getLast7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days.reverse();
}

function formatDateForUrl(date: Date) {
  return date.toISOString().split('T')[0];
}

function getAvgFeedbackForDay(tasks: PopulatedActionItem[]) {
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
