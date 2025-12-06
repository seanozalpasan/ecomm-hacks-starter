"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function Navbar() {
  return (
    <nav className="border-b bg-white dark:bg-zinc-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 hover:cursor-pointer"
          >
            <Logo />
            <span className="text-xl font-bold text-black dark:text-white">
              Unwrappd
            </span>
          </Link>

          {/* Navigation Links and Auth */}
          <div className="flex items-center gap-6">
            <SignedIn>
              <Link
                href="/"
                className="text-sm font-medium text-black dark:text-white hover:opacity-70 transition-opacity"
              >
                My Games
              </Link>
              <Link
                href="/create"
                className="text-sm font-medium text-black dark:text-white hover:opacity-70 transition-opacity"
              >
                Create Game
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <Button asChild variant="ghost">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}
