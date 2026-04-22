import Link from "next/link";
import { loadLikedSongs } from "@/lib/recommender";
import ThemeToggle from "@/components/ThemeToggle";

export default function LikedSongsPage() {
  const likedSongs = loadLikedSongs();

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

            <ThemeToggle />
          </div>
        </div>

        {likedSongs.length === 0 ? (
          <div className="rounded-2xl border border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No liked songs saved yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
                <tr>
                  <th className="px-4 py-3">Song</th>
                  <th className="px-4 py-3">Artist</th>
                  <th className="px-4 py-3">Link</th>
                </tr>
              </thead>
              <tbody>
                {likedSongs.map((song, index) => {
                  const rowKey = `${song.track_title}-${song.artist}-${song.song_link || index}`;

                  return (
                    <tr key={rowKey} className="border-t border-zinc-300 dark:border-zinc-800">
                      <td className="px-4 py-3">{song.track_title}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{song.artist}</td>
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
        )}
      </div>
    </main>
  );
}