"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function Navbar() {
	return (
		<nav className="bg-white dark:bg-zinc-900 w-full px-[5vw] md:px-[20vw]">
			<div className="flex items-center justify-between">
				{/* Logo and Brand */}
				<Link
					href="/"
					className="flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					<Logo />
					<span className="text-2xl font-bold text-black dark:text-white">
						Unwrappd
					</span>
				</Link>

				{/* Auth */}
				<div className="flex items-center gap-4">
					<SignedIn>
						<UserButton
							appearance={{
								elements: {
									avatarBox: "w-14 h-14",
								},
							}}
						/>
					</SignedIn>

					<SignedOut>
						<Button asChild variant="ghost" size="lg">
							<Link href="/sign-in">Sign In</Link>
						</Button>
						<Button asChild size="lg">
							<Link href="/sign-up">Sign Up</Link>
						</Button>
					</SignedOut>
				</div>
			</div>
		</nav>
	);
}
