'use client';
import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useCallback, useRef as useReactRef, useState } from 'react';
import { AudioRecorder, AudioRecorderHandle } from '@/components/recorder/AudioRecorder';
import { useGetClient, useCreateSession, useUploadSessionAudio } from '@/lib/hooks/use-api';
import { Button } from '@repo/ui/components/button';
import Image from 'next/image';
import { AudioRecorderProvider, useAudioRecorder } from '@/context/AudioRecorderContext';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@repo/ui/components/alert-dialog';

function NewSessionPageContent(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const { data: client } = useGetClient(clientId);
  const createSessionMutation = useCreateSession();
  const uploadAudioMutation = useUploadSessionAudio();
  const audioRecorderRef = useReactRef<AudioRecorderHandle>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // Navigation blocking state
  const audioRecorder = useAudioRecorder();
  const [pendingNavigation, setPendingNavigation] = useState<null | (() => void)>(null);
  const [showNavDialog, setShowNavDialog] = useState(false);
  const allowNavRef = useReactRef(false);

  // Helper: is recording or paused
  const isBlocking = audioRecorder.status === 'recording' || audioRecorder.status === 'paused';

  // Intercept browser/tab close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isBlocking) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isBlocking]);

  // Intercept router navigation (push/back)
  useEffect(() => {
    // Patch router.push and router.back
    const origPush = router.push;
    const origBack = router.back;
    // @ts-ignore
    router.push = (href, options) => {
      if (isBlocking && !allowNavRef.current) {
        setPendingNavigation(() => () => origPush.call(router, href, options));
        setShowNavDialog(true);
        return;
      }
      allowNavRef.current = false;
      return origPush.call(router, href, options);
    };
    // @ts-ignore
    router.back = () => {
      if (isBlocking && !allowNavRef.current) {
        setPendingNavigation(() => () => origBack.call(router));
        setShowNavDialog(true);
        return;
      }
      allowNavRef.current = false;
      return origBack.call(router);
    };
    return () => {
      router.push = origPush;
      router.back = origBack;
    };
  }, [isBlocking, router]);

  // Intercept sidebar navigation (patch global window for SidebarContent to use)
  useEffect(() => {
    (window as any).__CONTINUUM_BLOCK_NAV__ = (navFn: () => void) => {
      if (isBlocking) {
        setPendingNavigation(() => navFn);
        setShowNavDialog(true);
        return false;
      }
      return true;
    };
    return () => {
      delete (window as any).__CONTINUUM_BLOCK_NAV__;
    };
  }, [isBlocking]);

  // Global navigation guard: intercept all navigation attempts
  useEffect(() => {
    if (!isBlocking) return;
    const clickHandler = (e: MouseEvent) => {
      // Only intercept left-clicks
      if (e.button !== 0) return;
      let el = e.target as HTMLElement | null;
      while (el) {
        // Intercept anchor tags
        if (el.tagName === 'A' && (el as HTMLAnchorElement).href) {
          // Allow if href is just a hash or same page
          const href = (el as HTMLAnchorElement).href;
          if (href && !href.startsWith(window.location.href + '#')) {
            e.preventDefault();
            setPendingNavigation(() => () => {
              window.location.href = href;
            });
            setShowNavDialog(true);
            return;
          }
        }
        // Intercept buttons with data-nav or role=button
        if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
          // Try to detect navigation intent
          const navHref = el.getAttribute('data-href');
          if (navHref) {
            e.preventDefault();
            setPendingNavigation(() => () => {
              window.location.href = navHref;
            });
            setShowNavDialog(true);
            return;
          }
        }
        el = el.parentElement;
      }
    };
    document.addEventListener('click', clickHandler, true);

    // Patch window.location methods safely
    const origAssign = window.location.assign;
    const origReplace = window.location.replace;
    const origOpen = window.open;
    try {
      Object.defineProperty(window.location, 'assign', {
        configurable: true,
        writable: true,
        value: function (url: string) {
          if (isBlocking && !allowNavRef.current) {
            setPendingNavigation(() => () => origAssign.call(window.location, url));
            setShowNavDialog(true);
            return;
          }
          allowNavRef.current = false;
          return origAssign.call(window.location, url);
        },
      });
      Object.defineProperty(window.location, 'replace', {
        configurable: true,
        writable: true,
        value: function (url: string) {
          if (isBlocking && !allowNavRef.current) {
            setPendingNavigation(() => () => origReplace.call(window.location, url));
            setShowNavDialog(true);
            return;
          }
          allowNavRef.current = false;
          return origReplace.call(window.location, url);
        },
      });
    } catch (e) {
      // fallback: do nothing if patching fails
    }
    window.open = function (...args) {
      if (isBlocking && !allowNavRef.current) {
        setPendingNavigation(() => () => origOpen.apply(window, args));
        setShowNavDialog(true);
        return null;
      }
      allowNavRef.current = false;
      return origOpen.apply(window, args);
    };

    return () => {
      document.removeEventListener('click', clickHandler, true);
      try {
        Object.defineProperty(window.location, 'assign', { value: origAssign });
        Object.defineProperty(window.location, 'replace', { value: origReplace });
      } catch (e) {
        // fallback: do nothing if patching fails
      }
      window.open = origOpen;
    };
  }, [isBlocking, allowNavRef]);

  // Handle modal confirm/cancel
  const handleNavConfirm = useCallback(() => {
    setShowNavDialog(false);
    allowNavRef.current = true;
    if (audioRecorder.stopRecording) audioRecorder.stopRecording();
    if (pendingNavigation) {
      setTimeout(() => pendingNavigation(), 0);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, audioRecorder]);
  const handleNavCancel = useCallback(() => {
    setShowNavDialog(false);
    setPendingNavigation(null);
  }, []);

  return (
    <>
      <AlertDialog open={showNavDialog} onOpenChange={setShowNavDialog}>
        <AlertDialogContent className='test-center-modal'>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this page?</AlertDialogTitle>
            <AlertDialogDescription>
              You are currently recording audio. Leaving this page will stop your audio recording and you may lose
              unsaved data. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleNavCancel}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleNavConfirm}>Leave & Stop Recording</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className='min-h-screen flex flex-col'>
        <div className='flex flex-col gap-0 border-b px-2 lg:px-10 pt-2 pb-3 sm:pb-4'>
          <button
            type='button'
            aria-label='Back'
            onClick={() => router.back()}
            className='text-muted-foreground hover:text-foreground focus:outline-none flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full transition-all min-w-0 min-h-0 max-w-full max-h-full p-0'
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Image
              src='/arrow-right.svg'
              alt='Back'
              width={30}
              height={30}
              className='h-15 w-15 sm:h-7 sm:w-7 md:h-10 md:w-10'
            />
          </button>
          <h2
            className='text-lg sm:text-xl md:text-3xl font-bold leading-tight mt-2'
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            New Session
          </h2>
        </div>
        <div className='flex flex-col md:flex-row gap-6 p-8 flex-1'>
          <div className='flex-1 space-y-6'>
            <div className='bg-white rounded-2xl shadow-lg p-6'>
              <div className='font-semibold mb-2'>Session Details</div>
              <div className='mb-2'>
                Client:{' '}
                <span className='font-bold'>
                  {client?.firstName} {client?.lastName}
                </span>
              </div>
              <input
                className='border rounded px-2 py-1 w-full mb-2'
                placeholder='Session Title'
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
              />
            </div>
            <div className='bg-white rounded-2xl shadow-lg p-6'>
              <div className='font-semibold mb-2'>Session Notes</div>
              <textarea
                className='border rounded px-2 py-1 w-full min-h-[120px]'
                placeholder='Start typing your session notes here'
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
          </div>
          <div className='flex-1 space-y-6'>
            <div className='bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center'>
              <AudioRecorder
                ref={audioRecorderRef}
                clientId={clientId}
                sessionTitle={sessionTitle}
                sessionNotes={sessionNotes}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function NewSessionPage() {
  return (
    <AudioRecorderProvider>
      <NewSessionPageContent />
    </AudioRecorderProvider>
  );
}
