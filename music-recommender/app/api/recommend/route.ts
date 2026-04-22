import { NextRequest, NextResponse } from "next/server";
import { fetchCandidateSongs, loadLikedSongs, recommendSongs } from "@/lib/recommender";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const linksText = String(body.links ?? "");
    const links = linksText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const liked = loadLikedSongs();
    if (!liked.length) {
      return NextResponse.json(
        { error: "No liked songs saved yet. Add songs to liked_songs.csv first." },
        { status: 400 }
      );
    }

    if (!links.length) {
      return NextResponse.json({ error: "No candidate links were provided." }, { status: 400 });
    }

    const candidates = await fetchCandidateSongs(links);
    const recommendations = recommendSongs(liked, candidates, 10);

    return NextResponse.json({ recommendations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}