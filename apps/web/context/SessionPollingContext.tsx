import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ApiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface SessionPollingContextType {
  addPendingSession: (sessionId: string) => void;
}

const SessionPollingContext = createContext<SessionPollingContextType | undefined>(undefined);

export const SessionPollingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingSessions, setPendingSessions] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pendingSessions');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('pendingSessions', JSON.stringify(pendingSessions));
  }, [pendingSessions]);

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (pendingSessions.length === 0) return;
    pollingRef.current = setInterval(async () => {
      for (const sessionId of pendingSessions) {
        try {
          const session = await ApiClient.get<{ status: string; title?: string }>(`/api/sessions/${sessionId}`);
          if (session.status === 'REVIEW_READY' || session.status === 'COMPLETED') {
            toast.success(
              `Transcript for "${session.title || 'Session'}" is ready! You can review the transcription and AI summary on the Sessions page.`,
            );
            setPendingSessions((prev) => prev.filter((id) => id !== sessionId));
          } else if (
            session.status === 'TRANSCRIPTION_FAILED' ||
            session.status === 'FAILED' ||
            session.status === 'ERROR'
          ) {
            toast.error(
              `Transcription failed for "${session.title || 'Session'}". You can review the session and try again from the Sessions page.`,
            );
            setPendingSessions((prev) => prev.filter((id) => id !== sessionId));
          }
        } catch (e) {}
      }
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pendingSessions]);

  const addPendingSession = (sessionId: string) => {
    setPendingSessions((prev) => (prev.includes(sessionId) ? prev : [...prev, sessionId]));
  };

  return <SessionPollingContext.Provider value={{ addPendingSession }}>{children}</SessionPollingContext.Provider>;
};

export const useSessionPolling = () => {
  const ctx = useContext(SessionPollingContext);
  if (!ctx) throw new Error('useSessionPolling must be used within SessionPollingProvider');
  return ctx;
};
