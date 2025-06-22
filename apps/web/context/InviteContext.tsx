'use client';

import { createContext, useState, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type InviteData = {
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  includeIntakeForm: boolean;
  intakeFormId: string | null;
};

interface InviteContextType {
  step: number;
  inviteData: InviteData;
  setInviteData: (data: Partial<InviteData>) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: number) => void;
  resetInviteFlow: () => void;
}

const InviteContext = createContext<InviteContextType | undefined>(undefined);

const initialState: InviteData = {
  clientFirstName: '',
  clientLastName: '',
  clientEmail: '',
  includeIntakeForm: false,
  intakeFormId: null,
};

export function InviteContextProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1);
  const [inviteData, setInviteDataState] = useState<InviteData>(initialState);

  const setInviteData = (data: Partial<InviteData>) => {
    setInviteDataState((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => setStep((s) => s + 1);
  const goToPrevStep = () => setStep((s) => s - 1);
  const goToStep = (step: number) => setStep(step);

  const resetInviteFlow = () => {
    setStep(1);
    setInviteDataState(initialState);
  };

  const value = { step, inviteData, setInviteData, goToNextStep, goToPrevStep, goToStep, resetInviteFlow };

  return <InviteContext.Provider value={value}>{children}</InviteContext.Provider>;
}

export function useInviteContext() {
  const context = useContext(InviteContext);
  if (context === undefined) {
    throw new Error('useInviteContext must be used within an InviteContextProvider');
  }
  return context;
}
