// app/dashboard/games/[gameId]/page.tsx
'use client' 

import { useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import React from 'react' // Explicitly import React, though often optional

// Define the type for the props received by a dynamic route segment
interface GamePageProps {
  params: {
    gameId: string // gameId from the URL is always a string
  }
}

// --- Mock Data & Constants (Keys must be strings to match the route parameter) ---
const GAME_MOCK_DATA: { [key: string]: { name: string; players: string[]; ownerId: string } } = {
    '1': { name: 'Game Night - Dec 6', players: ['Alice', 'Bob', 'Charlie', 'David'], ownerId: 'user_123' },
    '2': { name: 'Weekend Tournament', players: ['Eve', 'Frank', 'Grace', 'Heidi', 'Isaac', 'Jane', 'Kevin', 'Liam'], ownerId: 'user_456' },
    '3': { name: 'Family Game', players: ['Mom', 'Dad', 'Daughter'], ownerId: 'user_123' },
};

const MOCK_CURRENT_USER_ID = 'user_123'; 

// --- Component ---

export default function IndividualGamePage({ params }: GamePageProps) {
  const router = useRouter();
  const { isLoaded } = useUser();
  
  // FIX: Check if params or gameId are null/undefined during hydration
  const gameId = params?.gameId; 

  // CRITICAL: Only attempt to look up data if Clerk is loaded and gameId exists.
  const gameData = isLoaded && gameId ? GAME_MOCK_DATA[gameId] : undefined; 

  // State for editable fields (Initialization remains the same)
  const [priceLimit, setPriceLimit] = useState('25');
  const [deadline, setDeadline] = useState('2025-12-20');
  const [category, setCategory] = useState('Tech');
  const [status, setStatus] = useState('Pending'); // Initial mock status
  const [inviteEmail, setInviteEmail] = useState('');

  // --- Utility Functions ---
  const handleInvite = () => {
    if (inviteEmail) {
      console.log(`Inviting: ${inviteEmail} to Game ${gameId}`);
      alert(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
    }
  };

  const handleMatch = () => {
    console.log(`Executing match for Game ${gameId}`);
    alert('Matching process initiated! (Backend required)');
    setStatus('Matched'); 
  };
  
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(e.target.value);
    };


  // --- LOADING / NOT FOUND CHECK ---
  
  // 1. Loading State: Wait for Clerk and the URL params to resolve.
  // This should catch the initial render where isLoaded is false or gameId is resolving.
  if (!isLoaded || !gameId) {
    return <div className="min-h-screen bg-gray-100 p-8 text-center">Loading game details...</div>;
  }
  
  // 2. Not Found State: Game ID is known but doesn't exist in our mock data.
  if (!gameData) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 text-center">
        <h1 className="text-3xl font-bold mt-10">❌ Game ID {gameId} not found.</h1>
        <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
        >
            Go back to Dashboard
        </button>
      </div>
    );
  }
  
  // Data is guaranteed to exist beyond this point
  const isOwner = gameData.ownerId === MOCK_CURRENT_USER_ID; 

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-xl font-bold text-blue-600 hover:text-blue-800 transition"
          >
            ← Back to Dashboard
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">
          🎄 Game ID {gameId}: {gameData.name} 
        </h1>

        {isOwner && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 shadow-md">
            <p className="font-semibold text-yellow-800">
              You are the Owner of this game. You can manage and match players below.
            </p>
          </div>
        )}

        <div className="flex space-x-8">
          {/* LEFT COLUMN: User List and Invite Section (40%) */}
          <div className="w-2/5 bg-white rounded-lg shadow p-6 h-fit sticky top-8">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                👥 Current Participants ({gameData.players.length})
            </h2>
            
            {/* List of Users */}
            <ul className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {gameData.players.map((player, index) => (
                <li 
                  key={index} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <span className="text-gray-800">{player}</span>
                  {index === 0 && <span className="text-xs text-blue-500 font-medium">Host</span>}
                </li>
              ))}
            </ul>

            {/* Invite New People (Bottom of Left Column) */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">✉️ Invite New Player</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-400"
                >
                  Invite
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Settings and Action Section (60%) */}
          <div className="w-3/5 space-y-8">
            
            {/* Top Right: Game Settings/Edit Fields */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">🛠️ Game Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Price Limit */}
                <div>
                  <label htmlFor="priceLimit" className="block text-sm font-medium text-gray-700">
                    Price Limit ($)
                  </label>
                  <input
                    type="number"
                    id="priceLimit"
                    value={priceLimit}
                    onChange={handleInputChange(setPriceLimit)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={!isOwner}
                  />
                </div>
                
                {/* Deadline */}
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                    Gift Deadline
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    value={deadline}
                    onChange={handleInputChange(setDeadline)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={!isOwner}
                  />
                </div>
                
                {/* Category of Gift */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Gift Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={handleInputChange(setCategory)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={!isOwner}
                  >
                    <option>Tech</option>
                    <option>Books</option>
                    <option>Experiences</option>
                    <option>General</option>
                  </select>
                </div>
                
                {/* Status of the Game */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Game Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={handleInputChange(setStatus)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={!isOwner}
                  >
                    <option>Pending</option>
                    <option>Matched</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>

              </div>
              <button 
                  onClick={() => alert('Settings Saved! (Frontend only)')}
                  disabled={!isOwner}
                  className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
              >
                  Save Settings
              </button>
            </div>
            
            {/* Bottom Right: Action Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">🎁 Ready to Match?</h2>
              <p className="text-gray-600 mb-4">
                Once all players have joined, click below to **match secret santas** and send out assignments. This action cannot be undone!
              </p>
              
              <button
                onClick={handleMatch}
                disabled={!isOwner || status !== 'Pending'}
                className={`w-full px-6 py-3 rounded-lg font-extrabold text-white transition ${
                  !isOwner || status !== 'Pending'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Match People and Create Groups
              </button>
              
              {status === 'Matched' && (
                  <p className="mt-3 text-center text-green-600 font-medium">
                      Status: Matched! Assignments have been sent.
                  </p>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  )
}
// 'use client'

// import { useState, ChangeEvent } from 'react'

// // --- Interfaces for Game Data ---

// interface CurrentGame {
//   id: number
//   name: string
//   players: number
//   status: 'In Progress' | 'Active'
//   ownerId: string // Used for ownership check
// }

// interface PastGame {
//   id: number
//   name: string
//   players: number
//   status: 'Completed'
//   date: string
//   ownerId: string // Used for ownership check
// }

// // --- Mock Data ---

// // **PLACEHOLDER FOR CURRENT USER ID**
// const MOCK_CURRENT_USER_ID = 'user_123' 

// const CURRENT_GAMES: CurrentGame[] = [
//   { id: 1, name: 'Game Night - Dec 6', players: 4, status: 'In Progress', ownerId: 'user_123' }, // Owned
//   { id: 2, name: 'Weekend Tournament', players: 8, status: 'Active', ownerId: 'user_456' },
//   { id: 3, name: 'Family Game', players: 3, status: 'In Progress', ownerId: 'user_123' }, // Owned
// ]

// const PAST_GAMES: PastGame[] = [
//   { id: 4, name: 'Championship Final', players: 6, status: 'Completed', date: 'Dec 1, 2024', ownerId: 'user_789' },
//   { id: 5, name: 'Practice Match', players: 4, status: 'Completed', date: 'Nov 28, 2024', ownerId: 'user_123' }, // Owned
//   { id: 6, name: 'Team Building', players: 10, status: 'Completed', date: 'Nov 25, 2024', ownerId: 'user_456' },
// ]

// // --- Component ---

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
  
//   const handleGameNameChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setGameName(e.target.value)
//   }

//   const handlePlayerCountChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setPlayerCount(e.target.value) 
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
//             {CURRENT_GAMES.map((game: CurrentGame) => (
//               <div
//                 key={game.id}
//                 className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h4 className="font-semibold text-gray-900">{game.name}</h4>
//                     <p className="text-sm text-gray-600 mt-1">{game.players} players</p>
//                   </div>
//                   <div className='flex flex-col items-end'>
//                      {game.ownerId === MOCK_CURRENT_USER_ID && (
//                       <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full mb-1">
//                         ⭐ Your Game
//                       </span>
//                     )}
//                     <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
//                       {game.status}
//                     </span>
//                   </div>
//                 </div>
//                 {/* Link to the dynamic game page */}
//                 <a 
//                   href={`/dashboard/games/${game.id}`} 
//                   className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700 block"
//                 >
//                   Join Game →
//                 </a>
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
//             {PAST_GAMES.map((game: PastGame) => (
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
//                   <div className='flex flex-col items-end'>
//                      {game.ownerId === MOCK_CURRENT_USER_ID && (
//                       <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full mb-1">
//                         ⭐ Your Game
//                       </span>
//                     )}
//                     <span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
//                       {game.status}
//                     </span>
//                   </div>
//                 </div>
//                 {/* Link to the dynamic game page */}
//                 <a 
//                   href={`/dashboard/games/${game.id}`} 
//                   className="mt-3 text-gray-600 text-sm font-medium hover:text-gray-700 block"
//                 >
//                   View Results →
//                 </a>
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
//                   onChange={handleGameNameChange}
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
//                   onChange={handlePlayerCountChange}
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
// // app/dashboard/games/[gameId]/page.tsx
// 'use client' 

// import { useState, ChangeEvent } from 'react'
// import { useRouter } from 'next/navigation'
// import { UserButton, useUser } from '@clerk/nextjs'

// // Define the type for the props received by a dynamic route segment
// interface GamePageProps {
//   params: {
//     gameId: string // gameId from the URL is always a string
//   }
// }

// // --- Mock Data & Constants (Keys are mandatory strings) ---
// // We explicitly type the mock data keys as strings here.
// const GAME_MOCK_DATA: { [key: string]: { name: string; players: string[]; ownerId: string } } = {
//     '1': { name: 'Game Night - Dec 6', players: ['Alice', 'Bob', 'Charlie', 'David'], ownerId: 'user_123' },
//     '2': { name: 'Weekend Tournament', players: ['Eve', 'Frank', 'Grace', 'Heidi', 'Isaac', 'Jane', 'Kevin', 'Liam'], ownerId: 'user_456' },
//     '3': { name: 'Family Game', players: ['Mom', 'Dad', 'Daughter'], ownerId: 'user_123' },
// };

// const MOCK_CURRENT_USER_ID = 'user_123'; 

// // --- Component ---

// export default function IndividualGamePage({ params }: GamePageProps) {
//   const router = useRouter();
//   const { isLoaded } = useUser();
//   const gameId = params.gameId; // This is the string '1', '2', '3', etc.

//   // **CRITICAL FIX:** Only attempt to look up data if gameId exists and Clerk data is loaded.
//   const gameData = isLoaded && gameId ? GAME_MOCK_DATA[gameId] : undefined; 

//   // State for editable fields (Initialization remains the same)
//   const [priceLimit, setPriceLimit] = useState('25');
//   const [deadline, setDeadline] = useState('2025-12-20');
//   const [category, setCategory] = useState('Tech');
//   const [status, setStatus] = useState('Pending');
//   const [inviteEmail, setInviteEmail] = useState('');

//   // --- LOADING / NOT FOUND CHECK ---
  
//   // 1. Loading State: Display while Clerk is initializing or params are resolving.
//   if (!isLoaded || !gameId) {
//     return <div className="min-h-screen bg-gray-100 p-8 text-center">Loading game details...</div>;
//   }
  
//   // 2. Not Found State: Display if gameId is valid but doesn't exist in mock data.
//   if (!gameData) {
//     return (
//       <div className="min-h-screen bg-gray-100 p-8 text-center">
//         <h1 className="text-3xl font-bold mt-10">❌ Game ID {gameId} not found.</h1>
//         <button 
//             onClick={() => router.push('/dashboard')}
//             className="mt-4 text-blue-600 hover:text-blue-800 underline"
//         >
//             Go back to Dashboard
//         </button>
//       </div>
//     );
//   }
  
//   // Now that gameData is guaranteed to exist, we can use it safely:
//   const isOwner = gameData.ownerId === MOCK_CURRENT_USER_ID; 
  
//   // ... functions (handleInvite, handleMatch, handleInputChange) remain the same ...
//   const handleInvite = () => {
//     if (inviteEmail) {
//       console.log(`Inviting: ${inviteEmail} to Game ${gameId}`);
//       alert(`Invitation sent to ${inviteEmail}!`);
//       setInviteEmail('');
//     }
//   };

//   const handleMatch = () => {
//     console.log(`Executing match for Game ${gameId}`);
//     alert('Matching process initiated! (Backend required)');
//     setStatus('Matched'); 
//   };
  
//   const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
//     (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//       setter(e.target.value);
//     };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* Navigation Bar */}
//       <nav className="bg-white shadow-sm p-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <button 
//             onClick={() => router.push('/dashboard')}
//             className="text-xl font-bold text-blue-600 hover:text-blue-800 transition"
//           >
//             ← Back to Dashboard
//           </button>
//           <UserButton afterSignOutUrl="/" />
//         </div>
//       </nav>

//       {/* Main Content Area */}
//       <main className="max-w-7xl mx-auto p-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">
//           🎄 Game ID {gameId}: {gameData.name} 
//         </h1>

//         {isOwner && (
//           <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 shadow-md">
//             <p className="font-semibold text-yellow-800">
//               You are the Owner of this game. You can manage and match players below.
//             </p>
//           </div>
//         )}

//         <div className="flex space-x-8">
//           {/* LEFT COLUMN: User List and Invite Section (40%) */}
//           <div className="w-2/5 bg-white rounded-lg shadow p-6 h-fit sticky top-8">
//             <h2 className="text-xl font-semibold mb-4 border-b pb-2">
//                 👥 Current Participants ({gameData.players.length})
//             </h2>
            
//             {/* List of Users */}
//             <ul className="space-y-2 mb-6 max-h-96 overflow-y-auto">
//               {gameData.players.map((player, index) => (
//                 <li 
//                   key={index} 
//                   className="flex justify-between items-center p-3 bg-gray-50 rounded"
//                 >
//                   <span className="text-gray-800">{player}</span>
//                   {index === 0 && <span className="text-xs text-blue-500 font-medium">Host</span>}
//                 </li>
//               ))}
//             </ul>

//             {/* Invite New People (Bottom of Left Column) */}
//             <div className="pt-4 border-t">
//               <h3 className="text-lg font-medium mb-3">✉️ Invite New Player</h3>
//               <div className="flex gap-2">
//                 <input
//                   type="email"
//                   placeholder="Enter email address"
//                   value={inviteEmail}
//                   onChange={(e) => setInviteEmail(e.target.value)}
//                   className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
//                 />
//                 <button
//                   onClick={handleInvite}
//                   disabled={!inviteEmail}
//                   className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-400"
//                 >
//                   Invite
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* RIGHT COLUMN: Settings and Action Section (60%) */}
//           <div className="w-3/5 space-y-8">
            
//             {/* Top Right: Game Settings/Edit Fields */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-xl font-semibold mb-4 border-b pb-2">🛠️ Game Settings</h2>
//               <div className="grid grid-cols-2 gap-4">
                
//                 {/* Price Limit */}
//                 <div>
//                   <label htmlFor="priceLimit" className="block text-sm font-medium text-gray-700">
//                     Price Limit ($)
//                   </label>
//                   <input
//                     type="number"
//                     id="priceLimit"
//                     value={priceLimit}
//                     onChange={handleInputChange(setPriceLimit)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   />
//                 </div>
                
//                 {/* Deadline */}
//                 <div>
//                   <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
//                     Gift Deadline
//                   </label>
//                   <input
//                     type="date"
//                     id="deadline"
//                     value={deadline}
//                     onChange={handleInputChange(setDeadline)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   />
//                 </div>
                
//                 {/* Category of Gift */}
//                 <div>
//                   <label htmlFor="category" className="block text-sm font-medium text-gray-700">
//                     Gift Category
//                   </label>
//                   <select
//                     id="category"
//                     value={category}
//                     onChange={handleInputChange(setCategory)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   >
//                     <option>Tech</option>
//                     <option>Books</option>
//                     <option>Experiences</option>
//                     <option>General</option>
//                   </select>
//                 </div>
                
//                 {/* Status of the Game */}
//                 <div>
//                   <label htmlFor="status" className="block text-sm font-medium text-gray-700">
//                     Game Status
//                   </label>
//                   <select
//                     id="status"
//                     value={status}
//                     onChange={handleInputChange(setStatus)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   >
//                     <option>Pending</option>
//                     <option>Matched</option>
//                     <option>Completed</option>
//                     <option>Cancelled</option>
//                   </select>
//                 </div>

//               </div>
//               <button 
//                   onClick={() => alert('Settings Saved! (Frontend only)')}
//                   disabled={!isOwner}
//                   className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
//               >
//                   Save Settings
//               </button>
//             </div>
            
//             {/* Bottom Right: Action Button */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-xl font-semibold mb-4 border-b pb-2">🎁 Ready to Match?</h2>
//               <p className="text-gray-600 mb-4">
//                 Once all players have joined, click below to **match secret santas** and send out assignments. This action cannot be undone!
//               </p>
              
//               <button
//                 onClick={handleMatch}
//                 disabled={!isOwner || status !== 'Pending'}
//                 className={`w-full px-6 py-3 rounded-lg font-extrabold text-white transition ${
//                   !isOwner || status !== 'Pending'
//                     ? 'bg-gray-400 cursor-not-allowed'
//                     : 'bg-red-600 hover:bg-red-700'
//                 }`}
//               >
//                 Match People and Create Groups
//               </button>
              
//               {status === 'Matched' && (
//                   <p className="mt-3 text-center text-green-600 font-medium">
//                       Status: Matched! Assignments have been sent.
//                   </p>
//               )}
//             </div>
            
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }

// // app/dashboard/games/[gameId]/page.tsx
// 'use client' 

// import { useState, ChangeEvent } from 'react'
// import { useRouter } from 'next/navigation'
// import { UserButton, useUser } from '@clerk/nextjs'

// // Define the type for the props received by a dynamic route segment
// interface GamePageProps {
//   params: {
//     gameId: string // gameId from the URL is always a string
//   }
// }

// // --- Mock Data & Constants (Keys must match the string IDs from the URL) ---
// const GAME_MOCK_DATA: { [key: string]: { name: string; players: string[]; ownerId: string } } = {
//     // Keys are strings to match the route parameter: '1', '2', '3'
//     '1': { name: 'Game Night - Dec 6', players: ['Alice', 'Bob', 'Charlie', 'David'], ownerId: 'user_123' },
//     '2': { name: 'Weekend Tournament', players: ['Eve', 'Frank', 'Grace', 'Heidi', 'Isaac', 'Jane', 'Kevin', 'Liam'], ownerId: 'user_456' },
//     '3': { name: 'Family Game', players: ['Mom', 'Dad', 'Daughter'], ownerId: 'user_123' },
//     // Only IDs 1, 2, and 3 are present here.
// };

// // Assuming the current user ID is 'user_123' for ownership checks
// const MOCK_CURRENT_USER_ID = 'user_123'; 

// // --- Component ---

// export default function IndividualGamePage({ params }: GamePageProps) {
//   const router = useRouter();
//   const { isLoaded } = useUser();
//   const gameId = params.gameId; // Use the raw string ID

//   // **FIXED**: Look up the data using the string gameId directly
//   const gameData = GAME_MOCK_DATA[gameId]; 

//   // State for editable fields (Initialize with defaults since gameData may not exist yet)
//   const [priceLimit, setPriceLimit] = useState('25');
//   const [deadline, setDeadline] = useState('2025-12-20');
//   const [category, setCategory] = useState('Tech');
//   const [status, setStatus] = useState('Pending');
//   const [inviteEmail, setInviteEmail] = useState('');

//   // --- LOADING / NOT FOUND CHECK ---
//   if (!isLoaded) {
//     return <div className="min-h-screen bg-gray-100 p-8 text-center">Loading...</div>;
//   }
  
//   if (!gameData) {
//      // Now this will correctly display if the ID is 4, 5, 6, or any non-existent ID
//     return (
//       <div className="min-h-screen bg-gray-100 p-8 text-center">
//         <h1 className="text-3xl font-bold mt-10">❌ Game ID {gameId} not found.</h1>
//         <button 
//             onClick={() => router.push('/dashboard')}
//             className="mt-4 text-blue-600 hover:text-blue-800 underline"
//         >
//             Go back to Dashboard
//         </button>
//       </div>
//     );
//   }
  
//   // Now that gameData is guaranteed to exist, we can use it safely:
//   const isOwner = gameData.ownerId === MOCK_CURRENT_USER_ID; 
  
//   // ... rest of the functions (handleInvite, handleMatch, handleInputChange) remain the same ...
//   const handleInvite = () => {
//     if (inviteEmail) {
//       console.log(`Inviting: ${inviteEmail} to Game ${gameId}`);
//       alert(`Invitation sent to ${inviteEmail}!`);
//       setInviteEmail('');
//     }
//   };

//   const handleMatch = () => {
//     console.log(`Executing match for Game ${gameId}`);
//     alert('Matching process initiated! (Backend required)');
//     setStatus('Matched'); 
//   };
  
//   const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
//     (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//       setter(e.target.value);
//     };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* Navigation Bar */}
//       <nav className="bg-white shadow-sm p-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <button 
//             onClick={() => router.push('/dashboard')}
//             className="text-xl font-bold text-blue-600 hover:text-blue-800 transition"
//           >
//             ← Back to Dashboard
//           </button>
//           <UserButton afterSignOutUrl="/" />
//         </div>
//       </nav>

//       {/* Main Content Area */}
//       <main className="max-w-7xl mx-auto p-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">
//           🎄 Game ID {gameId}: {gameData.name} 
//         </h1>

//         {isOwner && (
//           <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 shadow-md">
//             <p className="font-semibold text-yellow-800">
//               You are the Owner of this game. You can manage and match players below.
//             </p>
//           </div>
//         )}

//         <div className="flex space-x-8">
//           {/* LEFT COLUMN: User List and Invite Section (40%) */}
//           <div className="w-2/5 bg-white rounded-lg shadow p-6 h-fit sticky top-8">
//             <h2 className="text-xl font-semibold mb-4 border-b pb-2">
//                 👥 Current Participants ({gameData.players.length})
//             </h2>
            
//             {/* List of Users */}
//             <ul className="space-y-2 mb-6 max-h-96 overflow-y-auto">
//               {gameData.players.map((player, index) => (
//                 <li 
//                   key={index} 
//                   className="flex justify-between items-center p-3 bg-gray-50 rounded"
//                 >
//                   <span className="text-gray-800">{player}</span>
//                   {index === 0 && <span className="text-xs text-blue-500 font-medium">Host</span>}
//                 </li>
//               ))}
//             </ul>

//             {/* Invite New People (Bottom of Left Column) */}
//             <div className="pt-4 border-t">
//               <h3 className="text-lg font-medium mb-3">✉️ Invite New Player</h3>
//               <div className="flex gap-2">
//                 <input
//                   type="email"
//                   placeholder="Enter email address"
//                   value={inviteEmail}
//                   onChange={(e) => setInviteEmail(e.target.value)}
//                   className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
//                 />
//                 <button
//                   onClick={handleInvite}
//                   disabled={!inviteEmail}
//                   className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-400"
//                 >
//                   Invite
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* RIGHT COLUMN: Settings and Action Section (60%) */}
//           <div className="w-3/5 space-y-8">
            
//             {/* Top Right: Game Settings/Edit Fields */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-xl font-semibold mb-4 border-b pb-2">🛠️ Game Settings</h2>
//               <div className="grid grid-cols-2 gap-4">
                
//                 {/* Price Limit */}
//                 <div>
//                   <label htmlFor="priceLimit" className="block text-sm font-medium text-gray-700">
//                     Price Limit ($)
//                   </label>
//                   <input
//                     type="number"
//                     id="priceLimit"
//                     value={priceLimit}
//                     onChange={handleInputChange(setPriceLimit)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   />
//                 </div>
                
//                 {/* Deadline */}
//                 <div>
//                   <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
//                     Gift Deadline
//                   </label>
//                   <input
//                     type="date"
//                     id="deadline"
//                     value={deadline}
//                     onChange={handleInputChange(setDeadline)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   />
//                 </div>
                
//                 {/* Category of Gift */}
//                 <div>
//                   <label htmlFor="category" className="block text-sm font-medium text-gray-700">
//                     Gift Category
//                   </label>
//                   <select
//                     id="category"
//                     value={category}
//                     onChange={handleInputChange(setCategory)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   >
//                     <option>Tech</option>
//                     <option>Books</option>
//                     <option>Experiences</option>
//                     <option>General</option>
//                   </select>
//                 </div>
                
//                 {/* Status of the Game */}
//                 <div>
//                   <label htmlFor="status" className="block text-sm font-medium text-gray-700">
//                     Game Status
//                   </label>
//                   <select
//                     id="status"
//                     value={status}
//                     onChange={handleInputChange(setStatus)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   >
//                     <option>Pending</option>
//                     <option>Matched</option>
//                     <option>Completed</option>
//                     <option>Cancelled</option>
//                   </select>
//                 </div>

//               </div>
//               <button 
//                   onClick={() => alert('Settings Saved! (Frontend only)')}
//                   disabled={!isOwner}
//                   className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
//               >
//                   Save Settings
//               </button>
//             </div>
            
//             {/* Bottom Right: Action Button */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-xl font-semibold mb-4 border-b pb-2">🎁 Ready to Match?</h2>
//               <p className="text-gray-600 mb-4">
//                 Once all players have joined, click below to **match secret santas** and send out assignments. This action cannot be undone!
//               </p>
              
//               <button
//                 onClick={handleMatch}
//                 disabled={!isOwner || status !== 'Pending'}
//                 className={`w-full px-6 py-3 rounded-lg font-extrabold text-white transition ${
//                   !isOwner || status !== 'Pending'
//                     ? 'bg-gray-400 cursor-not-allowed'
//                     : 'bg-red-600 hover:bg-red-700'
//                 }`}
//               >
//                 Match People and Create Groups
//               </button>
              
//               {status === 'Matched' && (
//                   <p className="mt-3 text-center text-green-600 font-medium">
//                       Status: Matched! Assignments have been sent.
//                   </p>
//               )}
//             </div>
            
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }


// app/dashboard/games/[gameId]/page.tsx
// 'use client' 

// import { useState, ChangeEvent } from 'react'
// import { useRouter } from 'next/navigation'
// import { UserButton, useUser } from '@clerk/nextjs'

// // Define the type for the props received by a dynamic route segment
// interface GamePageProps {
//   params: {
//     gameId: string
//   }
// }

// // --- Mock Data & Constants (Replace with actual data fetching later) ---

// const GAME_MOCK_DATA = {
//     1: { name: 'Game Night - Dec 6', players: ['Alice', 'Bob', 'Charlie', 'David'], ownerId: 'user_123' },
//     2: { name: 'Weekend Tournament', players: ['Eve', 'Frank', 'Grace', 'Heidi', 'Isaac', 'Jane', 'Kevin', 'Liam'], ownerId: 'user_456' },
//     3: { name: 'Family Game', players: ['Mom', 'Dad', 'Daughter'], ownerId: 'user_123' },
//     // Add more mock games as needed
// };

// // Assuming the current user ID is 'user_123' for ownership checks
// const MOCK_CURRENT_USER_ID = 'user_123'; 

// // --- Component ---

// export default function IndividualGamePage({ params }: GamePageProps) {
//   const router = useRouter();
//   const { user, isLoaded } = useUser();
//   const gameId = parseInt(params.gameId);
//   const gameData = GAME_MOCK_DATA[gameId as keyof typeof GAME_MOCK_DATA];

//   // State for editable fields
//   const [priceLimit, setPriceLimit] = useState('25');
//   const [deadline, setDeadline] = useState('2025-12-20');
//   const [category, setCategory] = useState('Tech');
//   const [status, setStatus] = useState('Pending');
//   const [inviteEmail, setInviteEmail] = useState('');

//   if (!isLoaded || !gameData) {
//     // Basic loading/not found state
//     return (
//       <div className="min-h-screen bg-gray-100 p-8">
//         <div className="max-w-7xl mx-auto text-center">
//             {isLoaded ? 'Game not found.' : 'Loading...'}
//         </div>
//       </div>
//     );
//   }
  
//   // You would typically use the Clerk user ID, but using mock for consistency with game-dropdowns.tsx
//   const isOwner = gameData.ownerId === MOCK_CURRENT_USER_ID; 

//   const handleInvite = () => {
//     if (inviteEmail) {
//       console.log(`Inviting: ${inviteEmail} to Game ${gameId}`);
//       alert(`Invitation sent to ${inviteEmail}!`);
//       setInviteEmail('');
//     }
//   };

//   const handleMatch = () => {
//     // This is where the core matching logic would run (backend call)
//     console.log(`Executing match for Game ${gameId}`);
//     alert('Matching process initiated! (Backend required)');
//     // Update status to 'Matched' upon successful mock action
//     setStatus('Matched'); 
//   };
  
//   // Helper for input changes
//   const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
//     (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//       setter(e.target.value);
//     };


//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* Navigation Bar */}
//       <nav className="bg-white shadow-sm p-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <button 
//             onClick={() => router.push('/dashboard')}
//             className="text-xl font-bold text-blue-600 hover:text-blue-800 transition"
//           >
//             ← Back to Dashboard
//           </button>
//           <UserButton afterSignOutUrl="/" />
//         </div>
//       </nav>

//       {/* Main Content Area */}
//       <main className="max-w-7xl mx-auto p-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">
//           🎄 Game ID {gameId}: {gameData.name} 
//         </h1>

//         {isOwner && (
//           <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 shadow-md">
//             <p className="font-semibold text-yellow-800">
//               You are the Owner of this game. You can manage and match players below.
//             </p>
//           </div>
//         )}

//         <div className="flex space-x-8">
//           {/* LEFT COLUMN: User List and Invite Section (40%) */}
//           <div className="w-2/5 bg-white rounded-lg shadow p-6 h-fit sticky top-8">
//             <h2 className="text-xl font-semibold mb-4 border-b pb-2">
//                 👥 Current Participants ({gameData.players.length})
//             </h2>
            
//             {/* List of Users */}
//             <ul className="space-y-2 mb-6 max-h-96 overflow-y-auto">
//               {gameData.players.map((player, index) => (
//                 <li 
//                   key={index} 
//                   className="flex justify-between items-center p-3 bg-gray-50 rounded"
//                 >
//                   <span className="text-gray-800">{player}</span>
//                   {/* Additional status/role can go here */}
//                   {index === 0 && <span className="text-xs text-blue-500 font-medium">Host</span>}
//                 </li>
//               ))}
//             </ul>

//             {/* Invite New People (Bottom of Left Column) */}
//             <div className="pt-4 border-t">
//               <h3 className="text-lg font-medium mb-3">✉️ Invite New Player</h3>
//               <div className="flex gap-2">
//                 <input
//                   type="email"
//                   placeholder="Enter email address"
//                   value={inviteEmail}
//                   onChange={(e) => setInviteEmail(e.target.value)}
//                   className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
//                 />
//                 <button
//                   onClick={handleInvite}
//                   disabled={!inviteEmail}
//                   className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-400"
//                 >
//                   Invite
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* RIGHT COLUMN: Settings and Action Section (60%) */}
//           <div className="w-3/5 space-y-8">
            
//             {/* Top Right: Game Settings/Edit Fields */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-xl font-semibold mb-4 border-b pb-2">🛠️ Game Settings</h2>
//               <div className="grid grid-cols-2 gap-4">
                
//                 {/* Price Limit */}
//                 <div>
//                   <label htmlFor="priceLimit" className="block text-sm font-medium text-gray-700">
//                     Price Limit ($)
//                   </label>
//                   <input
//                     type="number"
//                     id="priceLimit"
//                     value={priceLimit}
//                     onChange={handleInputChange(setPriceLimit)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner} // Only owner can edit
//                   />
//                 </div>
                
//                 {/* Deadline */}
//                 <div>
//                   <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
//                     Gift Deadline
//                   </label>
//                   <input
//                     type="date"
//                     id="deadline"
//                     value={deadline}
//                     onChange={handleInputChange(setDeadline)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   />
//                 </div>
                
//                 {/* Category of Gift */}
//                 <div>
//                   <label htmlFor="category" className="block text-sm font-medium text-gray-700">
//                     Gift Category
//                   </label>
//                   <select
//                     id="category"
//                     value={category}
//                     onChange={handleInputChange(setCategory)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   >
//                     <option>Tech</option>
//                     <option>Books</option>
//                     <option>Experiences</option>
//                     <option>General</option>
//                   </select>
//                 </div>
                
//                 {/* Status of the Game */}
//                 <div>
//                   <label htmlFor="status" className="block text-sm font-medium text-gray-700">
//                     Game Status
//                   </label>
//                   <select
//                     id="status"
//                     value={status}
//                     onChange={handleInputChange(setStatus)}
//                     className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                     disabled={!isOwner}
//                   >
//                     <option>Pending</option>
//                     <option>Matched</option>
//                     <option>Completed</option>
//                     <option>Cancelled</option>
//                   </select>
//                 </div>

//               </div>
//               <button 
//                   onClick={() => alert('Settings Saved! (Frontend only)')}
//                   disabled={!isOwner}
//                   className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
//               >
//                   Save Settings
//               </button>
//             </div>
            
//             {/* Bottom Right: Action Button */}
//             <div className="bg-white rounded-lg shadow p-6">
//               <h2 className="text-xl font-semibold mb-4 border-b pb-2">🎁 Ready to Match?</h2>
//               <p className="text-gray-600 mb-4">
//                 Once all players have joined, click below to **match secret santas** and send out assignments. This action cannot be undone!
//               </p>
              
//               <button
//                 onClick={handleMatch}
//                 disabled={!isOwner || status !== 'Pending'} // Only owner can match, and only if Pending
//                 className={`w-full px-6 py-3 rounded-lg font-extrabold text-white transition ${
//                   !isOwner || status !== 'Pending'
//                     ? 'bg-gray-400 cursor-not-allowed'
//                     : 'bg-red-600 hover:bg-red-700'
//                 }`}
//               >
//                 Match People and Create Groups
//               </button>
              
//               {status === 'Matched' && (
//                   <p className="mt-3 text-center text-green-600 font-medium">
//                       Status: Matched! Assignments have been sent.
//                   </p>
//               )}
//             </div>
            
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }


// // app/dashboard/games/[gameId]/page.tsx
// import { currentUser } from '@clerk/nextjs/server'
// import { redirect } from 'next/navigation'
// import { UserButton } from '@clerk/nextjs'

// // Define the type for the props received by a dynamic route segment
// interface GamePageProps {
//   params: {
//     gameId: string
//   }
// }

// export default async function IndividualGamePage({ params }: GamePageProps) {
//   const user = await currentUser()
  
//   // Security check: Redirect to sign-in if not authenticated
//   if (!user) {
//     redirect('/sign-in')
//   }

//   // Get the game ID from the URL parameters
//   const gameId = params.gameId

//   // --- FRONTEND LOGIC PLACEHOLDER ---
//   // In a real app, you would fetch game data using the gameId:
//   // const gameData = await fetchGameData(gameId); 
  
//   // Mock data for display (replace with real data fetching later)
//   const mockGameName = `Game ${gameId}: Galactic Conquest`
//   const mockStatus = parseInt(gameId) % 2 === 0 ? 'Active' : 'Completed'
//   const mockIsOwner = (gameId === '1' || gameId === '3' || gameId === '5'); // Based on mock IDs

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <nav className="bg-white shadow-sm p-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <a href="/dashboard" className="text-xl font-bold text-blue-600 hover:text-blue-800">
//             ← Back to Dashboard
//           </a>
//           <UserButton afterSignOutUrl="/" />
//         </div>
//       </nav>

//       <main className="max-w-4xl mx-auto p-8">
//         <div className="bg-white rounded-lg shadow p-8">
//           <div className="flex justify-between items-start mb-4">
//             <h1 className="text-4xl font-extrabold text-gray-900">
//               {mockGameName}
//             </h1>
//             <span className={`px-4 py-2 rounded-full font-semibold text-sm ${
//               mockStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
//             }`}>
//               {mockStatus}
//             </span>
//           </div>

//           {mockIsOwner && (
//             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
//               <p className="font-semibold text-yellow-800">
//                 You are the Owner of this game. You can manage settings here.
//               </p>
//             </div>
//           )}

//           <p className="text-lg text-gray-700 mb-6">
//             This is the dedicated page for Game ID: **{gameId}**.
//             All real-time scores, player lists, and game management controls will appear here.
//           </p>

//           <h2 className="text-2xl font-bold mb-4 border-b pb-2">Game Details</h2>
          
//           <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
//             <div>
//               <dt className="text-sm font-medium text-gray-500">Host</dt>
//               <dd className="mt-1 text-gray-900">{user.firstName} {user.lastName}</dd>
//             </div>
//             <div>
//               <dt className="text-sm font-medium text-gray-500">Max Players</dt>
//               <dd className="mt-1 text-gray-900">8</dd>
//             </div>
//             <div>
//               <dt className="text-sm font-medium text-gray-500">Start Date</dt>
//               <dd className="mt-1 text-gray-900">Dec 6, 2024</dd>
//             </div>
//             <div>
//               <dt className="text-sm font-medium text-gray-500">Game Type</dt>
//               <dd className="mt-1 text-gray-900">Board Game</dd>
//             </div>
//           </dl>

//           {/* Action Button */}
//           <button 
//             className={`mt-8 w-full px-6 py-3 rounded-lg font-semibold transition ${
//               mockStatus === 'Active' 
//                 ? 'bg-blue-600 text-white hover:bg-blue-700' 
//                 : 'bg-gray-400 text-white cursor-not-allowed'
//             }`}
//             disabled={mockStatus !== 'Active'}
//           >
//             {mockStatus === 'Active' ? 'View Live Scoreboard' : 'Game Completed'}
//           </button>
//         </div>
//       </main>
//     </div>
//   )
// }