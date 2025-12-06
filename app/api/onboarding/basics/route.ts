import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const basicsSchema = z.object({
  age: z.number().int().min(1).max(150),
  name: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = basicsSchema.parse(body);

    // Mock success response - no database operations yet
    return NextResponse.json(
      {
        success: true,
        data: validatedData,
        message: "Basics information saved successfully",
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

