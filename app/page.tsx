"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { SearchLoading } from "@/components/search-loading";
import { Logo } from "@/components/ui/logo";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Game {
	id: string;
	priceLimit: string | null;
	deadline: Date;
	categories: string[] | null;
	status: string;
	authorId: string;
	authorName: string;
}

async function fetchUserGames(): Promise<Game[]> {
	const response = await fetch("/api/games/user");
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to fetch games");
	}
	const data = await response.json();
	return data.data;
}

function HomeContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const onboardingRedirect = searchParams.get("onboarding_redirect");
    if (onboardingRedirect === "true") {
      toast.error("Onboarding already completed", {
        description:
          "You have already completed onboarding. You cannot access those pages again.",
      });
    }
  }, [searchParams]);

  return (
    <div>
      <Logo />
      <h1 className="text-2xl font-bold">Unwrappd</h1>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <HomeContent />
    </Suspense>
  );
}
