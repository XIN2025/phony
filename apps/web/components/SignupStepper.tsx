import React from 'react';

interface SignupStepperProps {
  totalSteps: number;
  currentStep: number; // 1-based index
  className?: string;
}

export const SignupStepper: React.FC<SignupStepperProps> = ({ totalSteps, currentStep, className }) => {
  return (
    <div
      className={`flex items-center justify-center w-full gap-2 mb-8 ${className || ''}`.trim()}
      aria-label='Signup Progress'
    >
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const isActive = idx + 1 === currentStep;
        const isCompleted = idx + 1 < currentStep;
        return (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-200 ${
              isActive || isCompleted ? 'bg-black' : 'bg-gray-300'
            }`}
            style={{ flex: 1, minWidth: 32, maxWidth: 80 }}
            aria-current={isActive ? 'step' : undefined}
          />
        );
      })}
    </div>
  );
};
