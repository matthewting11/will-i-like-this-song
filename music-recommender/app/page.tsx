"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

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

export default function Page() {
  const [links, setLinks] = useState("");
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleTheme() {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
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

      alert(`Added "${song.track_title}" to liked songs`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Music Recommender</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Paste Spotify track links and discover songs that match your taste.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/liked-songs"
              className="rounded-lg bg-zinc-200 px-4 py-2 font-medium transition hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              View Liked Songs
            </Link>

            {/* 🔥 ADD THIS */}
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
                  <th className="px-4 py-3">Song</th>
                  <th className="px-4 py-3">Artist</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {results.map((song) => (
                  <tr key={song.song_link} className="border-t border-zinc-300 dark:border-zinc-800">
                    <td className="px-4 py-3">{song.track_title}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{song.artist}</td>
                    <td className="px-4 py-3">{(song.score * 100).toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleAdd(song)}
                        className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white transition hover:bg-emerald-500"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}