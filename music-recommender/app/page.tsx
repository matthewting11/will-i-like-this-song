"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

type Recommendation = {
  track_title: string;
  artist: string;
  song_link: string;
  tempo: number;
  energy: number;
  danceability: number;
  acousticness: number;
  valence: number;
  loudness: number;
  score: number;
};

type LikedSong = {
  track_title: string;
  artist: string;
  song_link: string;
};

export default function Page() {
  const [links, setLinks] = useState("");
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [likedLinks, setLikedLinks] = useState<Set<string>>(new Set());
  const [addingLinks, setAddingLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLikedSongs();
  }, []);

  async function fetchLikedSongs() {
    try {
      const res = await fetch("/api/liked-songs", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load liked songs");
      }

      const links = new Set<string>(
        (data.likedSongs || [])
          .map((song: LikedSong) => normalizeLink(song.song_link))
          .filter(Boolean) as string[]
      );

      setLikedLinks(links);
    } catch (err) {
      console.error(err);
    }
  }

  function normalizeLink(link: string) {
    return (link || "").split("?")[0].replace(/\/$/, "");
  }

  function isAlreadyAdded(song: Recommendation) {
    return likedLinks.has(normalizeLink(song.song_link));
  }

  async function handleRecommend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ links }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to recommend songs");
      }

      setResults(data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(song: Recommendation) {
    const normalized = normalizeLink(song.song_link);

    if (likedLinks.has(normalized)) return;

    setAddingLinks((prev) => new Set(prev).add(normalized));

    try {
      const res = await fetch("/api/add-liked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(song),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add song");
      }

      setLikedLinks((prev) => {
        const next = new Set(prev);
        next.add(normalized);
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAddingLinks((prev) => {
        const next = new Set(prev);
        next.delete(normalized);
        return next;
      });
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex items-center justify-between gap-4">
          <div>
              <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-4xl font-bold"
            >
              Music Recommender
            </motion.h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Share your music taste • Get recommended songs • Rank your tastes
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
              Tip: Shift + click to select multiple songs, then paste them here
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/liked-songs"
              className="rounded-lg bg-zinc-200 px-4 py-2 font-medium transition hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              View Liked Songs
            </Link>

            <ThemeToggle />
          </div>
        </div>

        <section className="rounded-2xl border border-zinc-300 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleRecommend} className="space-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Candidate Spotify track links
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
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Finding matches..." : "Recommend Songs"}
            </button>
          </form>
        </section>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-100 p-4 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-300 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-2xl font-semibold">Recommendations</h2>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Song</th>
                  <th className="px-4 py-3">Artist</th>
                  <th className="px-4 py-3">Similarity</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {results.map((song, index) => {
                  const rowKey = `${song.track_title}-${song.artist}-${song.song_link || index}`;
                  const alreadyAdded = isAlreadyAdded(song);
                  const adding = addingLinks.has(normalizeLink(song.song_link));

                  return (
                    <tr key={rowKey} className="border-t border-zinc-300 dark:border-zinc-800">
                      <td className="px-4 py-3 font-medium">{index + 1}</td>
                      <td className="px-4 py-3">{song.track_title}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{song.artist}</td>
                      <td className="px-4 py-3">{(song.score * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        {alreadyAdded ? (
                          <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Added ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAdd(song)}
                            disabled={adding}
                            className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {adding ? "Adding..." : "Add"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}