"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitLikes } from "@/lib/hooks/useOnboarding";
import { getOnboardingData } from "@/lib/utils/storage";
import { useEffect } from "react";

const likesSchema = z.object({
  answer: z.string().min(1, "Please provide an answer").max(500, "Answer is too long"),
});

type LikesFormData = z.infer<typeof likesSchema>;

const LIKES_QUESTIONS = {
  1: "What's your favorite color?",
  2: "What's your favorite hobby or activity?",
  3: "What's your favorite type of gift to receive?",
};

export default function LikesPage() {
  const router = useRouter();
  const params = useParams();
  const step = parseInt(params.step as string, 10);
  const { mutate: submitLikes, isPending } = useSubmitLikes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LikesFormData>({
    resolver: zodResolver(likesSchema),
    defaultValues: {
      answer: "",
    },
  });

  // Load saved data from localStorage
  useEffect(() => {
    const saved = getOnboardingData();
    if (saved.likes && saved.likes[step]) {
      setValue("answer", saved.likes[step]);
    }
  }, [step, setValue]);

  const question = LIKES_QUESTIONS[step as keyof typeof LIKES_QUESTIONS];

  if (!question) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">
          Invalid step
        </h1>
        <button
          onClick={() => router.push("/onboarding/basics")}
          className="px-6 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Go to Basics
        </button>
      </div>
    );
  }

  const onSubmit = (data: LikesFormData) => {
    submitLikes(
      {
        step,
        answer: data.answer,
      },
      {
        onSuccess: () => {
          if (step < 3) {
            router.push(`/onboarding/likes/${step + 1}`);
          } else {
            // Onboarding complete - redirect to home or completion page
            router.push("/");
          }
        },
      }
    );
  };

  const handleBack = () => {
    if (step === 1) {
      router.push("/onboarding/basics");
    } else {
      router.push(`/onboarding/likes/${step - 1}`);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">
        Tell us what you like
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8">
        Question {step} of 3
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="answer"
            className="block text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4"
          >
            {question}
          </label>
          <textarea
            id="answer"
            {...register("answer")}
            rows={4}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 resize-none"
            placeholder="Type your answer here..."
          />
          {errors.answer && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.answer.message}
            </p>
          )}
        </div>

        <div className="flex justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? "Saving..."
              : step === 3
              ? "Complete"
              : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}

