import { NextRequest, NextResponse } from "next/server";
import { addLikedSong } from "@/lib/recommender";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    addLikedSong(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}