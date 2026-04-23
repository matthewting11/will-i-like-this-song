import fs from "fs";
import path from "path";
import Papa from "papaparse";

export type SongRow = {
  track_title: string;
  artist: string;
  song_link: string;
  tempo: number;
  energy: number;
  danceability: number;
  acousticness: number;
  valence: number;
  loudness: number;
};

type FeatureKey =
  | "tempo"
  | "energy"
  | "danceability"
  | "acousticness"
  | "valence"
  | "loudness";

type FeatureVector = Record<FeatureKey, number>;

export const FEATURES: FeatureKey[] = [
  "tempo",
  "energy",
  "danceability",
  "acousticness",
  "valence",
  "loudness",
];

const dataPath = path.join(process.cwd(), "data", "liked_songs.csv");

function parseCsv(text: string): SongRow[] {
  const parsed = Papa.parse<SongRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  return (parsed.data || []).map((row) => ({
    track_title: row.track_title || "",
    artist: row.artist || "",
    song_link: row.song_link || "",
    tempo: Number(row.tempo || 0),
    energy: Number(row.energy || 0),
    danceability: Number(row.danceability || 0),
    acousticness: Number(row.acousticness || 0),
    valence: Number(row.valence || 0),
    loudness: Number(row.loudness || 0),
  }));
}

function toCsv(rows: SongRow[]): string {
  return Papa.unparse(rows);
}

export function loadLikedSongs(): SongRow[] {
  if (!fs.existsSync(dataPath)) return [];

  const raw = fs.readFileSync(dataPath, "utf8").trim();
  if (!raw) return [];

  return parseCsv(raw);
}

export function saveLikedSongs(rows: SongRow[]) {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(dataPath, toCsv(rows), "utf8");
}

function extractSpotifyId(link: string): string {
  return link.trim().replace(/\/$/, "").split("/").pop()?.split("?")[0] ?? "";
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function fetchCandidateSongs(links: string[]): Promise<SongRow[]> {
  const spotifyIds = links.map(extractSpotifyId).filter(Boolean);
  const batches = chunk(spotifyIds, 20);
  const rows: SongRow[] = [];
  function normalizeTempo(tempo: number) {
    if (tempo >= 190) return tempo / 2;
    if (tempo > 0 && tempo <= 60) return tempo * 2;
    return tempo;
  }
  for (const batch of batches) {
    const trackData = await fetchJson(
      `https://api.reccobeats.com/v1/track?ids=${encodeURIComponent(batch.join(","))}`
    );

    const tracks = trackData.content || trackData.data || trackData || [];

    for (const track of tracks) {
      const rbId = track.id;
      if (!rbId) continue;

      const featureData = await fetchJson(
        `https://api.reccobeats.com/v1/track/${rbId}/audio-features`
      );

      const f = featureData.content || featureData.data || featureData;

      rows.push({
        track_title: track.trackTitle || track.title || track.name || "Unknown",
        artist: track.artists?.[0]?.name || "Unknown Artist",
        song_link: track.href || track.spotifyHref || track.spotifyUrl || "",
        tempo: normalizeTempo(Number(f.tempo || 0)),
        energy: Number(f.energy || 0),
        danceability: Number(f.danceability || 0),
        acousticness: Number(f.acousticness || 0),
        valence: Number(f.valence || 0),
        loudness: Number(f.loudness || 0),
      });
    }
  }

  return rows;
}

function averageProfile(rows: SongRow[]): FeatureVector {
  const count = rows.length;

  const sums: FeatureVector = {
    tempo: 0,
    energy: 0,
    danceability: 0,
    acousticness: 0,
    valence: 0,
    loudness: 0,
  };

  for (const row of rows) {
    for (const feature of FEATURES) {
      sums[feature] += row[feature];
    }
  }

  return {
    tempo: sums.tempo / count,
    energy: sums.energy / count,
    danceability: sums.danceability / count,
    acousticness: sums.acousticness / count,
    valence: sums.valence / count,
    loudness: sums.loudness / count,
  };
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function recommendSongs(
  liked: SongRow[],
  candidates: SongRow[],
  topN = 10
) {
  if (!liked.length) return [];

  const profile = averageProfile(liked);
  const likedLinks = new Set(liked.map((s) => s.song_link));

  console.log("PROFILE:", profile);
  console.log("FIRST CANDIDATE:", candidates[0]);

  return candidates
    .filter((song) => !likedLinks.has(song.song_link))
    .map((song) => {
      const candidateVector = FEATURES.map((feature) => song[feature]);
      const profileVector = FEATURES.map((feature) => profile[feature]);
      const score = cosineSimilarity(candidateVector, profileVector);

      console.log("SONG:", song.track_title, candidateVector, "SCORE:", score);

      return {
        ...song,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export function addLikedSong(song: SongRow) {
  const liked = loadLikedSongs();

  const exists = liked.some(
    (s) =>
      s.song_link === song.song_link ||
      (s.track_title === song.track_title && s.artist === song.artist)
  );

  if (!exists) {
    liked.push(song);
    saveLikedSongs(liked);
  }
}
