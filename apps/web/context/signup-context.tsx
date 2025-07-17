'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SignUpData {
  // From Create Account
  email?: string;
  invitationToken?: string;

  // From Personal Details
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dob?: string;
  occupation?: string;
  profileImage?: File | null;
}

interface SignUpContextType {
  signUpData: SignUpData;
  updateSignUpData: (data: Partial<SignUpData>) => void;
}

const SignUpContext = createContext<SignUpContextType | undefined>(undefined);

export const SignUpProvider = ({ children }: { children: ReactNode }) => {
  const [signUpData, setSignUpData] = useState<SignUpData>({});

  const updateSignUpData = (data: Partial<SignUpData>) => {
    setSignUpData((prev) => ({ ...prev, ...data }));
  };

  return <SignUpContext.Provider value={{ signUpData, updateSignUpData }}>{children}</SignUpContext.Provider>;
};

export const useSignUpContext = () => {
  const context = useContext(SignUpContext);
  if (!context) {
    throw new Error('useSignUpContext must be used within a SignUpProvider');
  }
  return context;
};
