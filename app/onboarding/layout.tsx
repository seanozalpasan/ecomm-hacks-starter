"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

const ONBOARDING_STEPS = [
  { path: "/onboarding/basics", label: "Basics", step: 1 },
  { path: "/onboarding/likes/1", label: "Likes 1", step: 2 },
  { path: "/onboarding/likes/2", label: "Likes 2", step: 3 },
  { path: "/onboarding/likes/3", label: "Likes 3", step: 4 },
];

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const currentStepIndex = ONBOARDING_STEPS.findIndex(
    (step) => step.path === pathname
  );
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const totalSteps = ONBOARDING_STEPS.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
            <div
              className="bg-zinc-900 dark:bg-zinc-50 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-12">
          {ONBOARDING_STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const stepNumber = index + 1;

            return (
              <div
                key={step.path}
                className="flex flex-col items-center flex-1"
              >
                <button
                  onClick={() => router.push(step.path)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 scale-110"
                      : isCompleted
                      ? "bg-zinc-700 text-white dark:bg-zinc-600 dark:text-zinc-50"
                      : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {isCompleted ? "✓" : stepNumber}
                </button>
                <span
                  className={`text-xs mt-2 text-center ${
                    isActive
                      ? "font-semibold text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Page Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

