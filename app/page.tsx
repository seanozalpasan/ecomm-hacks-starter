"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { SearchLoading } from "@/components/search-loading";
import { Logo } from "@/components/ui/logo";

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
