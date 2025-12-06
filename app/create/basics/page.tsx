"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getGameData, saveGameData } from "@/lib/utils/game-storage";
import { type GameBasicsInput, gameBasicsSchema } from "@/schemas/games/create";

type GameBasicsFormData = GameBasicsInput;

const TOTAL_STEPS = 5;

export default function CreateGameBasicsPage() {
	const router = useRouter();
	const idPrefix = useId();
	const [calendarOpen, setCalendarOpen] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setValue,
		watch,
	} = useForm<GameBasicsFormData>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(gameBasicsSchema) as any,
		defaultValues: {
			name: "",
			priceLimit: 50,
			deadline: undefined,
			categories: [],
		},
	});

	const priceLimit = watch("priceLimit", 50);
	const name = watch("name", "");
	const deadline = watch("deadline");
	const categories = watch("categories", []);

	// Fun pastel colors for discrete segments
	const PASTEL_COLORS = [
		{ min: 1, max: 20, color: "rgb(255, 182, 193)" }, // Pastel pink
		{ min: 21, max: 40, color: "rgb(221, 160, 221)" }, // Pastel purple
		{ min: 41, max: 60, color: "rgb(176, 224, 230)" }, // Pastel blue
		{ min: 61, max: 80, color: "rgb(144, 238, 144)" }, // Pastel green
		{ min: 81, max: 100, color: "rgb(255, 218, 185)" }, // Pastel peach
	];

	const getSegmentColor = (value: number) => {
		const segment = PASTEL_COLORS.find((s) => value >= s.min && value <= s.max);
		return segment?.color || PASTEL_COLORS[0].color;
	};

	const getSliderBackground = () => {
		const segments = PASTEL_COLORS.map((segment) => {
			const startPercent = ((segment.min - 1) / 99) * 100;
			const endPercent = ((segment.max - 1) / 99) * 100;
			return `${segment.color} ${startPercent}% ${endPercent}%`;
		});
		return `linear-gradient(to right, ${segments.join(", ")})`;
	};

	// Load saved data from localStorage
	useEffect(() => {
		const saved = getGameData();
		if (saved.basics) {
			if (saved.basics.name) {
				setValue("name", saved.basics.name);
			}
			if (saved.basics.priceLimit) {
				setValue("priceLimit", saved.basics.priceLimit);
			}
			if (saved.basics.deadline) {
				setValue("deadline", new Date(saved.basics.deadline));
			}
			setValue("categories", saved.basics.categories || []);
		}
	}, [setValue]);

	// Auto-advancement logic for each question
	useEffect(() => {
		// Step 0: Game Name - advance when valid
		if (currentStep === 0 && name && name.length >= 1) {
			const timer = setTimeout(() => {
				setCompletedSteps((prev) => new Set(prev).add(0));
				setCurrentStep(1);
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [name, currentStep]);

	useEffect(() => {
		// Step 1: Price Limit - advance when slider is moved (and not default)
		if (currentStep === 1 && priceLimit !== 50) {
			const timer = setTimeout(() => {
				setCompletedSteps((prev) => new Set(prev).add(1));
				setCurrentStep(2);
			}, 800);
			return () => clearTimeout(timer);
		}
	}, [priceLimit, currentStep]);

	useEffect(() => {
		// Step 2: Deadline - advance when date is selected
		if (currentStep === 2 && deadline) {
			const timer = setTimeout(() => {
				setCompletedSteps((prev) => new Set(prev).add(2));
				setCurrentStep(3);
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [deadline, currentStep]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowUp" && currentStep > 0) {
				e.preventDefault();
				setCurrentStep((prev) => prev - 1);
			} else if (e.key === "ArrowDown" && currentStep < TOTAL_STEPS - 1) {
				e.preventDefault();
				setCurrentStep((prev) => prev + 1);
			} else if (e.key === "Enter" && currentStep === 3) {
				// Categories step - manual advance
				e.preventDefault();
				setCompletedSteps((prev) => new Set(prev).add(3));
				setCurrentStep(4);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [currentStep]);

	const onSubmit = (data: GameBasicsFormData) => {
		saveGameData({
			basics: {
				...data,
				deadline: data.deadline.toISOString(),
			},
		});
		router.push("/create/invites");
	};

	return (
		<div className="max-w-md mx-auto">
			<h1 className="text-3xl font-bold mb-2 text-black dark:text-white">
				Let's Get This Party Started! 🎉
			</h1>
			<p className="text-gray-600 dark:text-gray-300 mb-8">
				Set up the details for your gift exchange.
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-name`}>Game Name</FieldLabel>
					<FieldContent>
						<Input
							id={`${idPrefix}-name`}
							type="text"
							placeholder="e.g., JumboCode Secret Santa"
							{...register("name")}
							aria-invalid={errors.name ? "true" : "false"}
						/>
						<FieldError errors={errors.name ? [errors.name] : []} />
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-priceLimit`}>
						What's the budget per person?
					</FieldLabel>
					<FieldContent>
						<div className="space-y-3">
							<div className="flex items-center gap-4">
								<div className="flex-1 relative">
									<input
										id={`${idPrefix}-priceLimit`}
										type="range"
										min="1"
										max="100"
										step="1"
										{...register("priceLimit", { valueAsNumber: true })}
										className="w-full h-2 rounded-lg appearance-none cursor-pointer price-slider"
										style={
											{
												background: getSliderBackground(),
												"--slider-thumb-color": getSegmentColor(priceLimit),
											} as React.CSSProperties & {
												"--slider-thumb-color": string;
											}
										}
									/>
								</div>
								<span className="text-lg font-semibold text-black dark:text-white min-w-12 text-right">
									${priceLimit}
								</span>
							</div>
						</div>
						<FieldError errors={errors.priceLimit ? [errors.priceLimit] : []} />
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-deadline`}>
						When is the Big Reveal?
					</FieldLabel>
					<FieldContent>
						<Controller
							name="deadline"
							control={control}
							render={({ field }) => (
								<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
									<PopoverTrigger asChild>
										<Button
											id={`${idPrefix}-deadline`}
											variant="outline"
											className={cn(
												"w-full justify-between font-normal border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-black dark:text-white",
												!field.value && "text-gray-400 dark:text-zinc-500",
												errors.deadline && "border-red-500 dark:border-red-500",
											)}
											aria-invalid={errors.deadline ? "true" : "false"}
										>
											{field.value
												? field.value.toLocaleDateString("en-US", {
														year: "numeric",
														month: "2-digit",
														day: "2-digit",
													})
												: "Select date"}
											<ChevronDownIcon className="size-4 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={field.value}
											onSelect={(date) => {
												if (date) {
													field.onChange(date);
													setCalendarOpen(false);
												}
											}}
											disabled={(date) => date < new Date()}
											captionLayout="dropdown"
											fromYear={new Date().getFullYear()}
											toYear={new Date().getFullYear() + 10}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							)}
						/>
						<FieldError errors={errors.deadline ? [errors.deadline] : []} />
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-categories`}>
						Gift Categories (Optional)
					</FieldLabel>
					<FieldContent>
						<Input
							id={`${idPrefix}-categories`}
							type="text"
							placeholder="e.g., Books, Tech, Home Decor (comma-separated)"
							onChange={(e) => {
								const value = e.target.value;
								const categories = value
									? value.split(",").map((cat) => cat.trim())
									: [];
								setValue("categories", categories);
							}}
						/>
						<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
							Separate categories with commas
						</p>
					</FieldContent>
				</Field>

				<div className="flex justify-end gap-4 pt-4">
					<Button
						type="button"
						variant="ghost"
						onClick={() => router.push("/")}
					>
						Cancel
					</Button>
					<Button type="submit">Next</Button>
				</div>
			</form>
		</div>
	);
}
