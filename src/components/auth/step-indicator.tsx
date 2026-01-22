interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex justify-center items-center space-x-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all duration-300 ${
            index === currentStep ? 'w-8 bg-primary' : 'w-2 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}
