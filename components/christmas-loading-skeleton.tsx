"use client";

import { cn } from "@/lib/utils";

interface ChristmasLoadingSkeletonProps {
  recipientName: string;
}

export function ChristmasLoadingSkeleton({ recipientName }: ChristmasLoadingSkeletonProps) {
  return (
    <div className="relative w-full space-y-8 animate-in fade-in duration-500 mt-8">
      {/* Decorative Candy Canes - Top Corners */}
      <div className="absolute -top-4 left-0 w-12 h-12 opacity-70 animate-pulse">
        <CandyCane className="text-red-500 rotate-12" />
      </div>
      <div className="absolute -top-4 right-0 w-12 h-12 opacity-70 animate-pulse animation-delay-200">
        <CandyCane className="text-green-600 -rotate-12" />
      </div>

      {/* Snowflakes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -top-8">
        <Snowflake className="absolute top-0 left-1/4 w-6 h-6 text-blue-200 animate-float" />
        <Snowflake className="absolute top-8 left-3/4 w-4 h-4 text-blue-100 animate-float animation-delay-300" />
        <Snowflake className="absolute top-4 left-1/2 w-5 h-5 text-blue-200 animate-float animation-delay-500" />
      </div>

      {/* Loading Message with Festive Icon */}
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative">
          {/* Spinning wreath effect */}
          <div className="w-16 h-16 rounded-full border-4 border-red-200 border-t-green-500 animate-spin" />
          <div className="absolute inset-2 w-12 h-12 rounded-full border-4 border-green-200 border-b-red-500 animate-spin-reverse" />
        </div>

        <div className="text-center space-y-2">
          <p className="text-lg font-medium bg-linear-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent animate-shimmer bg-size-[200%_100%]">
            Finding the perfect gifts for {recipientName}…
          </p>
          <p className="text-sm text-muted-foreground">
            🎄 Searching through our holiday catalog 🎁
          </p>
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-linear-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-size-[200%_100%] rounded w-48 animate-shimmer" />
          <div className="h-5 bg-linear-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-size-[200%_100%] rounded w-24 animate-shimmer animation-delay-100" />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <ProductCardSkeleton key={i} delay={i * 100} />
          ))}
        </div>
      </div>

      {/* Decorative Bottom Candy Canes */}
      <div className="flex justify-between items-end pt-8 opacity-50">
        <CandyCane className="text-green-500 w-10 h-10 rotate-45 animate-pulse" />
        <CandyCane className="text-red-500 w-10 h-10 -rotate-45 animate-pulse animation-delay-300" />
      </div>
    </div>
  );
}

function ProductCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="relative space-y-3 p-4 rounded-xl border-2 border-neutral-100 bg-white shadow-sm hover:shadow-md transition-shadow"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Small decorative star */}
      <div className="absolute top-2 right-2 text-yellow-400 opacity-30">
        ⭐
      </div>

      {/* Image */}
      <div className="aspect-square rounded-lg bg-linear-to-br from-red-50 via-white to-green-50 bg-size-[200%_200%] animate-shimmer-slow" />

      {/* Title */}
      <div className="space-y-2">
        <div className="h-5 bg-linear-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-size-[200%_100%] rounded w-full animate-shimmer" />
        <div className="h-5 bg-linear-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-size-[200%_100%] rounded w-3/4 animate-shimmer animation-delay-100" />
      </div>

      {/* Price */}
      <div className="h-6 bg-linear-to-r from-green-100 via-white to-red-100 bg-size-[200%_100%] rounded w-24 animate-shimmer animation-delay-200" />

      {/* Button */}
      <div className="h-10 bg-linear-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-size-[200%_100%] rounded-lg animate-shimmer animation-delay-300" />
    </div>
  );
}

function CandyCane({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-candy-cane", className)}
    >
      <defs>
        <linearGradient
          id="candyCaneGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="25%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="75%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <path d="M5.7 21a2 2 0 0 1-3.5-2l8.6-14a6 6 0 0 1 10.4 6 2 2 0 1 1-3.464-2 2 2 0 1 0-3.464-2Z" />
      <path d="M17.75 7 15 2.1" />
      <path d="M10.9 4.8 13 9" />
      <path d="m7.9 9.7 2 4.4" />
      <path d="M4.9 14.7 7 18.9" />
    </svg>
  );
}

function Snowflake({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("opacity-60", className)}
    >
      <path
        d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93M12 6l-3 3m3-3l3 3m-3 9l-3-3m3 3l3-3M6 12l3-3m-3 3l3 3m9-3l-3-3m3 3l-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
