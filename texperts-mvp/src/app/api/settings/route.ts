import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

/**
 * POST /api/settings — validate an API key by making a test call.
 * The key is NOT stored on the server — only validated.
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ valid: false, error: "No API key provided" }, { status: 400 });
    }

    // Test the key with a minimal call
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8,
      messages: [{ role: "user", content: "Say hi" }],
    });

    return NextResponse.json({ valid: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid API key";
    return NextResponse.json({ valid: false, error: message }, { status: 401 });
  }
}

/**
 * GET /api/settings — check if server has an API key configured.
 * Never returns the actual key.
 */
export async function GET() {
  const hasServerKey = !!process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({ hasServerKey });
}
