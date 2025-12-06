import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasCompletedOnboarding } from "@/services/onboarding";

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher([
	"/sign-in(.*)",
	"/sign-up(.*)",
	"/invite(.*)",
	"/api/games/invite/:inviteId", // Allow GET /api/games/invite/:id (view invite details)
	"/api/games/invite/decline", // Allow declining invites without auth
]);

// Routes that are part of the onboarding flow
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

// Routes that require the user to be onboarded (completed database registration)
const isProtectedRoute = createRouteMatcher([
	"/create(.*)",
	"/games(.*)",
	"/gifts(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
	const { userId } = await auth();

	// Protect non-public routes - require Clerk authentication
	if (!isPublicRoute(req)) {
		await auth.protect();
	}

	// If user is authenticated, check onboarding status
	if (userId) {
		const completed = await hasCompletedOnboarding(userId);

		// Redirect users who have completed onboarding away from onboarding pages
		if (isOnboardingRoute(req) && completed) {
			const url = new URL("/", req.url);
			url.searchParams.set("onboarding_redirect", "true");
			return NextResponse.redirect(url);
		}

		// Redirect users who haven't completed onboarding to onboarding when trying to access protected routes
		if (!completed && !isOnboardingRoute(req) && !isPublicRoute(req)) {
			// Check if it's a protected route OR if it's the home page (/)
			const isHomePage = req.nextUrl.pathname === "/";
			if (isProtectedRoute(req) || isHomePage) {
				const url = new URL("/onboarding", req.url);
				return NextResponse.redirect(url);
			}
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
