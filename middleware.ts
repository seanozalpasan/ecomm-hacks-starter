import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasCompletedOnboarding } from "@/services/onboarding";

// Define routes that don't require onboarding check
const isPublicRoute = createRouteMatcher([
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/invite(.*)",
	"/onboarding(.*)",
	"/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
	const { userId } = await auth();

	// Allow access to public routes
	if (isPublicRoute(req)) {
		return NextResponse.next();
	}

	// If user is not signed in, let Clerk handle redirecting to sign-in
	if (!userId) {
		return NextResponse.next();
	}

	// Check if user has completed onboarding
	const isOnboarded = await hasCompletedOnboarding(userId);

	// If not onboarded and trying to access protected routes, redirect to onboarding
	if (!isOnboarded) {
		const onboardingUrl = new URL("/onboarding", req.url);
		return NextResponse.redirect(onboardingUrl);
	}

	// User is onboarded, allow access
	return NextResponse.next();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
