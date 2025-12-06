"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductCardList } from "@/components/product-card-list";
import { type GiftSearchInput, giftSearchInputSchema } from "@/schemas/gifts";
import { searchGifts, type ProductResult } from "@/lib/api/searchGifts";
import { users } from "@/lib/db/schema";
import { ChristmasLoadingSkeleton } from "@/components/christmas-loading-skeleton";

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
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

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
      setProducts(result.products);
    } catch (error) {
      console.error("Error searching gifts:", error);
      setProducts([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">
          You're getting a gift for {user.name}!
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
                  className="px-3 py-1.5 rounded-full bg-neutral-200 text-sm text-neutral-800"
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
            Write some more about this person to find more personalized gifts.
          </FieldLabel>
          <FieldContent>
            <input
              id={`${idPrefix}-gift-search`}
              type="text"
              placeholder="Interests, hobbies, favorite things not already listed… your relationship with them…"
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

        <div className="flex justify-center mt-8">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="hover:shadow-lg"
          >
            {isSubmitting ? "Searching…" : "Search for gifts"}
          </Button>
        </div>
      </form>

      {isSubmitting && <ChristmasLoadingSkeleton recipientName={user.name} />}

      {!isSubmitting && products.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Recommended Products ({products.length})
            </h2>
            {priceLimit && (
              <span className="text-sm text-muted-foreground">
                Under ${priceLimit}
              </span>
            )}
          </div>
          <ProductCardList products={products} />
        </div>
      )}
    </div>
  );
}
