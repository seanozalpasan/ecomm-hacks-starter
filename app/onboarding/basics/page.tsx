"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitBasics } from "@/lib/hooks/useOnboarding";
import { getOnboardingData } from "@/lib/utils/storage";
import { useEffect } from "react";

const basicsSchema = z.object({
  age: z.number().int().min(1, "Age must be at least 1").max(150, "Age must be less than 150"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  location: z.string().min(1, "Location is required").max(200, "Location is too long"),
});

type BasicsFormData = z.infer<typeof basicsSchema>;

export default function BasicsPage() {
  const router = useRouter();
  const { mutate: submitBasics, isPending } = useSubmitBasics();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<BasicsFormData>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      age: undefined,
      name: "",
      location: "",
    },
  });

  // Load saved data from localStorage
  useEffect(() => {
    const saved = getOnboardingData();
    if (saved.basics) {
      setValue("age", saved.basics.age);
      setValue("name", saved.basics.name);
      setValue("location", saved.basics.location);
    }
  }, [setValue]);

  const onSubmit = (data: BasicsFormData) => {
    submitBasics(data, {
      onSuccess: () => {
        router.push("/onboarding/likes/1");
      },
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
        Tell us about yourself
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        We need some basic information to get started.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
            placeholder="Enter your name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="age"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Age
          </label>
          <input
            id="age"
            type="number"
            {...register("age", { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
            placeholder="Enter your age"
            min="1"
            max="150"
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.age.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Location
          </label>
          <input
            id="location"
            type="text"
            {...register("location")}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
            placeholder="Enter your location"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.location.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving..." : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}

