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
								<Button
									type="button"
									onClick={() => router.push(step.path)}
									className={cn(
										"w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
										isActive || isCompleted
											? "bg-black text-white dark:bg-white dark:text-black"
											: "border-2 border-gray-300 dark:border-zinc-600 bg-transparent text-gray-300 dark:text-zinc-600",
									)}
								>
									{stepNumber}
								</Button>
								<span
									className={cn(
										"text-xs mt-2 text-center",
										isActive
											? "font-semibold text-black dark:text-white"
											: "text-gray-400 dark:text-zinc-500",
									)}
								>
									{step.label}
								</span>
							</div>
						);
					})}
				</div>

				{/* Page Content */}
				{children}
			</div>
		</div>
	);
}
