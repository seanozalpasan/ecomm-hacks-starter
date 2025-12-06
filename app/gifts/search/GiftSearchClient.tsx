"use client"

import { useForm } from "react-hook-form"
import { Field, FieldContent, FieldLabel, FieldDescription } from "@/components/ui/field"
import { cn } from "@/lib/utils"

type GiftSearchForm = {
  query: string
}

export function GiftSearchClient() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GiftSearchForm>()

  const onSubmit = (data: GiftSearchForm) => {
    console.log("Search query:", data.query)
    // TODO: Implement search functionality
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl">
      <Field>
        <FieldLabel htmlFor="gift-search">
          What are you looking to give your friend?
        </FieldLabel>
        <FieldContent>
          <input
            id="gift-search"
            type="text"
            placeholder="e.g., birthday gift, anniversary present..."
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.query && "border-destructive"
            )}
            {...register("query", {
              required: "Please enter a search query",
            })}
          />
          {errors.query && (
            <p className="text-sm text-destructive mt-1">{errors.query.message}</p>
          )}
        </FieldContent>
      </Field>
    </form>
  )
}

