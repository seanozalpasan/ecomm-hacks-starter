'use client'

import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import CircularUserImages from '@/components/circular-user-images'

interface GamePageProps {
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
    clerkId: string;
    name: string;
    email: string;
  }>;
  invites: Array<{
    id: string;
    email: string;
    status: string;
  }>;
}

interface UserImage {
  clerkId: string;
  imageUrl: string | null;
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

async function fetchUserImages(clerkIds: string[]): Promise<UserImage[]> {
  const response = await fetch('/api/users/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clerkIds }),
  });

  if (!response.ok) {
    console.error('Failed to fetch user images');
    return [];
  }

  const data = await response.json();
  return data.users;
}

// Placeholder avatar image (blank silhouette)
const BLANK_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';

export default function IndividualGamePage({ params }: GamePageProps) {
  const { gameId } = React.use(params);
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [userImages, setUserImages] = useState<Map<string, string>>(new Map());

  const { data: gameData, isLoading, error } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => fetchGameData(gameId),
    enabled: !!gameId && isLoaded,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });

  // Fetch user images when game data changes
  useEffect(() => {
    if (!gameData) return;

    const clerkIds = [
      gameData.authorClerkId,
      ...gameData.participants.map(p => p.clerkId),
    ];

    fetchUserImages(clerkIds).then((images) => {
      const imageMap = new Map<string, string>();
      images.forEach(({ clerkId, imageUrl }) => {
        imageMap.set(clerkId, imageUrl || BLANK_AVATAR);
      });
      setUserImages(imageMap);
    });
  }, [gameData]);

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

  // Filter out the host from participants (only accepted participants)
  const acceptedParticipants = (gameData.participants || [])
    .filter(p => p.userId !== gameData.authorId);

  const pendingCount = (gameData.invites || []).filter(i => i.status === 'PENDING').length;

  // Prepare users for circular display with Clerk images or blank avatar
  const circularUsers = [
    {
      userImage: userImages.get(gameData.authorClerkId) || BLANK_AVATAR,
      id: gameData.authorId
    },
    ...acceptedParticipants.map(p => ({
      userImage: userImages.get(p.clerkId) || BLANK_AVATAR,
      id: p.userId
    }))
  ];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-xl font-bold text-blue-600 hover:text-blue-800 transition"
          >
            ← Home
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎄 Secret Santa Game
          </h1>
          <p className="text-gray-600">
            {gameData.status === 'DRAFT' && 'Waiting for everyone to join...'}
            {gameData.status === 'ACTIVE' && 'The game is active!'}
            {gameData.status === 'COMPLETED' && 'This game has been completed'}
          </p>
        </div>

        {/* Circular Avatars */}
        <div className="mb-12">
          <CircularUserImages
            users={circularUsers}
            size={80}
            radius={150}
          />
          {pendingCount > 0 && (
            <p className="text-center text-gray-500 mt-4">
              {pendingCount} {pendingCount === 1 ? 'person' : 'people'} still pending...
            </p>
          )}
        </div>

        {/* Game Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">Game Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💰</span>
              <div>
                <p className="text-sm text-gray-500">Price Limit</p>
                <p className="text-lg font-semibold">${gameData.priceLimit || '25'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl">📅</span>
              <div>
                <p className="text-sm text-gray-500">Gift Deadline</p>
                <p className="text-lg font-semibold">{formatDate(gameData.deadline)}</p>
              </div>
            </div>

            {gameData.categories && gameData.categories.length > 0 && (
              <div className="flex items-center gap-3 md:col-span-2">
                <span className="text-3xl">🎁</span>
                <div>
                  <p className="text-sm text-gray-500">Categories</p>
                  <p className="text-lg font-semibold">{gameData.categories.join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {isOwner && (
            <button
              onClick={() => router.push(`/games/${gameId}/manage`)}
              className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md"
            >
              🛠️ Manage Game
            </button>
          )}

          {(gameData.status === 'ACTIVE' || gameData.status === 'MATCHED') && (
            <button
              onClick={() => router.push(`/games/${gameId}/match`)}
              className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 transition shadow-md"
            >
              🎁 View Your Match
            </button>
          )}
        </div>

        {/* Status Messages */}
        {gameData.status === 'DRAFT' && (
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-blue-800">
              {isOwner
                ? '⏳ Waiting for participants to accept their invites. You can manually start matching from the Manage Game page.'
                : '⏳ The host is waiting for everyone to join before starting the game.'}
            </p>
          </div>
        )}

        {(gameData.status === 'ACTIVE' || gameData.status === 'MATCHED') && (
          <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <p className="text-green-800">
              ✨ Matches have been created! Click "View Your Match" above to see who you're buying for.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
