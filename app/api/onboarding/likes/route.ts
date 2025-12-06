import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const likesSchema = z.object({
  step: z.number().int().min(1).max(3),
  answer: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = likesSchema.parse(body);

    // Mock success response - no database operations yet
    return NextResponse.json(
      {
        success: true,
        data: validatedData,
        message: `Likes question ${validatedData.step} saved successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

