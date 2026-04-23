import { NextRequest, NextResponse } from "next/server";
import { addLikedSong, fetchCandidateSongs } from "@/lib/recommender";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const linksText = String(body.links ?? "");

    const links = linksText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!links.length) {
      return NextResponse.json(
        { error: "No Spotify links were provided." },
        { status: 400 }
      );
    }

    const songs = await fetchCandidateSongs(links);

    for (const song of songs) {
      addLikedSong(song);
    }

    return NextResponse.json({
      success: true,
      count: songs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}