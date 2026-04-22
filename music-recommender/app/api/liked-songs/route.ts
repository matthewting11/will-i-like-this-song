import { NextResponse } from "next/server";
import { loadLikedSongs } from "@/lib/recommender";

export async function GET() {
  try {
    const likedSongs = loadLikedSongs();
    return NextResponse.json({ likedSongs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}