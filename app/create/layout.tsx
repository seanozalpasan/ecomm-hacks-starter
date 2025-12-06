"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CREATE_GAME_STEPS = [
	{ path: "/create/basics", label: "Details", step: 1 },
	{ path: "/create/invites", label: "Invites", step: 2 },
	{ path: "/create/confirm", label: "Confirm", step: 3 },
];

export default function CreateGameLayout({
	children,
}: {
	children: ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();

	const currentStepIndex = CREATE_GAME_STEPS.findIndex(
		(step) => step.path === pathname,
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-zinc-900 dark:to-purple-950">
				<div className="container mx-auto px-4 py-8 max-w-2xl">
					{/* Progress Indicator */}
					<div className="mb-8">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-purple-900 dark:text-purple-100">
								Step {currentStep} of {totalSteps}
							</span>
							<span className="text-sm font-medium text-purple-900 dark:text-purple-100">
								{Math.round((currentStep / totalSteps) * 100)}%
							</span>
						</div>
						<div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-2">
							<div
								className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all duration-300"
								style={{ width: `${(currentStep / totalSteps) * 100}%` }}
							/>
						</div>
					</div>

					{/* Step Indicators */}
					<div className="flex justify-between mb-12">
						{CREATE_GAME_STEPS.map((step, index) => {
							const isActive = index === currentStepIndex;
							const isCompleted = index < currentStepIndex;
							const stepNumber = index + 1;
		<div className="min-h-screen bg-white dark:bg-zinc-900">
			<div className="container mx-auto px-4 py-8 max-w-2xl">
				{/* Step Indicators */}
				<div className="flex justify-between mb-12">
					{CREATE_GAME_STEPS.map((step, index) => {
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
												? "bg-purple-600 text-white dark:bg-purple-400 dark:text-purple-900 scale-110"
												: isCompleted
													? "bg-purple-500 text-white dark:bg-purple-600 dark:text-white"
													: "bg-purple-200 text-purple-500 dark:bg-purple-800 dark:text-purple-300"
										}`}
									>
										{isCompleted ? "✓" : stepNumber}
									</button>
									<span
										className={`text-xs mt-2 text-center ${
											isActive
												? "font-semibold text-purple-900 dark:text-purple-100"
												: "text-purple-700 dark:text-purple-300"
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
						return (
							<div
								key={step.path}
								className="flex flex-col items-center flex-1"
							>
								<Button
									type="button"
									variant={isActive || isCompleted ? "default" : "outline"}
									size="icon"
									onClick={() => router.push(step.path)}
									className={cn(
										"w-10 h-10 rounded-full font-semibold text-sm",
										isActive || isCompleted
											? "bg-black text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-white"
											: "border-2 border-gray-300 dark:border-zinc-600 bg-transparent text-gray-300 dark:text-zinc-600 hover:bg-transparent",
									)}
								>
									{stepNumber}
								</Button>
								<span
									className={`text-xs mt-2 text-center ${
										isActive
											? "font-semibold text-black dark:text-white"
											: "text-gray-400 dark:text-zinc-500"
									}`}
								>
									{step.label}
								</span>
							</div>
						);
					})}
				</div>
				{/* Page Content */}
				<div className="bg-white dark:bg-zinc-800 p-8">{children}</div>
			</div>
		</div>
	);
}
