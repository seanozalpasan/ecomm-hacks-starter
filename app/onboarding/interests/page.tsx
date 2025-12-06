"use client";

import { Gift, Heart, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Christmas candy-cane color scheme - gradient properly contained
const PILL_STYLES = {
	unselected:
		"bg-white border-2 border-red-200 text-gray-700 hover:border-red-400 hover:bg-red-50 transition-all duration-200",
	selected:
		"bg-red-500 text-white border-2 border-red-700 shadow-lg",
};

// Interest categories with specific trending examples
const INTEREST_CATEGORIES = [
	{
		title: "Movies & TV",
		icon: Film,
		interests: [
			"Star Wars",
			"Marvel",
			"The Office",
			"Stranger Things",
			"Game of Thrones",
			"Breaking Bad",
			"Harry Potter",
			"Lord of the Rings",
			"Friends",
			"The Crown",
		],
	},
	{
		title: "Gaming",
		icon: Gamepad2,
		interests: [
			"Fortnite",
			"Minecraft",
			"Call of Duty",
			"League of Legends",
			"Valorant",
			"Roblox",
			"The Last of Us",
			"Elden Ring",
			"Zelda",
			"FIFA",
		],
	},
	{
		title: "Music Artists",
		icon: Music,
		interests: [
			"Taylor Swift",
			"Sabrina Carpenter",
			"Future",
			"Drake",
			"The Weeknd",
			"Billie Eilish",
			"Bad Bunny",
			"SZA",
			"Olivia Rodrigo",
			"Travis Scott",
		],
	},
	{
		title: "Sports",
		icon: Trophy,
		interests: [
			"Soccer",
			"Football",
			"Basketball",
			"Baseball",
			"Tennis",
			"Golf",
			"Formula 1",
			"UFC",
			"Hockey",
			"Volleyball",
		],
	},
	{
		title: "Hobbies",
		icon: Palette,
		interests: [
			"Photography",
			"Cooking",
			"Baking",
			"Gardening",
			"Painting",
			"Reading",
			"Yoga",
			"Hiking",
			"Crafting",
			"Knitting",
		],
	},
	{
		title: "Fashion & Style",
		icon: ShoppingBag,
		interests: [
			"Nike",
			"Adidas",
			"Vintage Clothing",
			"Sneakers",
			"Jewelry",
			"Streetwear",
			"Luxury Brands",
			"Thrifting",
			"Watches",
			"Accessories",
		],
	},
	{
		title: "Food & Drink",
		icon: Coffee,
		interests: [
			"Coffee",
			"Wine",
			"Craft Beer",
			"Sushi",
			"Pizza",
			"Chocolate",
			"Boba Tea",
			"Italian Food",
			"Mexican Food",
			"Vegan Food",
		],
	},
	{
		title: "Tech & Gadgets",
		icon: Laptop,
		interests: [
			"iPhone",
			"PlayStation",
			"Nintendo Switch",
			"MacBook",
			"AirPods",
			"Smart Home",
			"Drones",
			"VR Headsets",
			"Cameras",
			"Mechanical Keyboards",
		],
	},
];

// Typing animation examples with more varied content
const TYPING_EXAMPLES = [
	{ text: "Favorite Color?", isQuestion: true },
	{ text: "Emerald Green", isQuestion: false },
	{ text: "Dream Vacation Spot?", isQuestion: true },
	{ text: "Japanese Cherry Blossoms", isQuestion: false },
	{ text: "Go-to Comfort Food?", isQuestion: true },
	{ text: "Grandma's Chocolate Chip Cookies", isQuestion: false },
	{ text: "Favorite Book Genre?", isQuestion: true },
	{ text: "Mystery Thrillers", isQuestion: false },
	{ text: "Ideal Weekend Activity?", isQuestion: true },
	{ text: "Hiking Mountain Trails", isQuestion: false },
];

export default function InterestsPage() {
	const router = useRouter();
	const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
	const [customInterests, setCustomInterests] = useState<string[]>([]);
	const [customInput, setCustomInput] = useState("");
	const [placeholderText, setPlaceholderText] = useState("");
	const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);

	// Smooth typing and deleting animation
	useEffect(() => {
		let timeout: NodeJS.Timeout;

		const runTypingAnimation = () => {
			const example = TYPING_EXAMPLES[currentExampleIndex];
			const fullText = example.text;
			let charIndex = 0;
			let currentText = "";

			const typeChar = () => {
				if (charIndex < fullText.length) {
					currentText += fullText[charIndex];
					setPlaceholderText(currentText);
					charIndex++;
					timeout = setTimeout(typeChar, 60); // Faster typing
				} else {
					// Wait a bit, then start deleting
					timeout = setTimeout(() => {
						setIsDeleting(true);
						deleteChar();
					}, 1500);
				}
			};

			const deleteChar = () => {
				if (currentText.length > 0) {
					currentText = currentText.slice(0, -1);
					setPlaceholderText(currentText);
					timeout = setTimeout(deleteChar, 40); // Faster deleting
				} else {
					// Move to next example and start typing
					setIsDeleting(false);
					setCurrentExampleIndex((prev) => (prev + 1) % TYPING_EXAMPLES.length);
				}
			};

			typeChar();
		};

		runTypingAnimation();

		return () => clearTimeout(timeout);
	}, [currentExampleIndex]);

	const toggleInterest = (interest: string) => {
		if (selectedInterests.includes(interest)) {
			setSelectedInterests(selectedInterests.filter((i) => i !== interest));
		} else {
			if (selectedInterests.length < 5) {
				setSelectedInterests([...selectedInterests, interest]);
			}
		}
	};

	const addCustomInterest = () => {
		const trimmedInput = customInput.trim();

		// Check for duplicates in both selected interests and custom interests
		const isDuplicate =
			selectedInterests.some(
				(interest) => interest.toLowerCase() === trimmedInput.toLowerCase(),
			) ||
			customInterests.some(
				(interest) => interest.toLowerCase() === trimmedInput.toLowerCase(),
			);

		if (isDuplicate) {
			alert("This interest has already been added!");
			return;
		}

		if (trimmedInput && customInterests.length < 3) {
			setCustomInterests([...customInterests, trimmedInput]);
			setCustomInput("");
		}
	};

	const removeCustomInterest = (interest: string) => {
		setCustomInterests(customInterests.filter((i) => i !== interest));
	};

	const handleContinue = () => {
		const totalSelections = [...selectedInterests, ...customInterests];
		if (totalSelections.length < 3) {
			alert("Please select at least 3 interests!");
			return;
		}

		// Save to localStorage
		const existingData = JSON.parse(localStorage.getItem("onboarding") || "{}");
		localStorage.setItem(
			"onboarding",
			JSON.stringify({
				...existingData,
				interests: totalSelections,
			}),
		);

		router.push("/onboarding/basics");
	};

	const totalSelections = selectedInterests.length + customInterests.length;

	return (
		<div className="min-h-screen bg-white dark:from-red-950 dark:via-zinc-900 dark:to-green-950 py-8">
			<div className="w-full">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-8 px-4"
				>
					<h1 className="text-4xl font-bold mb-4 text-red-500 flex items-center justify-center gap-3">
						<Gift className="w-10 h-10" />
						Tell us about your interests!
						<Heart className="w-10 h-10" />
					</h1>
					<p className="text-gray-600 dark:text-gray-300">
						Select at least 3 interests to help us personalize your Secret Santa
						experience
					</p>
					<div className="mt-4 flex justify-center gap-2 text-sm">
						<span
							className={`px-3 py-1 rounded-full ${totalSelections >= 3 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
						>
							{totalSelections} selected
						</span>
						<span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600">
							Min: 3 | Max: 8
						</span>
					</div>
				</motion.div>

				{/* Custom Input Section - Moved to Top */}
				<div className="px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="max-w-3xl mx-auto bg-white dark:bg-zinc-800 rounded-2xl p-6 mb-8"
					>
						<h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
							Don't see what you're looking for? Add your own!
						</h3>
						<div className="flex gap-3">
							<div className="flex-1 relative">
								<input
									type="text"
									value={customInput}
									onChange={(e) => setCustomInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											addCustomInterest();
										}
									}}
									placeholder={placeholderText}
									disabled={customInterests.length >= 3}
									className="w-full px-6 py-4 rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
								/>
							</div>
							<Button
								onClick={addCustomInterest}
								disabled={!customInput.trim() || customInterests.length >= 3}
								className="px-8 py-4 h-auto bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg hover:shadow-xl"
							>
								Add
							</Button>
						</div>
						{customInterests.length >= 3 && (
							<p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
								Maximum 3 custom interests reached
							</p>
						)}
					</motion.div>
				</div>

				{/* Custom Interests Pills - Below Input */}
				{customInterests.length > 0 && (
					<div className="max-w-3xl mx-auto mb-8 px-4">
						<h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
							<Sparkles className="w-6 h-6" />
							Your Custom Interests
						</h2>
						<div className="flex flex-wrap gap-3">
							{customInterests.map((interest) => (
								<div
									key={interest}
									className="px-6 py-3 rounded-full font-medium bg-amber-500 text-white border-2 border-amber-600 shadow-lg flex items-center gap-2"
								>
									<span>{interest}</span>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => removeCustomInterest(interest)}
										className="hover:bg-white/20 rounded-full size-6"
									>
										<X size={16} />
									</Button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Interest Categories - Full Width */}
				<div className="space-y-8 mb-12 px-6">
					{INTEREST_CATEGORIES.map((category, categoryIndex) => {
						return (
							<motion.div
								key={category.title}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: categoryIndex * 0.05 }}
							>
								<h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
									{category.title}
								</h2>
								<div className="flex flex-wrap gap-3">
									{category.interests.map((interest) => {
										const isSelected = selectedInterests.includes(interest);
										return (
											<Button
												key={interest}
												variant="outline"
												onClick={() => toggleInterest(interest)}
												disabled={!isSelected && totalSelections >= 8}
												className={`px-6 py-3 h-auto rounded-full font-medium ${
													isSelected
														? PILL_STYLES.selected
														: PILL_STYLES.unselected
												}`}
											>
												{interest}
											</Button>
										);
									})}
								</div>
							</motion.div>
						);
					})}
				</div>

				{/* Continue Button */}
				<div className="flex justify-center pb-8 px-4">
					<Button
						onClick={handleContinue}
						disabled={totalSelections < 3}
						size="lg"
						className="px-12 py-4 h-auto bg-red-500 text-white text-lg font-bold rounded-full hover:bg-red-600 hover:shadow-2xl"
					>
						Continue to Next Step
					</Button>
				</div>

				{totalSelections < 3 && (
					<p className="text-center text-sm text-red-600 dark:text-red-400 mt-4 px-4">
						Please select at least 3 interests to continue
					</p>
				)}
			</div>
		</div>
	);
}
