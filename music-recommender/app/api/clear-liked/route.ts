import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "data", "liked_songs.csv");

export async function POST() {
  try {
    // overwrite with empty CSV header
    const headers =
      "track_title,artist,song_link,tempo,energy,danceability,acousticness,valence,loudness\n";

    fs.writeFileSync(FILE_PATH, headers);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to clear liked songs" },
      { status: 500 }
    );
  }
}