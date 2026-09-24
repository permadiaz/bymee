import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inputSchema } from "@/lib/ai/types";
import { provider } from "@/lib/ai/provider";
import { AIError } from "@/lib/ai/errors";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 24000)
      return NextResponse.json(
        { error: "Input too large. Use fewer than 24,000 characters." },
        { status: 413 },
      );
    const input = inputSchema.safeParse(JSON.parse(raw));
    if (!input.success)
      return NextResponse.json(
        {
          error:
            "Please enter valid context (maximum 12,000 characters per field).",
        },
        { status: 400 },
      );
    if (process.env.DEMO_MODE === "false") {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
        return NextResponse.json(
          { error: "Supabase is not configured." },
          { status: 503 },
        );
      const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: request.headers.get("Authorization") || "",
            },
          },
        },
      );
      const token = request.headers
        .get("Authorization")
        ?.replace(/^Bearer\s+/i, "");
      if (!token)
        return NextResponse.json(
          { error: "Sign in to continue." },
          { status: 401 },
        );
      const {
        data: { user },
        error,
      } = await db.auth.getUser(token);
      if (error || !user)
        return NextResponse.json(
          { error: "Sign in to continue." },
          { status: 401 },
        );
      const { data: allowed, error: limitError } =
        await db.rpc("consume_ai_quota");
      if (limitError || !allowed)
        return NextResponse.json(
          {
            error:
              "Daily analysis limit reached or database quota is not configured.",
          },
          { status: 429 },
        );
    }
    return NextResponse.json(await provider.analyze(input.data));
  } catch (error) {
    if (error instanceof AIError) {
      console.warn("BYMEE AI request failed", { code: error.code });
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.httpStatus },
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof SyntaxError
            ? "Invalid request."
            : error instanceof Error
              ? error.message
              : "Analysis failed.",
      },
      { status: 500 },
    );
  }
}
