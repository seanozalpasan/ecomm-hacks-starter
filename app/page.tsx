"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { SearchLoading } from "@/components/search-loading";

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

	return <SearchLoading />;
}

export default function Home() {
	return (
		<Suspense fallback={<SearchLoading />}>
			<HomeContent />
		</Suspense>
	);
}
