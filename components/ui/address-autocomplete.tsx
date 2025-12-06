"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MapboxFeature {
	id: string;
	type: string;
	place_type: string[];
	relevance: number;
	properties: {
		accuracy?: string;
	};
	text: string;
	place_name: string;
	center: [number, number];
	context?: Array<{
		id: string;
		text: string;
		short_code?: string;
	}>;
}

interface MapboxResponse {
	type: string;
	query: string[];
	features: MapboxFeature[];
	attribution: string;
}

interface AddressAutocompleteProps
	extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
	value: string;
	onChange: (value: string) => void;
	onInputChange?: (value: string) => void;
}

export function AddressAutocomplete({
	value,
	onChange,
	onInputChange,
	className,
	id,
	...props
}: AddressAutocompleteProps) {
	const [suggestions, setSuggestions] = React.useState<MapboxFeature[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [isOpen, setIsOpen] = React.useState(false);
	const [selectedIndex, setSelectedIndex] = React.useState(-1);
	const [error, setError] = React.useState<string | null>(null);
	const inputRef = React.useRef<HTMLInputElement>(null);
	const listRef = React.useRef<HTMLDivElement>(null);
	const containerRef = React.useRef<HTMLDivElement>(null);
	const abortControllerRef = React.useRef<AbortController | null>(null);

	const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
	const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	// Fetch suggestions from Mapbox API
	const fetchSuggestions = React.useCallback(
		async (query: string) => {
			if (!mapboxToken) {
				setError("Mapbox API token is not configured");
				return;
			}

			if (!query.trim() || query.length < 2) {
				setSuggestions([]);
				setIsOpen(false);
				return;
			}

			// Cancel previous request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			abortControllerRef.current = new AbortController();
			setIsLoading(true);
			setError(null);

			try {
				const encodedQuery = encodeURIComponent(query);
				const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&limit=5&types=address,place,postcode,locality,neighborhood`;

				const response = await fetch(url, {
					signal: abortControllerRef.current.signal,
				});

				if (!response.ok) {
					throw new Error("Failed to fetch suggestions");
				}

				const data: MapboxResponse = await response.json();
				setSuggestions(data.features);
				setIsOpen(data.features.length > 0);
				setSelectedIndex(-1);
			} catch (err) {
				if (err instanceof Error && err.name !== "AbortError") {
					setError("Unable to fetch address suggestions");
					setSuggestions([]);
					setIsOpen(false);
				}
			} finally {
				setIsLoading(false);
			}
		},
		[mapboxToken],
	);

	// Handle input change with debouncing
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		onChange(newValue);
		onInputChange?.(newValue);

		// Clear existing timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Set new timeout for debounced API call
		debounceTimeoutRef.current = setTimeout(() => {
			fetchSuggestions(newValue);
		}, 300);
	};

	// Handle suggestion selection
	const handleSelect = (feature: MapboxFeature) => {
		onChange(feature.place_name);
		setSuggestions([]);
		setIsOpen(false);
		setSelectedIndex(-1);
		inputRef.current?.focus();
	};

	// Handle keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!isOpen || suggestions.length === 0) {
			if (e.key === "Escape") {
				setIsOpen(false);
				setSelectedIndex(-1);
			}
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < suggestions.length - 1 ? prev + 1 : prev,
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
					handleSelect(suggestions[selectedIndex]);
				}
				break;
			case "Escape":
				e.preventDefault();
				setIsOpen(false);
				setSelectedIndex(-1);
				break;
		}
	};

	// Cleanup debounce timeout on unmount
	React.useEffect(() => {
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, []);

	// Close dropdown when clicking outside
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setSelectedIndex(-1);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Scroll selected item into view
	React.useEffect(() => {
		if (
			selectedIndex >= 0 &&
			listRef.current &&
			isOpen &&
			suggestions.length > 0
		) {
			const selectedElement = listRef.current.children[
				selectedIndex
			] as HTMLElement;
			if (selectedElement) {
				selectedElement.scrollIntoView({
					block: "nearest",
					behavior: "smooth",
				});
			}
		}
	}, [selectedIndex, isOpen, suggestions.length]);

	return (
		<div ref={containerRef} className="relative w-full">
			<Input
				ref={inputRef}
				id={id}
				value={value}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				onFocus={() => {
					if (suggestions.length > 0) {
						setIsOpen(true);
					}
				}}
				aria-autocomplete="list"
				aria-expanded={isOpen}
				aria-controls={isOpen ? `${id}-suggestions` : undefined}
				aria-activedescendant={
					selectedIndex >= 0 ? `${id}-suggestion-${selectedIndex}` : undefined
				}
				className={className}
				{...props}
			/>
			{isOpen && (
				<div
					ref={listRef}
					id={`${id}-suggestions`}
					role="listbox"
					className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg"
				>
					{suggestions.map((feature, index) => (
						<div
							key={feature.id}
							id={`${id}-suggestion-${index}`}
							role="option"
							tabIndex={selectedIndex === index ? 0 : -1}
							aria-selected={selectedIndex === index}
							onClick={() => handleSelect(feature)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleSelect(feature);
								}
							}}
							onMouseEnter={() => setSelectedIndex(index)}
							className={cn(
								"px-3 py-2 cursor-pointer text-sm transition-colors",
								"hover:bg-zinc-100 dark:hover:bg-zinc-900",
								"focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-900",
								selectedIndex === index && "bg-zinc-100 dark:bg-zinc-900",
							)}
						>
							<div className="font-medium text-zinc-900 dark:text-zinc-50">
								{feature.text}
							</div>
							{feature.place_name !== feature.text && (
								<div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
									{feature.place_name}
								</div>
							)}
						</div>
					))}
				</div>
			)}
			{isLoading && (
				<div
					className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
					aria-live="polite"
					aria-atomic="true"
				>
					<span className="sr-only">Loading suggestions</span>
					<svg
						className="animate-spin h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				</div>
			)}
			{error && (
				<div
					className="mt-1 text-xs text-red-600 dark:text-red-400"
					role="alert"
				>
					{error}
				</div>
			)}
		</div>
	);
}
