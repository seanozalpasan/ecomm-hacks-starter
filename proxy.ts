import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasCompletedOnboarding } from "@/services/onboarding/check";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
	const { userId } = await auth();

	if (!isPublicRoute(req)) {
		await auth.protect();
	}

	// Redirect users who have completed onboarding away from onboarding pages
	if (isOnboardingRoute(req) && userId) {
		const completed = await hasCompletedOnboarding(userId);
		if (completed) {
			const url = new URL("/", req.url);
			url.searchParams.set("onboarding_redirect", "true");
			return NextResponse.redirect(url);
		}
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
