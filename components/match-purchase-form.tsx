"use client";

import Image from "next/image";
import { useState } from "react";

interface MatchPersonForm {
  imageUrl: string;
  secretSantaName: string
}

export default function MatchPersonForm({
  imageUrl,
  secretSantaName,
}: MatchPersonForm) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 flex flex-col items-center gap-6 rounded-2xl">
      <h1 className="text-5xl font-semibold">{secretSantaName}</h1>
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* Image Container - Centered */}
        <div className="flex justify-center">
          <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-md">
            <Image
              src={imageUrl}
              alt="Form image"
              fill
              className="object-cover"
              sizes="192px"
            />
          </div>
        </div>

        {/* Textarea */}
        <div>
          <label htmlFor="text-input" className="sr-only">
            Text input
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe the gift you want to get..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
