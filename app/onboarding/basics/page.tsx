"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
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
import { useSubmitBasics } from "@/lib/hooks/useOnboarding";
import { getOnboardingData } from "@/lib/utils/storage";

const basicsFormSchema = z.object({
	birthday: z.date().optional(),
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	location: z
		.string()
		.min(1, "Location is required")
		.max(200, "Location is too long"),
});

type BasicsFormData = z.infer<typeof basicsFormSchema>;

export default function BasicsPage() {
	const router = useRouter();
	const { mutate: submitBasics, isPending } = useSubmitBasics();
	const idPrefix = useId();
	const [isFetchingLocation, setIsFetchingLocation] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [calendarOpen, setCalendarOpen] = useState(false);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		setValue,
	} = useForm<BasicsFormData>({
		resolver: zodResolver(basicsFormSchema),
		defaultValues: {
			birthday: undefined,
			name: "",
			location: "",
		},
	});

	// Load saved data from localStorage
	useEffect(() => {
		const saved = getOnboardingData();
		if (saved.basics) {
			if (saved.basics.birthday) {
				setValue("birthday", new Date(saved.basics.birthday));
			}
			setValue("name", saved.basics.name);
			setValue("location", saved.basics.location);
		}
	}, [setValue]);

	const onSubmit = (data: BasicsFormData) => {
		if (!data.birthday) {
			return;
		}
		submitBasics(
			{
				birthday: data.birthday,
				name: data.name,
				location: data.location,
			},
			{
				onSuccess: () => {
					router.push("/onboarding/interests");
				},
			},
		);
	};

	const handleUseCurrentLocation = async () => {
		setLocationError(null);
		setIsFetchingLocation(true);

		try {
			const position = await new Promise<GeolocationPosition>(
				(resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: true,
						timeout: 10_000,
					});
				},
			);

			const { latitude, longitude } = position.coords;
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
			);

			if (!response.ok) {
				throw new Error("Failed to look up location");
			}

			const data = await response.json();
			const formattedLocation =
				data?.display_name ?? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;

			setValue("location", formattedLocation);
		} catch (error) {
			setLocationError(
				error instanceof Error
					? error.message
					: "Unable to fetch your location. Please enter it manually.",
			);
		} finally {
			setIsFetchingLocation(false);
		}
	};

	return (
		<div className="max-w-md mx-auto">
			<h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
				Tell us about yourself
			</h1>
			<p className="text-zinc-600 dark:text-zinc-400 mb-8">
				We need some basic information to get started.
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<Field>
					<FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
					<FieldContent>
						<Input
							id={`${idPrefix}-name`}
							type="text"
							{...register("name")}
							placeholder="Enter your name"
							aria-invalid={errors.name ? "true" : "false"}
						/>
						<FieldError errors={errors.name ? [errors.name] : []} />
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-birthday`}>Birthday</FieldLabel>
					<FieldContent>
						<Controller
							name="birthday"
							control={control}
							render={({ field }) => (
								<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
									<PopoverTrigger asChild>
										<Button
											id={`${idPrefix}-birthday`}
											variant="outline"
											className="w-full justify-between font-normal"
											aria-invalid={errors.birthday ? "true" : "false"}
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
											disabled={(date) => date > new Date()}
											captionLayout="dropdown"
											fromYear={1900}
											toYear={new Date().getFullYear()}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							)}
						/>
						<FieldError errors={errors.birthday ? [errors.birthday] : []} />
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel htmlFor={`${idPrefix}-location`}>Location</FieldLabel>
					<FieldContent>
						<div className="flex flex-col gap-2">
							<Controller
								name="location"
								control={control}
								render={({ field }) => (
									<AddressAutocomplete
										id={`${idPrefix}-location`}
										value={field.value}
										onChange={field.onChange}
										placeholder="Enter your location…"
										aria-invalid={errors.location ? "true" : "false"}
									/>
								)}
							/>
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={handleUseCurrentLocation}
									disabled={isFetchingLocation}
									className="text-sm text-zinc-700 dark:text-zinc-300 underline underline-offset-4 disabled:opacity-60 disabled:cursor-not-allowed"
								>
									{isFetchingLocation
										? "Fetching location..."
										: "Use current location"}
								</button>
								{locationError && (
									<span className="text-xs text-red-600 dark:text-red-400">
										{locationError}
									</span>
								)}
							</div>
						</div>
						<FieldError errors={errors.location ? [errors.location] : []} />
					</FieldContent>
				</Field>

				<div className="flex justify-end gap-4 pt-4">
					<button
						type="button"
						onClick={() => router.back()}
						className="px-6 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
					>
						Back
					</button>
					<button
						type="submit"
						disabled={isPending}
						className="px-6 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isPending ? "Saving..." : "Next"}
					</button>
				</div>
			</form>
		</div>
	);
}
