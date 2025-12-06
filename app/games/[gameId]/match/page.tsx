'use client'

import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import React from 'react'

interface MatchPageProps {
  params: Promise<{
    gameId: string
  }>
}

interface MatchData {
  success: boolean;
  matched: boolean;
  data?: {
    gameId: string;
    gameStatus: string;
    buyingFor: {
      id: string;
      name: string;
      email: string;
      location: string | null;
      giftPreferences: string | null;
      clothingSize: string | null;
    };
  };
  message?: string;
}

async function fetchMatch(gameId: string): Promise<MatchData> {
  const response = await fetch(`/api/games/${gameId}/match`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch match data');
  }

  return response.json();
}

export default function MatchPage({ params }: MatchPageProps) {
  const { gameId } = React.use(params);
  const router = useRouter();
  const { isLoaded } = useUser();

  const { data: matchData, isLoading, error } = useQuery({
    queryKey: ['match', gameId],
    queryFn: () => fetchMatch(gameId),
    enabled: !!gameId && isLoaded,
  });

  if (!isLoaded || isLoading) {
    return <div className="min-h-screen bg-gray-100 p-8 text-center">Loading your match...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 text-center">
        <h1 className="text-3xl font-bold mt-10">❌ Error loading match</h1>
        <p className="text-gray-600 mt-4">{error instanceof Error ? error.message : 'Could not load your match.'}</p>
        <button
          onClick={() => router.push(`/games/${gameId}`)}
          className="mt-4 text-blue-600 hover:text-blue-800 underline"
        >
          Back to Game
        </button>
      </div>
    );
  }

  if (!matchData?.matched) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 text-center">
        <h1 className="text-3xl font-bold mt-10">🎁 No Match Yet</h1>
        <p className="text-gray-600 mt-4">{matchData?.message || 'Matches have not been created for this game yet.'}</p>
        <button
          onClick={() => router.push(`/games/${gameId}`)}
          className="mt-4 text-blue-600 hover:text-blue-800 underline"
        >
          Back to Game
        </button>
      </div>
    );
  }

  const recipient = matchData.data!.buyingFor;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎁 Your Secret Santa Match
            </h1>
            <p className="text-gray-600">
              Shhh... this is a secret! You're buying a gift for:
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-8 mb-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
              {recipient.name}
            </h2>
            <p className="text-center text-gray-600">{recipient.email}</p>
          </div>

          <div className="space-y-6">
            {recipient.location && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  📍 Location
                </h3>
                <p className="text-lg text-gray-900">{recipient.location}</p>
              </div>
            )}

            {recipient.giftPreferences && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  💝 Gift Preferences
                </h3>
                <p className="text-lg text-gray-900 whitespace-pre-wrap">{recipient.giftPreferences}</p>
              </div>
            )}

            {recipient.clothingSize && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  👕 Clothing Size
                </h3>
                <p className="text-lg text-gray-900">{recipient.clothingSize}</p>
              </div>
            )}

            {!recipient.location && !recipient.giftPreferences && !recipient.clothingSize && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
                <p className="text-yellow-800">
                  This person hasn't provided any preferences yet. You might want to get creative or reach out to them!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🤫 Remember:</h3>
          <ul className="space-y-1 text-blue-800">
            <li>• Keep this a secret!</li>
            <li>• Use the information above to find the perfect gift</li>
            <li>• Check the game page for the deadline and price limit</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
