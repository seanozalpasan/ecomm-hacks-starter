// 'use client'

// import { useState } from 'react'

// // Mock data - replace with real data later
// const CURRENT_GAMES = [
//   { id: 1, name: 'Game Night - Dec 6', players: 4, status: 'In Progress' },
//   { id: 2, name: 'Weekend Tournament', players: 8, status: 'Active' },
//   { id: 3, name: 'Family Game', players: 3, status: 'In Progress' },
// ]

// const PAST_GAMES = [
//   { id: 4, name: 'Championship Final', players: 6, status: 'Completed', date: 'Dec 1, 2024' },
//   { id: 5, name: 'Practice Match', players: 4, status: 'Completed', date: 'Nov 28, 2024' },
//   { id: 6, name: 'Team Building', players: 10, status: 'Completed', date: 'Nov 25, 2024' },
// ]

// export function GameDropdowns() {
//   const [showCurrentGames, setShowCurrentGames] = useState(false)
//   const [showPastGames, setShowPastGames] = useState(false)
//   const [showCreateGame, setShowCreateGame] = useState(false)
//   const [gameName, setGameName] = useState('')
//   const [playerCount, setPlayerCount] = useState('')

//   const handleCreateGame = () => {
//     // Backend logic will go here
//     console.log('Creating game:', { gameName, playerCount })
//     setGameName('')
//     setPlayerCount('')
//     setShowCreateGame(false)
//     alert('Game created! (Frontend only - no backend yet)')
//   }

//   return (
//     <div className="space-y-4">
//       {/* Current Games Dropdown */}
//       <div className="bg-white rounded-lg shadow">
//         <button
//           onClick={() => setShowCurrentGames(!showCurrentGames)}
//           className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
//         >
//           <div className="flex items-center gap-3">
//             <span className="text-xl">🎮</span>
//             <span className="font-semibold text-lg">Current Games</span>
//             <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
//               {CURRENT_GAMES.length} Active
//             </span>
//           </div>
//           <svg
//             className={`w-5 h-5 transition-transform ${showCurrentGames ? 'rotate-180' : ''}`}
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//           </svg>
//         </button>

//         {showCurrentGames && (
//           <div className="px-6 pb-4 space-y-3">
//             {CURRENT_GAMES.map((game) => (
//               <div
//                 key={game.id}
//                 className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h4 className="font-semibold text-gray-900">{game.name}</h4>
//                     <p className="text-sm text-gray-600 mt-1">{game.players} players</p>
//                   </div>
//                   <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
//                     {game.status}
//                   </span>
//                 </div>
//                 <button className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700">
//                   Join Game →
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Past Games Dropdown */}
//       <div className="bg-white rounded-lg shadow">
//         <button
//           onClick={() => setShowPastGames(!showPastGames)}
//           className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
//         >
//           <div className="flex items-center gap-3">
//             <span className="text-xl">📜</span>
//             <span className="font-semibold text-lg">Past Games</span>
//             <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
//               {PAST_GAMES.length} Completed
//             </span>
//           </div>
//           <svg
//             className={`w-5 h-5 transition-transform ${showPastGames ? 'rotate-180' : ''}`}
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//           </svg>
//         </button>

//         {showPastGames && (
//           <div className="px-6 pb-4 space-y-3">
//             {PAST_GAMES.map((game) => (
//               <div
//                 key={game.id}
//                 className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition cursor-pointer"
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h4 className="font-semibold text-gray-900">{game.name}</h4>
//                     <p className="text-sm text-gray-600 mt-1">
//                       {game.players} players • {game.date}
//                     </p>
//                   </div>
//                   <span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
//                     {game.status}
//                   </span>
//                 </div>
//                 <button className="mt-3 text-gray-600 text-sm font-medium hover:text-gray-700">
//                   View Results →
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Create New Game */}
//       <div className="bg-white rounded-lg shadow">
//         <button
//           onClick={() => setShowCreateGame(!showCreateGame)}
//           className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
//         >
//           <div className="flex items-center gap-3">
//             <span className="text-xl">➕</span>
//             <span className="font-semibold text-lg text-green-600">Create New Game</span>
//           </div>
//           <svg
//             className={`w-5 h-5 transition-transform ${showCreateGame ? 'rotate-180' : ''}`}
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//           </svg>
//         </button>

//         {showCreateGame && (
//           <div className="px-6 pb-6">
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Game Name
//                 </label>
//                 <input
//                   type="text"
//                   value={gameName}
//                   onChange={(e) => setGameName(e.target.value)}
//                   placeholder="Enter game name..."
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Number of Players
//                 </label>
//                 <input
//                   type="number"
//                   value={playerCount}
//                   onChange={(e) => setPlayerCount(e.target.value)}
//                   placeholder="2"
//                   min="2"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                 />
//               </div>

//               <button
//                 onClick={handleCreateGame}
//                 className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
//               >
//                 Create Game
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

"use client";

import { useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useState } from "react";

// --- Interfaces for Game Data ---

interface CurrentGame {
	id: string;
	name: string;
	players: number;
	status: "In Progress" | "Active"; // Use a union type for specific statuses
}

interface PastGame {
	id: number;
	name: string;
	players: number;
	status: "Completed";
	date: string; // Could also use Date type if parsing the date string
}

// --- Mock Data ---

const PAST_GAMES: PastGame[] = [
	{
		id: 4,
		name: "Championship Final",
		players: 6,
		status: "Completed",
		date: "Dec 1, 2024",
	},
	{
		id: 5,
		name: "Practice Match",
		players: 4,
		status: "Completed",
		date: "Nov 28, 2024",
	},
	{
		id: 6,
		name: "Team Building",
		players: 10,
		status: "Completed",
		date: "Nov 25, 2024",
	},
];

// --- Component ---

export function GameDropdowns() {
	// Boolean states are correctly inferred as boolean by TypeScript
	const [showCurrentGames, setShowCurrentGames] = useState(false);
	const [showPastGames, setShowPastGames] = useState(false);
	const [showCreateGame, setShowCreateGame] = useState(false);

	// String states are correctly inferred as string by TypeScript
	const [gameName, setGameName] = useState("");
	const [playerCount, setPlayerCount] = useState("");

	// Fetch current games using Tanstack Query
	const {
		data: currentGames,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["games", "current"],
		queryFn: async () => {
			const res = await fetch("/api/games");
			if (!res.ok) {
				throw new Error("Failed to fetch games");
			}
			const json = await res.json();
			if (!json.success) {
				throw new Error(json.error || "Failed to fetch games");
			}
			return json.data as CurrentGame[];
		},
	});

	const handleCreateGame = () => {
		// Backend logic will go here
		console.log("Creating game:", { gameName, playerCount });
		setGameName("");
		setPlayerCount("");
		setShowCreateGame(false);
		alert("Game created! (Frontend only - no backend yet)");
	};

	// Type the change event for the text input
	const handleGameNameChange = (e: ChangeEvent<HTMLInputElement>) => {
		setGameName(e.target.value);
	};

	// Type the change event for the number input
	const handlePlayerCountChange = (e: ChangeEvent<HTMLInputElement>) => {
		// Note: The value from an input is always a string, even for type="number"
		setPlayerCount(e.target.value);
	};

	return (
		<div className="space-y-4">
			{/* Current Games Dropdown */}
			<div className="bg-white rounded-lg shadow">
				<button
					onClick={() => setShowCurrentGames(!showCurrentGames)}
					className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
				>
					<div className="flex items-center gap-3">
						<span className="text-xl">🎮</span>
						<span className="font-semibold text-lg">Current Games</span>
						<span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
							{isLoading ? "..." : (currentGames?.length ?? 0)} Active
						</span>
					</div>
					<svg
						className={`w-5 h-5 transition-transform ${showCurrentGames ? "rotate-180" : ""}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{showCurrentGames && (
					<div className="px-6 pb-4 space-y-3">
						{isLoading && (
							<div className="text-center py-4 text-gray-500">
								Loading games...
							</div>
						)}
						{error && (
							<div className="text-center py-4 text-red-600">
								Error loading games. Please try again.
							</div>
						)}
						{!isLoading &&
							!error &&
							currentGames &&
							currentGames.length === 0 && (
								<div className="text-center py-4 text-gray-500">
									No active games
								</div>
							)}
						{!isLoading &&
							!error &&
							currentGames &&
							currentGames.length > 0 && (
								<>
									{currentGames.map((game: CurrentGame) => (
										<div
											key={game.id}
											className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
										>
											<div className="flex justify-between items-start">
												<div>
													<h4 className="font-semibold text-gray-900">
														{game.name}
													</h4>
													<p className="text-sm text-gray-600 mt-1">
														{game.players} players
													</p>
												</div>
												<span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
													{game.status}
												</span>
											</div>
											<button className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700">
												Join Game →
											</button>
										</div>
									))}
								</>
							)}
					</div>
				)}
			</div>

			{/* Past Games Dropdown */}
			<div className="bg-white rounded-lg shadow">
				<button
					onClick={() => setShowPastGames(!showPastGames)}
					className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
				>
					<div className="flex items-center gap-3">
						<span className="text-xl">📜</span>
						<span className="font-semibold text-lg">Past Games</span>
						<span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
							{PAST_GAMES.length} Completed
						</span>
					</div>
					<svg
						className={`w-5 h-5 transition-transform ${showPastGames ? "rotate-180" : ""}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{showPastGames && (
					<div className="px-6 pb-4 space-y-3">
						{PAST_GAMES.map((game: PastGame) => (
							<div
								key={game.id}
								className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition cursor-pointer"
							>
								<div className="flex justify-between items-start">
									<div>
										<h4 className="font-semibold text-gray-900">{game.name}</h4>
										<p className="text-sm text-gray-600 mt-1">
											{game.players} players • {game.date}
										</p>
									</div>
									<span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
										{game.status}
									</span>
								</div>
								<button className="mt-3 text-gray-600 text-sm font-medium hover:text-gray-700">
									View Results →
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Create New Game */}
			<div className="bg-white rounded-lg shadow">
				<button
					onClick={() => setShowCreateGame(!showCreateGame)}
					className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
				>
					<div className="flex items-center gap-3">
						<span className="text-xl">➕</span>
						<span className="font-semibold text-lg text-green-600">
							Create New Game
						</span>
					</div>
					<svg
						className={`w-5 h-5 transition-transform ${showCreateGame ? "rotate-180" : ""}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{showCreateGame && (
					<div className="px-6 pb-6">
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Game Name
								</label>
								<input
									type="text"
									value={gameName}
									onChange={handleGameNameChange}
									placeholder="Enter game name..."
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Number of Players
								</label>
								<input
									type="number"
									value={playerCount}
									onChange={handlePlayerCountChange}
									placeholder="2"
									min="2"
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
								/>
							</div>

							<button
								onClick={handleCreateGame}
								className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
							>
								Create Game
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
