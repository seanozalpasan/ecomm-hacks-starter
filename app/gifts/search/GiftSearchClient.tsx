"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type GiftSearchForm = {
  query: string;
};

type GiftSuggestion = {
  name: string;
  description: string;
  category: string;
};

type GiftSuggestionsResponse = {
  query: string;
  recipient: {
    name: string;
    likes: string[];
    dislikes: string[];
    preferences: Record<string, string[]>;
    additionalInfo: string;
  };
  suggestions: GiftSuggestion[];
};

export function GiftSearchClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GiftSuggestionsResponse | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GiftSearchForm>();

  const onSubmit = async (data: GiftSearchForm) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // TODO: Get userId from auth context/session
      const userId = "winston"; // Placeholder for now

      const res = await fetch("/api/gifts/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: data.query,
          userId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch suggestions");
      }

      const result = await res.json();
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <Field>
          <FieldLabel htmlFor="gift-search">
            What are you looking to give your friend?
          </FieldLabel>
          <FieldContent>
            <Textarea
              id="gift-search"
              placeholder="e.g., birthday gift, anniversary present..."
              disabled={isLoading}
              aria-invalid={errors.query ? "true" : "false"}
              className={cn(errors.query && "border-destructive")}
              {...register("query", {
                required: "Please enter a search query",
              })}
            />
            {errors.query && (
              <p className="text-sm text-destructive mt-1">
                {errors.query.message}
              </p>
            )}
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </FieldContent>
        </Field>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
            "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isLoading ? "Searching..." : "Search for gifts"}
        </button>
      </form>

      {response && (
        <div className="mt-6 space-y-4">
          <div className="rounded-md border border-border bg-card p-4">
            <h2 className="text-lg font-semibold mb-2">
              Gift suggestions for {response.recipient.name}
            </h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Likes:</span>{" "}
                {response.recipient.likes.join(", ")}
              </p>
              <p>
                <span className="font-medium">Dislikes:</span>{" "}
                {response.recipient.dislikes.join(", ")}
              </p>
              <p className="mt-2">{response.recipient.additionalInfo}</p>
            </div>
          </div>

          {response.suggestions && response.suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Suggested Gifts</h3>
              {response.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="rounded-md border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {suggestion.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                    {suggestion.category && (
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">
                        {suggestion.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
