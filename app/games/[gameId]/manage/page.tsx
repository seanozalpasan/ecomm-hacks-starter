'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'sonner'

interface ManagePageProps {
  params: Promise<{
    gameId: string
  }>
}

interface GameData {
  id: string;
  priceLimit: string | null;
  deadline: Date;
  categories: string[] | null;
  status: string;
  authorId: string;
  authorClerkId: string;
  authorName: string;
  participants: Array<{
    userId: string;
    name: string;
    email: string;
  }>;
  invites: Array<{
    id: string;
    email: string;
    status: string;
  }>;
}

async function fetchGameData(gameId: string): Promise<GameData> {
  const response = await fetch(`/api/games/${gameId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch game data');
  }

  const data = await response.json();
  return data.data;
}

async function sendInvite(gameId: string, email: string) {
  const response = await fetch(`/api/games/${gameId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send invite');
  }

  return response.json();
}

async function createMatchesForGame(gameId: string) {
  const response = await fetch(`/api/games/${gameId}/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create matches');
  }

  return response.json();
}

export default function ManageGamePage({ params }: ManagePageProps) {
  const { gameId } = React.use(params);
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();

  const { data: gameData, isLoading, error } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => fetchGameData(gameId),
    enabled: !!gameId && isLoaded,
  });

  const { mutate: invitePlayer, isPending: isInviting } = useMutation({
    mutationFn: (email: string) => sendInvite(gameId, email),
    onSuccess: () => {
      toast.success('Invitation sent!', {
        description: `Invitation email has been sent`,
      });
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
    onError: (error) => {
      toast.error('Failed to send invite', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    },
  });

  const { mutate: createMatches, isPending: isMatching } = useMutation({
    mutationFn: () => createMatchesForGame(gameId),
    onSuccess: (data) => {
      toast.success('Matches created!', {
        description: `${data.data.matchCount} participants have been matched`,
      });
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
    onError: (error) => {
      toast.error('Failed to create matches', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    },
  });

  const [priceLimit, setPriceLimit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (gameData) {
      setPriceLimit(gameData.priceLimit || '25');
      setDeadline(new Date(gameData.deadline).toISOString().split('T')[0]);
      setCategory(gameData.categories?.[0] || 'General');
    }
  }, [gameData]);

  const handleInvite = () => {
    if (inviteEmail) {
      invitePlayer(inviteEmail);
    }
  };

  const handleMatch = () => {
    createMatches();
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(e.target.value);
    };

  if (!isLoaded || isLoading) {
    return <div className="min-h-screen bg-gray-100 p-8 text-center">Loading game details...</div>;
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 text-center">
        <h1 className="text-3xl font-bold mt-10">❌ Game not found</h1>
        <p className="text-gray-600 mt-4">{error instanceof Error ? error.message : 'This game could not be found.'}</p>
        <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
        >
            Go Home
        </button>
      </div>
    );
  }

  const isOwner = user?.id && gameData.authorClerkId === user.id;

  // Redirect non-owners
  if (!isOwner) {
    router.push(`/games/${gameId}`);
    return null;
  }

  // Filter out the host from participants and combine with pending invites
  const allPlayers = [
    ...(gameData.participants || [])
      .filter(p => p.userId !== gameData.authorId)
      .map(p => ({ name: p.name, email: p.email, status: 'Accepted' })),
    ...(gameData.invites || [])
      .filter(i => i.status === 'PENDING')
      .map(i => ({ name: i.email, email: i.email, status: 'Pending' }))
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => router.push(`/games/${gameId}`)}
            className="text-xl font-bold text-blue-600 hover:text-blue-800 transition"
          >
            ← Back to Game
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">
          🛠️ Manage Game
        </h1>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 shadow-md">
          <p className="font-semibold text-yellow-800">
            You are the Owner of this game. You can manage and match players below.
          </p>
        </div>

        <div className="flex space-x-8">
          <div className="w-2/5 bg-white rounded-lg shadow p-6 h-fit sticky top-8">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                👥 Participants ({allPlayers.length})
            </h2>

            <ul className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              <li className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-gray-800">{gameData.authorName}</span>
                <span className="text-xs text-blue-500 font-medium">Host</span>
              </li>
              {allPlayers.map((player, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <span className="text-gray-800">{player.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    player.status === 'Accepted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {player.status}
                  </span>
                </li>
              ))}
            </ul>

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
                  disabled={!inviteEmail || isInviting}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  {isInviting ? 'Sending...' : 'Invite'}
                </button>
              </div>
            </div>
          </div>

          <div className="w-3/5 space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">🛠️ Game Settings</h2>
              <div className="grid grid-cols-2 gap-4">

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
                  />
                </div>

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
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Gift Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={handleInputChange(setCategory)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option>Tech</option>
                    <option>Books</option>
                    <option>Experiences</option>
                    <option>General</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Game Status
                  </label>
                  <input
                    type="text"
                    id="status"
                    value={gameData.status}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm sm:text-sm text-gray-500"
                  />
                </div>

              </div>
              <button
                  onClick={() => toast.success('Settings Saved!', {
                    description: 'Frontend only',
                  })}
                  className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                  Save Settings
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">🎁 Ready to Match?</h2>
              <p className="text-gray-600 mb-4">
                Once all players have joined, click below to match secret santas and send out assignments. This action cannot be undone!
              </p>

              <button
                onClick={handleMatch}
                disabled={gameData.status !== 'DRAFT' || isMatching}
                className={`w-full px-6 py-3 rounded-lg font-extrabold text-white transition ${
                  gameData.status !== 'DRAFT' || isMatching
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isMatching ? 'Creating Matches...' : 'Match People and Create Groups'}
              </button>

              {(gameData.status === 'ACTIVE' || gameData.status === 'MATCHED') && (
                  <p className="mt-3 text-center text-green-600 font-medium">
                      ✓ Matches have been created! View them on the main game page.
                  </p>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
