import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { hasCompletedOnboarding } from "@/services/onboarding/check";

export default async function OnboardingPage() {
	const { userId } = await auth();

	if (userId) {
		const completed = await hasCompletedOnboarding(userId);
		if (completed) {
			redirect("/");
		}
	}

	redirect("/onboarding/basics");
}
