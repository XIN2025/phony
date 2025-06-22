'use client';

import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';

export type InviteData = {
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  includeIntakeForm: boolean;
  intakeFormId: string | null;
  newIntakeForm?: CreateIntakeFormDto;
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
  newIntakeForm: undefined,
};

export function InviteContextProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1);
  const [inviteData, setInviteDataState] = useState<InviteData>(initialState);

  const setInviteData = useCallback((data: Partial<InviteData>) => {
    console.log('Updating invite data:', data);
    setInviteDataState((prev: InviteData) => ({ ...prev, ...data }));
  }, []);

  const goToNextStep = useCallback(() => setStep((s) => s + 1), []);
  const goToPrevStep = useCallback(() => setStep((s) => s - 1), []);
  const goToStep = useCallback((step: number) => setStep(step), []);

  const resetInviteFlow = useCallback(() => {
    setStep(1);
    setInviteDataState(initialState);
  }, []);

  const value = {
    step,
    inviteData,
    setInviteData,
    goToNextStep,
    goToPrevStep,
    goToStep,
    resetInviteFlow,
  };

  return <InviteContext.Provider value={value}>{children}</InviteContext.Provider>;
}

export function useInviteContext() {
  const context = useContext(InviteContext);
  if (context === undefined) {
    throw new Error('useInviteContext must be used within an InviteContextProvider');
  }
  return context;
}
