import { GiftSearchClient } from "@/components/gift-search-client";
import { getUserById } from "@/services/user/query";
import { notFound } from "next/navigation";
import { EmptyState } from "./EmptyState";

type Props = {
  searchParams: Promise<{ userId?: string; gameId?: string }>;
};

export default async function GiftsSearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const { userId, gameId } = params;

  if (!userId || !gameId) {
    return <EmptyState userId={userId} gameId={gameId} />;
  }

  const user = await getUserById(userId);

  if (!user) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black px-4 py-16 sm:py-32">
      <div className="w-full max-w-2xl">
        <GiftSearchClient user={user} />
      </div>
    </div>
  );
}
