import os
import time
import requests
import pandas as pd
from track_links import track_links

BASE_URL = "https://api.reccobeats.com/v1"
DEFAULT_RATING = 1000
K_FACTOR = 32


def extract_spotify_id(link: str) -> str:
    return link.rstrip("/").split("/")[-1].split("?")[0]


def chunk_list(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def safe_get_json(url, params=None, timeout=20):
    response = requests.get(url, params=params, timeout=timeout)
    response.raise_for_status()
    return response.json()


def expected_score(rating_a, rating_b):
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))


def update_elo(rating_a, rating_b, score_a, score_b, k=K_FACTOR):
    exp_a = expected_score(rating_a, rating_b)
    exp_b = expected_score(rating_b, rating_a)

    new_a = rating_a + k * (score_a - exp_a)
    new_b = rating_b + k * (score_b - exp_b)

    return round(new_a, 2), round(new_b, 2)


def load_existing_dataset(output_path):
    if os.path.exists(output_path):
        df = pd.read_csv(output_path)
        if "rating" not in df.columns:
            df["rating"] = DEFAULT_RATING
        if "comparisons" not in df.columns:
            df["comparisons"] = 0
        return df

    return pd.DataFrame(columns=[
        "track_title",
        "song_link",
        "tempo",
        "energy",
        "danceability",
        "acousticness",
        "valence",
        "loudness",
        "rating",
        "comparisons",
    ])


def already_saved(df_existing, song_link):
    if df_existing.empty:
        return False
    return song_link in df_existing["song_link"].values


def get_tracks_from_spotify_ids(spotify_ids):
    all_tracks = []

    for chunk in chunk_list(spotify_ids, 20):
        ids_param = ",".join(chunk)
        print(f"Requesting track batch of {len(chunk)}...")

        try:
            data = safe_get_json(f"{BASE_URL}/track", params={"ids": ids_param})
            tracks = data.get("content") or data.get("data") or data

            if isinstance(tracks, list):
                all_tracks.extend(tracks)
            else:
                print("Unexpected track response format:", data)

        except Exception as e:
            print(f"Track batch failed: {e}")

        time.sleep(0.25)

    return all_tracks


def choose_comparison_song(df_existing):
    if df_existing.empty:
        return None
    median_rating = df_existing["rating"].median()
    return df_existing.iloc[(df_existing["rating"] - median_rating).abs().argsort()].iloc[0]


def prompt_preference(new_title, new_artist, old_title, old_artist):
    print("\nWhich song do you prefer?")
    print(f"0 = NEW song:   {new_title} - {new_artist}")
    print(f"1 = SAVED song: {old_title} - {old_artist}")
    print("2 = Tie")
    print("3 = Skip")

    while True:
        choice = input("Enter 0, 1, 2, or 3: ").strip()
        if choice in {"0", "1", "2", "3"}:
            return int(choice)
        print("Invalid input. Enter 0, 1, 2, or 3.")


def get_audio_features_for_tracks(tracks, df_existing):
    updated_df = df_existing.copy()

    for i, track in enumerate(tracks, start=1):
        track_id = track.get("id")
        title = track.get("trackTitle") or track.get("title") or track.get("name") or "Unknown"
        new_artist = (
            track.get("artists", [{}])[0].get("name")
            if track.get("artists")
            else "Unknown Artist"
        )
        spotify_href = track.get("href") or track.get("spotifyHref") or track.get("spotifyUrl") or ""

        if not track_id or not spotify_href:
            print(f"Skipping malformed track: {title}")
            continue

        if already_saved(updated_df, spotify_href):
            print(f"Already rated: {title}")
            continue

        print(f"\n[{i}/{len(tracks)}] New song found: {title} - {new_artist}")

        try:
            data = safe_get_json(f"{BASE_URL}/track/{track_id}/audio-features")
            features = data.get("content") or data.get("data") or data
        except Exception as e:
            print(f"Failed to get audio features for {title}: {e}")
            continue

        comparison_song = choose_comparison_song(updated_df)

        if comparison_song is None:
            print(f"No saved songs yet. Adding '{title}' with default rating {DEFAULT_RATING}.")
            new_row = {
                "track_title": title,
                "artist": new_artist,
                "song_link": spotify_href,
                "tempo": features.get("tempo"),
                "energy": features.get("energy"),
                "danceability": features.get("danceability"),
                "acousticness": features.get("acousticness"),
                "valence": features.get("valence"),
                "loudness": features.get("loudness"),
                "rating": DEFAULT_RATING,
                "comparisons": 0,
            }
            updated_df = pd.concat([updated_df, pd.DataFrame([new_row])], ignore_index=True)
            continue

        old_title = comparison_song["track_title"]
        old_rating = float(comparison_song["rating"])
        old_artist = comparison_song["artist"] if "artist" in comparison_song else "Unknown Artist"
        
        choice = prompt_preference(title, new_artist, old_title, old_artist)

        if choice == 3:
            print("Skipped.")
            continue

        new_rating = DEFAULT_RATING

        if choice == 0:
            new_rating, updated_old_rating = update_elo(new_rating, old_rating, 1, 0)
        elif choice == 1:
            new_rating, updated_old_rating = update_elo(new_rating, old_rating, 0, 1)
        else:
            new_rating, updated_old_rating = update_elo(new_rating, old_rating, 0.5, 0.5)

        old_index = updated_df[updated_df["song_link"] == comparison_song["song_link"]].index[0]
        updated_df.at[old_index, "rating"] = updated_old_rating
        updated_df.at[old_index, "comparisons"] = int(updated_df.at[old_index, "comparisons"]) + 1

        new_row = {
            "track_title": title,
            "artist": new_artist,
            "song_link": spotify_href,
            "tempo": features.get("tempo"),
            "energy": features.get("energy"),
            "danceability": features.get("danceability"),
            "acousticness": features.get("acousticness"),
            "valence": features.get("valence"),
            "loudness": features.get("loudness"),
            "rating": new_rating,
            "comparisons": 1,
        }

        updated_df = pd.concat([updated_df, pd.DataFrame([new_row])], ignore_index=True)
        time.sleep(0.2)

    return updated_df


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base_dir, "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "song_ratings.csv")

    df_existing = load_existing_dataset(output_path)

    spotify_ids = [extract_spotify_id(link) for link in track_links]
    print(f"Loaded {len(spotify_ids)} track links.")

    tracks = get_tracks_from_spotify_ids(spotify_ids)
    print(f"Resolved {len(tracks)} tracks.")

    updated_df = get_audio_features_for_tracks(tracks, df_existing)
    updated_df.to_csv(output_path, index=False)

    print("\nSaved ratings to:")
    print(output_path)

    if not updated_df.empty:
        print("\nTop rated songs:\n")

        top_songs = updated_df.sort_values(by="rating", ascending=False).head(10).copy()

        # 🔥 Normalize ratings to 0–100
        min_rating = updated_df["rating"].min()
        max_rating = updated_df["rating"].max()

        if max_rating != min_rating:
            top_songs["Score"] = ((top_songs["rating"] - min_rating) / (max_rating - min_rating)) * 100
        else:
            top_songs["Score"] = 100  # all same rating edge case

        # Round nicely
        top_songs["Score"] = top_songs["Score"].round(1)

        # Ranking labels
        def get_suffix(i):
            if i == 1:
                return "st"
            elif i == 2:
                return "nd"
            elif i == 3:
                return "rd"
            else:
                return "th"

        top_songs["Rank"] = [
            f"{i}{get_suffix(i)}" for i in range(1, len(top_songs) + 1)
        ]

        # Display table
        table = top_songs[["Rank", "track_title", "artist", "Score", "comparisons"]]
        table.columns = ["Place", "Song", "Artist", "Score (/100)", "Comparisons"]

        print(table.to_string(index=False))


if __name__ == "__main__":
    main()