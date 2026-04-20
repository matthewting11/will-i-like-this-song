import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load dataset
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
file_path = os.path.join(BASE_DIR, "data", "songs.csv")
df = pd.read_csv("data/songs.csv")

# Features and label
features = ["tempo", "energy", "danceability", "acousticness", "valence", "loudness"]
X = df[features]
y = df["like"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)

# Test model
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))

# Predict a new song
new_song = pd.DataFrame([{
    "tempo": 115,
    "energy": 0.7,
    "danceability": 0.6,
    "acousticness": 0.15,
    "valence": 0.55,
    "loudness": -6
}])

prediction = model.predict(new_song)
probability = model.predict_proba(new_song)

like_prob = probability[0][1]

print("\n--- Analysis ---")

if like_prob > 0.75:
    print("You will very likely enjoy this song. It matches your preference for energetic and engaging tracks.")
elif like_prob > 0.6:
    print("You will probably like this song. It has some characteristics that align with your music taste.")
elif like_prob > 0.4:
    print("This song is a borderline match. It has mixed features compared to your usual preferences.")
else:
    print("You are unlikely to enjoy this song. It does not align well with your typical listening patterns.")

importances = model.feature_importances_
top_feature = features[importances.argmax()]

print(f"\nYour music taste is most influenced by: {top_feature}")

print("Prediction (1 = like, 0 = not):", prediction[0])
print("Probability of not liking:", probability[0][0])
print("Probability of liking:", probability[0][1])



import matplotlib.pyplot as plt

importances = model.feature_importances_

plt.bar(features, importances)
plt.title("Which song features matter most to my taste?")
plt.xlabel("Feature")
plt.ylabel("Importance")
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()