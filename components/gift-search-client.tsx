"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type GiftSearchInput, giftSearchInputSchema } from "@/schemas/gifts";
import { searchGifts, type GiftSuggestion } from "@/lib/api/searchGifts";
import { users } from "@/lib/db/schema";

type GiftSearchForm = GiftSearchInput;

type User = typeof users.$inferSelect;

type GiftSearchClientProps = {
  user: User;
  gameId: string;
  priceLimit: string | null;
};

export function GiftSearchClient({
  user,
  gameId,
  priceLimit,
}: GiftSearchClientProps) {
  const idPrefix = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GiftSearchForm>({
    resolver: zodResolver(giftSearchInputSchema),
    defaultValues: {
      query: "",
      gameId,
      priceLimit: priceLimit ?? null,
    },
  });

  const onSubmit = async (data: GiftSearchForm) => {
    setIsSubmitting(true);
    try {
      const result = await searchGifts(data);
      setSuggestions(result.giftSuggestions);
    } catch (error) {
      console.error("Error searching gifts:", error);
      setSuggestions([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">
          You are getting a gift for {user.name}!
        </h1>

        {user.giftPreferences && user.giftPreferences.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Here are some things they said they like:
            </p>
            <ul className="flex flex-wrap gap-2 justify-center">
              {user.giftPreferences.map((preference, index) => (
                <li
                  key={index}
                  className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground"
                >
                  {preference}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("gameId")} />
        <input type="hidden" {...register("priceLimit")} />
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-gift-search`}>
            Write some more about this person to look for more personalized
            gifts.
          </FieldLabel>
          <FieldContent>
            <input
              id={`${idPrefix}-gift-search`}
              type="text"
              placeholder="Interests, hobbies, favorite things not already listed... your relationship with them..."
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
                errors.query && "border-destructive",
              )}
              {...register("query")}
            />
            {errors.query && (
              <p className="text-sm text-destructive mt-1">
                {errors.query.message}
              </p>
            )}
          </FieldContent>
        </Field>
        <Button type="submit" disabled={isSubmitting} className="mt-4">
          {isSubmitting ? "Searching…" : "Search"}
        </Button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">
            Suggested Gift Categories
          </h2>
          <ul className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-base">
                        {suggestion.searchQuery}
                      </h3>
                      {suggestion.category && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {suggestion.category}
                        </span>
                      )}
                    </div>
                    {suggestion.description && (
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
