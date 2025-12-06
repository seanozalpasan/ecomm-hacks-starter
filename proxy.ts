import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasCompletedOnboarding } from "@/services/onboarding";

const isPublicRoute = createRouteMatcher([
	"/",
	"/sign-in(.*)",
	"/sign-up(.*)",
	// Allow invite flows (shareable links, postcard generation) without auth
	"/api/games/invite(.*)",
	"/api/invites/(.*)",
]);
const isOnboardingRoute = createRouteMatcher([
	"/onboarding",
	"/onboarding/basics",
	"/onboarding/interests",
]);
const isOnboardingApiRoute = createRouteMatcher(["/api/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
	const { userId, sessionClaims } = await auth();

	// Protect non-public routes - require Clerk authentication
	if (!isPublicRoute(req)) {
		await auth.protect();
	}

	// If user is authenticated, check onboarding status
	if (userId) {
		// Skip onboarding check for onboarding-related routes
		const isOnOnboarding = isOnboardingRoute(req) || isOnboardingApiRoute(req);

		// Check Clerk metadata first for faster validation
		const metadata = sessionClaims?.publicMetadata as { onboardingComplete?: boolean } | undefined;
		const onboardingComplete = metadata?.onboardingComplete === true;

		// If metadata shows incomplete, double-check with database
		const completed = onboardingComplete || await hasCompletedOnboarding(userId);

		if (!isOnOnboarding) {
			// Redirect users who haven't completed onboarding to the onboarding page
			if (!completed && !isPublicRoute(req)) {
				const url = new URL("/onboarding/basics", req.url);
				return NextResponse.redirect(url);
			}
		}

		// Redirect users who have completed onboarding away from onboarding pages
		if (isOnboardingRoute(req) && completed) {
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
