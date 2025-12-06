"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ONBOARDING_STEPS = [
	{ path: "/onboarding/basics", label: "Basics", step: 1 },
	{ path: "/onboarding/interests", label: "Interests", step: 2 },
];

export default function OnboardingLayout({
	children,
}: {
	children: ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();

	const currentStepIndex = ONBOARDING_STEPS.findIndex(
		(step) => step.path === pathname,
	);

	return (
		<div className=" from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
			<div className="container mx-auto px-4 py-8 max-w-2xl">
				{/* Step Indicators */}
				<div className="flex gap-4 mb-12">
					{ONBOARDING_STEPS.map((step, index) => {
						const isActive = index === currentStepIndex;
						const isCompleted = index < currentStepIndex;
						const stepNumber = index + 1;

						return (
							<div
								key={step.path}
								className="flex flex-col items-center flex-1"
							>
								<Button
									type="button"
									onClick={() => router.push(step.path)}
									size="icon"
									className={cn(
										"w-10 h-10 rounded-full font-semibold",
										isActive &&
											"bg-zinc-900 text-white dark: dark:text-zinc-900 scale-110",
										isCompleted &&
											"bg-zinc-700 text-white dark:bg-zinc-600 dark:text-zinc-50",
										!isActive &&
											!isCompleted &&
											"bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
									)}
								>
									{isCompleted ? "✓" : stepNumber}
								</Button>
								<span
									className={cn(
										"text-xs mt-2 text-center",
										isActive
											? "font-semibold text-zinc-900 dark:text-zinc-50"
											: "text-zinc-500 dark:text-zinc-400",
									)}
								>
									{step.label}
								</span>
							</div>
						);
					})}
				</div>

				<div>{children}</div>
			</div>
		</div>
	);
}
