'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'

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
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-muted-foreground">Loading game details...</p>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Game not found</h1>
        <p className="text-muted-foreground mb-6">{error instanceof Error ? error.message : 'This game could not be found.'}</p>
        <Button onClick={() => router.push('/')} variant="outline">
          Go Home
        </Button>
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex justify-between items-center p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => router.push(`/games/${gameId}`)}
          className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 transition"
        >
          <Logo />
        </button>
        <UserButton />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Manage Game
        </h1>

        <div className="bg-muted border-l-4 border-primary p-4 mb-6 rounded">
          <p className="text-sm text-muted-foreground">
            You are the owner of this game. You can manage and match players below.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/5 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 h-fit lg:sticky lg:top-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-gray-900 dark:text-gray-100">
                Participants ({allPlayers.length + 1})
            </h2>

            <ul className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              <li className="flex justify-between items-center p-3 bg-muted rounded">
                <span className="text-sm text-gray-900 dark:text-gray-100">{gameData.authorName}</span>
                <span className="text-xs font-medium text-muted-foreground">Host</span>
              </li>
              {allPlayers.map((player, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted rounded"
                >
                  <span className="text-sm text-gray-900 dark:text-gray-100">{player.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    player.status === 'Accepted'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted-foreground/10 text-muted-foreground'
                  }`}>
                    {player.status}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-medium mb-3 text-gray-900 dark:text-gray-100">Invite New Player</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-grow h-9 px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail || isInviting}
                  size="sm"
                >
                  {isInviting ? 'Sending...' : 'Invite'}
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:w-3/5 space-y-6">
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-gray-900 dark:text-gray-100">Game Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <Field>
                  <FieldLabel htmlFor="priceLimit">
                    Price Limit ($)
                  </FieldLabel>
                  <FieldContent>
                    <input
                      type="number"
                      id="priceLimit"
                      value={priceLimit}
                      onChange={handleInputChange(setPriceLimit)}
                      className="h-9 w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="deadline">
                    Gift Deadline
                  </FieldLabel>
                  <FieldContent>
                    <input
                      type="date"
                      id="deadline"
                      value={deadline}
                      onChange={handleInputChange(setDeadline)}
                      className="h-9 w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="category">
                    Gift Category
                  </FieldLabel>
                  <FieldContent>
                    <select
                      id="category"
                      value={category}
                      onChange={handleInputChange(setCategory)}
                      className="h-9 w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option>Tech</option>
                      <option>Books</option>
                      <option>Experiences</option>
                      <option>General</option>
                    </select>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="status">
                    Game Status
                  </FieldLabel>
                  <FieldContent>
                    <input
                      type="text"
                      id="status"
                      value={gameData.status}
                      disabled
                      className="h-9 w-full px-3 py-2 text-sm border border-input bg-muted rounded-md text-muted-foreground"
                    />
                  </FieldContent>
                </Field>

              </div>
              <Button
                  onClick={() => toast.success('Settings Saved!', {
                    description: 'Frontend only',
                  })}
                  className="mt-6"
              >
                  Save Settings
              </Button>
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
