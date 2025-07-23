import React from 'react';

interface SignupStepperProps {
  totalSteps: number;
  currentStep: number; // 1-based index
  className?: string;
}

export const SignupStepper: React.FC<SignupStepperProps> = ({ totalSteps, currentStep, className }) => {
  return (
    <div className={`flex items-center justify-between w-full ${className || ''}`.trim()} aria-label='Signup Progress'>
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const isActive = idx + 1 === currentStep;
        const isCompleted = idx + 1 < currentStep;
        return (
          <div
            key={idx}
            className={`h-1 rounded-full transition-all duration-300 flex-1`}
            style={{
              backgroundColor: isActive || isCompleted ? '#807171' : '#CCC6C6',
              marginRight: idx < totalSteps - 1 ? '8px' : '0',
            }}
            aria-current={isActive ? 'step' : undefined}
          />
        );
      })}
    </div>
  );
};
