import os
import time
import requests
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIKED_PATH = os.path.join(BASE_DIR, "data", "liked_songs.csv")

FEATURES = ["tempo", "energy", "danceability", "acousticness", "valence", "loudness"]
BASE_URL = "https://api.reccobeats.com/v1"


def extract_spotify_id(link: str) -> str:
    return link.rstrip("/").split("/")[-1].split("?")[0]


def chunk_list(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def safe_get_json(url, params=None, timeout=20):
    response = requests.get(url, params=params, timeout=timeout)
    response.raise_for_status()
    return response.json()


def load_liked_songs(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        return pd.DataFrame()

    try:
        return pd.read_csv(path)
    except pd.errors.EmptyDataError:
        return pd.DataFrame()


def validate_columns(df: pd.DataFrame, name: str) -> bool:
    missing = [col for col in FEATURES if col not in df.columns]
    if missing:
        print(f"{name} is missing required columns: {missing}")
        return False
    return True


def prompt_candidate_links():
    print("\nPaste Spotify track links for songs you want recommended from.")
    print("Paste one per line. Type 'done' when finished.\n")

    links = []
    while True:
        user_input = input("> ").strip()
        if user_input.lower() == "done":
            break
        if user_input:
            links.append(user_input)

    return links


def get_candidate_songs_from_links(links):
    rows = []
    spotify_ids = [extract_spotify_id(link) for link in links]

    for chunk in chunk_list(spotify_ids, 20):
        print(f"\nProcessing candidate batch of {len(chunk)} songs...")

        try:
            data = safe_get_json(f"{BASE_URL}/track", params={"ids": ",".join(chunk)})
            tracks = data.get("content") or data.get("data") or data
        except Exception as e:
            print(f"Failed to fetch candidate batch: {e}")
            continue

        if not isinstance(tracks, list):
            print("Unexpected candidate track response format.")
            continue

        for track in tracks:
            try:
                rb_id = track.get("id")
                if not rb_id:
                    continue

                features_data = safe_get_json(f"{BASE_URL}/track/{rb_id}/audio-features")
                features = features_data.get("content") or features_data.get("data") or features_data

                title = track.get("trackTitle") or track.get("title") or track.get("name") or "Unknown"
                artist = (
                    track.get("artists", [{}])[0].get("name")
                    if track.get("artists") else "Unknown"
                )

                song_link = (
                    track.get("href")
                    or track.get("spotifyHref")
                    or track.get("spotifyUrl")
                    or ""
                )

                rows.append({
                    "track_title": title,
                    "artist": artist,
                    "song_link": song_link,
                    "tempo": features.get("tempo"),
                    "energy": features.get("energy"),
                    "danceability": features.get("danceability"),
                    "acousticness": features.get("acousticness"),
                    "valence": features.get("valence"),
                    "loudness": features.get("loudness"),
                })

                print(f"Loaded candidate: {title} - {artist}")

            except Exception as e:
                print(f"Failed candidate track: {e}")

        time.sleep(0.2)

    return pd.DataFrame(rows)


def recommend_from_candidates(liked_df: pd.DataFrame, candidate_df: pd.DataFrame, top_n: int = 10) -> pd.DataFrame:
    liked_profile = liked_df[FEATURES].mean().values.reshape(1, -1)
    candidate_features = candidate_df[FEATURES].copy()

    similarities = cosine_similarity(candidate_features, liked_profile).flatten()
    candidate_df = candidate_df.copy()
    candidate_df["similarity"] = similarities

    # Remove songs already in liked_songs.csv if links are available
    if "song_link" in liked_df.columns and "song_link" in candidate_df.columns:
        liked_links = set(liked_df["song_link"].dropna())
        candidate_df = candidate_df[~candidate_df["song_link"].isin(liked_links)]

    return candidate_df.sort_values(by="similarity", ascending=False).head(top_n)

def prompt_to_add_top_candidates(recommendations: pd.DataFrame, liked_df: pd.DataFrame, liked_path: str):
    if recommendations.empty:
        return liked_df

    num_to_prompt = max(1, int(len(recommendations)))
    top_candidates = recommendations.head(num_to_prompt).copy()

    print(f"\n--- Review Top {num_to_prompt} Candidate Songs ---")

    rows_to_add = []

    for i, row in enumerate(top_candidates.itertuples(index=False), start=1):
        title = getattr(row, "track_title", "Unknown")
        artist = getattr(row, "artist", "Unknown")
        similarity = getattr(row, "similarity", None)
        link = getattr(row, "song_link", "")

        print(f"\n[{i}/{num_to_prompt}]")
        print(f"Song: {title} - {artist}")
        if similarity is not None:
            print(f"Similarity: {similarity:.3f}")
        if link:
            print(f"Link: {link}")

        while True:
            choice = input("Add this song to liked_songs.csv? (y/n): ").strip().lower()
            if choice in {"y", "n"}:
                break
            print("Invalid input. Enter y or n.")

        if choice == "y":
            rows_to_add.append({
                "track_title": row.track_title,
                "artist": row.artist,
                "song_link": row.song_link,
                "tempo": row.tempo,
                "energy": row.energy,
                "danceability": row.danceability,
                "acousticness": row.acousticness,
                "valence": row.valence,
                "loudness": row.loudness,
            })

    if rows_to_add:
        add_df = pd.DataFrame(rows_to_add)

        if not liked_df.empty and "song_link" in liked_df.columns:
            existing_links = set(liked_df["song_link"].dropna())
            add_df = add_df[~add_df["song_link"].isin(existing_links)]

        if not add_df.empty:
            liked_df = pd.concat([liked_df, add_df], ignore_index=True)
            liked_df.to_csv(liked_path, index=False)
            print(f"\nAdded {len(add_df)} song(s) to liked_songs.csv.")
        else:
            print("\nNo new songs were added (all selected songs were already saved).")
    else:
        print("\nNo songs were added to liked_songs.csv.")

    return liked_df


def main():
    liked_df = load_liked_songs(LIKED_PATH)

    if liked_df.empty:
        print("liked_songs.csv is empty or missing.")
        print("Add songs you like first before asking for recommendations.")
        return

    if not validate_columns(liked_df, "liked_songs.csv"):
        return

    print(f"\nLoaded {len(liked_df)} liked songs.")
    print("Your liked songs will be used to build your taste profile.")

    candidate_links = prompt_candidate_links()

    if not candidate_links:
        print("No candidate songs entered. Exiting.")
        return

    candidate_df = get_candidate_songs_from_links(candidate_links)

    if candidate_df.empty:
        print("No candidate songs were loaded successfully.")
        return

    if not validate_columns(candidate_df, "candidate songs"):
        return

    recommendations = recommend_from_candidates(liked_df, candidate_df, top_n=10)

    if recommendations.empty:
        print("No recommendations found.")
        return

    print("\n--- Recommended Songs From Your Candidate Playlist ---")
    display_cols = [col for col in ["track_title", "artist", "similarity"] if col in recommendations.columns]
    print(recommendations[display_cols].to_string(index=False))

    liked_df = prompt_to_add_top_candidates(recommendations, liked_df, LIKED_PATH)

    avg_profile = liked_df[FEATURES].mean()
    top_feature = avg_profile.idxmax()

    print("\n--- Analysis ---")
    print(f"These recommendations were chosen from the playlist you pasted in.")
    print(f"They are the closest matches to your liked songs based on audio features.")
    print(f"Your taste profile is currently most aligned with: {top_feature}.")


if __name__ == "__main__":
    main()