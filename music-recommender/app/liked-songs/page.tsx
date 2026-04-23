"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

type LikedSong = {
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

type SortOption =
  | "song-az"
  | "song-za"
  | "artist-az"
  | "artist-za"
  | "energy-high"
  | "energy-low"
  | "dance-high"
  | "dance-low"
  | "tempo-high"
  | "tempo-low";

export default function LikedSongsPage() {
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [links, setLinks] = useState("");
  const [addingSongs, setAddingSongs] = useState(false);
  const [error, setError] = useState("");

  const [songSearch, setSongSearch] = useState("");
  const [artistSearch, setArtistSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("song-az");

  useEffect(() => {
    fetchLiked();
  }, []);

  async function fetchLiked() {
    try {
      const res = await fetch("/api/liked-songs", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load liked songs");
      }

      const songs: LikedSong[] = data.likedSongs || [];
      setLikedSongs(songs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setClearing(true);

    try {
      const res = await fetch("/api/clear-liked", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to clear");
      }

      setLikedSongs([]);
      setSongSearch("");
      setArtistSearch("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error clearing songs");
    } finally {
      setClearing(false);
      setConfirmOpen(false);
    }
  }

  async function handleAddLikedSongs(e: React.FormEvent) {
    e.preventDefault();
    setAddingSongs(true);
    setError("");

    try {
      const res = await fetch("/api/add-liked-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ links }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add liked songs");
      }

      setLinks("");
      await fetchLiked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAddingSongs(false);
    }
  }

  const topArtists = useMemo(() => {
    const counts = new Map<string, number>();

    for (const song of likedSongs) {
      const artist = (song.artist || "Unknown Artist").trim();
      counts.set(artist, (counts.get(artist) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist))
      .slice(0, 8);
  }, [likedSongs]);

  const filteredAndSortedSongs = useMemo(() => {
    let rows = likedSongs.filter((song) => {
      const matchesSong = song.track_title
        .toLowerCase()
        .includes(songSearch.toLowerCase());

      const matchesArtist = song.artist
        .toLowerCase()
        .includes(artistSearch.toLowerCase());

      return matchesSong && matchesArtist;
    });

    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "song-az":
          return a.track_title.localeCompare(b.track_title);
        case "song-za":
          return b.track_title.localeCompare(a.track_title);
        case "artist-az":
          return a.artist.localeCompare(b.artist);
        case "artist-za":
          return b.artist.localeCompare(a.artist);
        case "energy-high":
          return b.energy - a.energy;
        case "energy-low":
          return a.energy - b.energy;
        case "dance-high":
          return b.danceability - a.danceability;
        case "dance-low":
          return a.danceability - b.danceability;
        case "tempo-high":
          return b.tempo - a.tempo;
        case "tempo-low":
          return a.tempo - b.tempo;
        default:
          return 0;
      }
    });

    return rows;
  }, [likedSongs, songSearch, artistSearch, sortBy]);

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Your Liked Songs</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Songs you’ve added to your personal taste profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500"
            >
              Back to Recommender
            </Link>

            <button
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-500"
            >
              Clear All
            </button>

            <ThemeToggle />
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Loading...
          </div>
        ) : likedSongs.length === 0 ? (
          <section className="space-y-6">
            <div className="rounded-2xl border border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No liked songs saved yet. Add songs here so the recommender can learn your taste and analyze similarity.
            </div>

            <section className="rounded-2xl border border-zinc-300 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <form onSubmit={handleAddLikedSongs} className="space-y-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Paste Spotify links for songs you like
                </label>

                <textarea
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  rows={10}
                  placeholder="Paste one Spotify track link per line"
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 p-4 outline-none placeholder:text-zinc-500 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                />

                <button
                  type="submit"
                  disabled={addingSongs}
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingSongs ? "Adding liked songs..." : "Add Liked Songs"}
                </button>
              </form>
            </section>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-100 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-zinc-300 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-2xl font-semibold">Top Artists</h2>

              {topArtists.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">No artists found.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {topArtists.map((item) => (
                    <div
                      key={item.artist}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <p className="font-semibold">{item.artist}</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.count} song{item.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-300 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-5 text-2xl font-semibold">All Liked Songs</h2>
              <p className="mb-4 mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Note: Some tempos may be shown in double-time (e.g. 70 BPM → 140 BPM)
              </p>

              <div className="mb- grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Search by song name
                  </label>
                  <input
                    type="text"
                    value={songSearch}
                    onChange={(e) => setSongSearch(e.target.value)}
                    placeholder="Search song..."
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 p-3 outline-none placeholder:text-zinc-500 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Search by artist
                  </label>
                  <input
                    type="text"
                    value={artistSearch}
                    onChange={(e) => setArtistSearch(e.target.value)}
                    placeholder="Search artist..."
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 p-3 outline-none placeholder:text-zinc-500 focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 p-3 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="song-az">Song Name (A → Z)</option>
                    <option value="song-za">Song Name (Z → A)</option>
                    <option value="artist-az">Artist (A → Z)</option>
                    <option value="artist-za">Artist (Z → A)</option>
                    <option value="energy-high">Energy (High → Low)</option>
                    <option value="energy-low">Energy (Low → High)</option>
                    <option value="dance-high">Danceability (High → Low)</option>
                    <option value="dance-low">Danceability (Low → High)</option>
                    <option value="tempo-high">Tempo (High → Low)</option>
                    <option value="tempo-low">Tempo (Low → High)</option>
                  </select>
                </div>
              </div>

              <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Showing {filteredAndSortedSongs.length} of {likedSongs.length} songs
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-300 dark:border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
                    <tr>
                      <th className="px-4 py-3">Song</th>
                      <th className="px-4 py-3">Artist</th>
                      <th className="px-4 py-3">Tempo</th>
                      <th className="px-4 py-3">Energy</th>
                      <th className="px-4 py-3">Danceability</th>
                      <th className="px-4 py-3">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedSongs.map((song, index) => {
                      const rowKey = `${song.track_title}-${song.artist}-${song.song_link || index}`;

                      return (
                        <tr key={rowKey} className="border-t border-zinc-300 dark:border-zinc-800">
                          <td className="px-4 py-3">{song.track_title}</td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {song.artist}
                          </td>
                          <td className="px-4 py-3">{song.tempo}</td>
                          <td className="px-4 py-3">{song.energy.toFixed(2)}</td>
                          <td className="px-4 py-3">{song.danceability.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <a
                              href={song.song_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-500 hover:text-indigo-400"
                            >
                              Open
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
              <h2 className="text-xl font-semibold">Clear all liked songs?</h2>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-lg bg-zinc-200 px-4 py-2 dark:bg-zinc-800"
                >
                  No
                </button>

                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {clearing ? "Clearing..." : "Yes, clear"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}