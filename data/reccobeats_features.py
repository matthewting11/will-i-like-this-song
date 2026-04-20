import os
import time
import requests
import pandas as pd

BASE_URL = "https://api.reccobeats.com/v1"

track_links = [
    "https://open.spotify.com/track/6GD1eomgaGT1Epto6Q5eAo",
    "https://open.spotify.com/track/0O6u0VJ46W86TxN9wgyqDj",
    "https://open.spotify.com/track/6xGruZOHLs39ZbVccQTuPZ",
    "https://open.spotify.com/track/1qEmFfgcLObUfQm0j1W2CK",
    "https://open.spotify.com/track/0BCPKOYdS2jbQ8iyB56Zns",
    "https://open.spotify.com/track/10xV5l9nhLvFpR8mqzs0bL",
    "https://open.spotify.com/track/0rKtyWc8bvkriBthvHKY8d",
    "https://open.spotify.com/track/5CtPTzdOkkb8Bhy5JnUYyT",
    "https://open.spotify.com/track/753lkDSNs2u188xbl8Vrnx",
    "https://open.spotify.com/track/3RSNYrTfBFBv4NTRfKNp2M",
    "https://open.spotify.com/track/1r8ZCjfrQxoy2wVaBUbpwg",
    "https://open.spotify.com/track/4LRPiXqCikLlN15c3yImP7",
    "https://open.spotify.com/track/09mEdoA6zrmBPgTEN5qXmN",
    "https://open.spotify.com/track/1R7WcoUBGKJY15HGQxb62G",
    "https://open.spotify.com/track/1BSMpVGWs3v5BZKnAQziAc",
    "https://open.spotify.com/track/1mea3bSkSGXuIRvnydlB5b",
    "https://open.spotify.com/track/1r9xUipOqoNwggBpENDsvJ",
    "https://open.spotify.com/track/00Blm7zeNqgYLPtW6zg8cj",
    "https://open.spotify.com/track/3QPBocWfIcOCdFFvmqn60F",
    "https://open.spotify.com/track/52okn5MNA47tk87PeZJLEL",
    "https://open.spotify.com/track/5rW7qTn83sCKtqBoneJs63",
    "https://open.spotify.com/track/748mdHapucXQri7IAO8yFK",
    "https://open.spotify.com/track/6f5ExP43esnvdKPddwKXJH",
    "https://open.spotify.com/track/4g6zpIxbj9jb8ewGrV1kCE",
    "https://open.spotify.com/track/11pkuDGT8LizrFQk5tmBXj",
    "https://open.spotify.com/track/7nVERWQXlgZRQsYw4fHf3b",
    "https://open.spotify.com/track/1vicAuW47ccp1l5mYmaWi7",
    "https://open.spotify.com/track/37BZB0z9T8Xu7U3e65qxFy",
    "https://open.spotify.com/track/1bj8x3ERN9gSc2NfJIpc76",
    "https://open.spotify.com/track/1h4nOgOv7cMZtjpyJm083Y",
    "https://open.spotify.com/track/52yOf7Ls1u5AO3cFIzQ58m",
    "https://open.spotify.com/track/5p7ujcrUXASCNwRaWNHR1C",
    "https://open.spotify.com/track/3KkXRkHbMCARz0aVfEt68P",
    "https://open.spotify.com/track/70LcF31zb1H0PyJoS1Sx1r",
    "https://open.spotify.com/track/4h9wh7iOZ0GGn8QVp4RAOB",
    "https://open.spotify.com/track/0HqZX76SFLDz2aW8aiqi7G",
    "https://open.spotify.com/track/0DGTcMqvVR7fmBXgiG6jz4",
    "https://open.spotify.com/track/2LBqCSwhJGcFQeTHMVGwy3",
    "https://open.spotify.com/track/4RvWPyQ5RL0ao9LPZeSouE",
    "https://open.spotify.com/track/6xNwKNYZcvgV3XTIwsgNio",
    "https://open.spotify.com/track/3azJifCSqg9fRij2yKIbWz",
    "https://open.spotify.com/track/6ieWL5CLN9WdC875guWtMe",
    "https://open.spotify.com/track/5rurggqwwudn9clMdcchxT",
    "https://open.spotify.com/track/39MK3d3fonIP8Mz9oHCTBB",
    "https://open.spotify.com/track/6wsqVwoiVH2kde4k4KKAFU",
    "https://open.spotify.com/track/5cz1jba7M09O8WNPXCYddx",
    "https://open.spotify.com/track/4qzEjmuz380jeiBJp31oDY",
    "https://open.spotify.com/track/37CoOXIsgF3NzbK1zHZetk",
    "https://open.spotify.com/track/6Qyc6fS4DsZjB2mRW9DsQs",
    "https://open.spotify.com/track/1qPbGZqppFwLwcBC1JQ6Vr",
    "https://open.spotify.com/track/3KiexfmhxHvG5IgAElmTkd",
    "https://open.spotify.com/track/42VsgItocQwOQC3XWZ8JNA",
    "https://open.spotify.com/track/2dHHgzDwk4BJdRwy9uXhTO",
    "https://open.spotify.com/track/0mL82sxCRjrs3br407IdJh",
    "https://open.spotify.com/track/1Qrg8KqiBpW07V7PNxwwwL",
    "https://open.spotify.com/track/567e29TDzLwZwfDuEpGTwo",
    "https://open.spotify.com/track/3GZD6HmiNUhxXYf8Gch723",
    "https://open.spotify.com/track/273QnyCvJB65rScHJ1nPZb",
    "https://open.spotify.com/track/2PWTZV5znjLtZC5T1EVJvL",
    "https://open.spotify.com/track/29lXN1aoaL6HE72BOvknyr",
    "https://open.spotify.com/track/5BI0zQZciyoQfJxsu8CIn9",
    "https://open.spotify.com/track/21jGcNKet2qwijlDFuPiPb",
    "https://open.spotify.com/track/1xK59OXxi2TAAAbmZK0kBL",
    "https://open.spotify.com/track/3AJwUDP919kvQ9QcozQPxg",
    "https://open.spotify.com/track/7fBv7CLKzipRk6EC6TWHOB",
    "https://open.spotify.com/track/0uI7yAKUf52Cn7y3sYyjiX",
    "https://open.spotify.com/track/4xqrdfXkTW4T0RauPLv3WA",
    "https://open.spotify.com/track/5GXAXm5YOmYT0kL5jHvYBt",
    "https://open.spotify.com/track/7KA4W4McWYRpgf0fWsJZWB",
    "https://open.spotify.com/track/0VaeksJaXy5R1nvcTMh3Xk",
    "https://open.spotify.com/track/2plbrEY59IikOBgBGLjaoe",
    "https://open.spotify.com/track/0kn2gu8Pd03DiYHzRvX2Xk",
    "https://open.spotify.com/track/4XsJiRJQAK8TWcZCn0Dxlh",
    "https://open.spotify.com/track/50q2aUjWoTn6CJIfSPRJQA",
    "https://open.spotify.com/track/46IZ0fSY2mpAiktS3KOqds",
    "https://open.spotify.com/track/1jKXjxMWlq4BhH6f9GtZbu",
    "https://open.spotify.com/track/45J4avUb9Ni0bnETYaYFVJ",
    "https://open.spotify.com/track/2cYqizR4lgvp4Qu6IQ3qGN",
    "https://open.spotify.com/track/087ovYl7lMl0QEEQKxbvz8",
    "https://open.spotify.com/track/0luIZaA4wYL4ftOvMAn3nU",
    "https://open.spotify.com/track/10bdqV0CgtHjizrW4rfqAH",
    "https://open.spotify.com/track/6gJ2H930mAD1zRqmoFiE4W",
    "https://open.spotify.com/track/1LLUoftvmTjVNBHZoQyveF",
    "https://open.spotify.com/track/2fwsmT1AbClEwHbujP4ZMr",
    "https://open.spotify.com/track/6xV7Be6XEvkSnighmh2Tzj",
    "https://open.spotify.com/track/4tR1B9oWDnnFPvIrkqgaV2",
    "https://open.spotify.com/track/629DixmZGHc7ILtEntuiWE",
    "https://open.spotify.com/track/54EtRljVVyc9D5lvwNTL2r",
    "https://open.spotify.com/track/5WEJedsg65bDLwmWVBNLr4",
    "https://open.spotify.com/track/7a5Aso4kGutaW1xf0oqmR7",
    "https://open.spotify.com/track/1BOTDhBpGng6H48MLFpXOB",
    "https://open.spotify.com/track/0Mc8og9ZCATdVBQRSEqgGT",
    "https://open.spotify.com/track/2MDCrB2pKaAbLuzXyAK3Pc",
    "https://open.spotify.com/track/48FMzY4iftzW1GYqaWOznr",
    "https://open.spotify.com/track/3hxJFcIi2ZbqrxzcG1zxj6",
    "https://open.spotify.com/track/6t3KycyBzCGvyt9Sp0gTru",
    "https://open.spotify.com/track/6rxo070QhZ3TDAIfPxV6GF"
]

def extract_spotify_id(link: str) -> str:
    return link.rstrip("/").split("/")[-1].split("?")[0]

def chunk_list(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]

def safe_get_json(url, params=None, timeout=20):
    response = requests.get(url, params=params, timeout=timeout)
    response.raise_for_status()
    return response.json()

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

        except requests.HTTPError as e:
            print(f"Track batch failed: {e}")
        except Exception as e:
            print(f"Unexpected error in track batch: {e}")

        time.sleep(0.25)

    return all_tracks

def get_audio_features_for_tracks(tracks):
    rows = []

    for i, track in enumerate(tracks, start=1):
        track_id = track.get("id")

        title = (
            track.get("trackTitle")
            or track.get("title")
            or track.get("name")
            or "Unknown"
        )

        artist = (
            track.get("artists", [{}])[0].get("name")
            if track.get("artists")
            else ""
        )

        spotify_href = (
            track.get("href")
            or track.get("spotifyHref")
            or track.get("spotifyUrl")
            or ""
        )

        if not track_id:
            print(f"Skipping track with no ID: {title}")
            continue

        print(f"\n[{i}/{len(tracks)}]")
        print(f"Song: {title} - {artist}")
        print(f"Link: {spotify_href}")

        # 🔥 USER INPUT
        while True:
            user_input = input("Do you like this song? (1 = yes, 0 = no, s = skip): ").strip()

            if user_input in ["1", "0"]:
                like_value = int(user_input)
                break
            elif user_input.lower() == "s":
                print("Skipped.")
                like_value = None
                break
            else:
                print("Invalid input. Enter 1, 0, or s.")

        if like_value is None:
            continue

        try:
            data = safe_get_json(f"{BASE_URL}/track/{track_id}/audio-features")
            features = data.get("content") or data.get("data") or data

            rows.append({
                "track_title": title,
                "song_link": spotify_href,
                "tempo": features.get("tempo"),
                "energy": features.get("energy"),
                "danceability": features.get("danceability"),
                "acousticness": features.get("acousticness"),
                "valence": features.get("valence"),
                "loudness": features.get("loudness"),
                "like": like_value,
            })

        except Exception as e:
            print(f"Error getting features for {title}: {e}")

        time.sleep(0.2)

    return rows

def main():
    spotify_ids = [extract_spotify_id(link) for link in track_links]
    print(f"Extracted {len(spotify_ids)} Spotify IDs.")

    tracks = get_tracks_from_spotify_ids(spotify_ids)
    print(f"Resolved {len(tracks)} tracks from ReccoBeats.")

    rows = get_audio_features_for_tracks(tracks)
    df = pd.DataFrame(rows)

    if df.empty:
        print("No rows were returned. songs.csv was not created.")
        return

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base_dir, "data")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "songs.csv")
    df.to_csv(output_path, index=False)

    print("\nSaved dataset to:")
    print(output_path)
    print("\nPreview:")
    print(df.head())
    print(f"\nTotal rows saved: {len(df)}")

if __name__ == "__main__":
    main()