"""Here, for a single song, we will create its embedding"""

from datetime import datetime
import pandas as pd
import numpy as np
from pymongo import UpdateOne
from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import normalize


class SingleSongEmbedding:

    def __init__(self, songId, tracksDb, embeddingsDb, embeddingsModel):
        self.song_id = songId
        self.tracks_collection = tracksDb
        self.embeddings_collection = embeddingsDb
        self.embeddings_model = embeddingsModel
        self.cached_min_max = None
        self.last_cache_update = None

    def loadData(self):
        song_details = self.tracks_collection.find_one({"song_id": self.song_id})
        if song_details:
            track_detail = {
                "song_id": song_details["song_id"],
                "all_tags": song_details["all_tags"],
                "artists": self.concatenateNames(song_details["artists"]),
                "duration": song_details["duration"],
                "popularity_score": song_details["popularity_score"],
                "release": song_details["release"],
                "spotify_popularity": song_details["spotify_popularity"],
                "title": song_details["title"],
                "total_listeners_counts": song_details["total_listeners_counts"],
                "total_play_counts": song_details["total_play_counts"],
                "wiki_summary": song_details["wiki_summary"],
                "year": song_details["year"],
                "spotify_id": song_details["spotify_id"],
                "lastfm_id": song_details["lastfm_id"],
            }

            self.track_df = pd.DataFrame(
                track_detail,
                columns=[
                    "song_id",
                    "all_tags",
                    "artists",
                    "duration",
                    "popularity_score",
                    "release",
                    "spotify_popularity",
                    "title",
                    "total_listeners_counts",
                    "total_play_counts",
                    "wiki_summary",
                    "year",
                    "spotify_id",
                    "lastfm_id",
                ],
                index=[0],
            )

    def get_min_max_from_db(self, force_refresh=False):
        """Fetches current min/max values from DB"""

        if self.cached_min_max and not force_refresh:
            return self.cached_min_max

        numeric_fields = [
            "year",
            "duration",
            "total_play_counts",
            "total_listeners_counts",
        ]
        min_max_values = {}

        for field in numeric_fields:
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "min_val": {"$min": f"${field}"},
                        "max_val": {"$max": f"${field}"},
                    }
                }
            ]
            result = list(self.tracks_collection.aggregate(pipeline))
            if result:
                min_max_values[field] = {
                    "min": result[0]["min_val"],
                    "max": result[0]["max_val"],
                }

        # Update cache + metadata
        self.cached_min_max = min_max_values
        self.last_cache_update = datetime.now()

        return min_max_values

    # --- Embedding Helper ---
    def minmax_scale(self, value, min_val, max_val):
        if min_val == max_val:
            return 0.5
        return (value - min_val) / (max_val - min_val)

    def concatenateNames(self, artist):
        artist_names_list = list()
        artist_names = ""
        for i in artist:
            artist_names_list.append(i["name"])

        artist_names = ",".join(artist_names_list)

        return artist_names

    def sanitizeDataframe(self):
        column_list = self.track_df.columns

        if "_id" in column_list:
            self.track_df.drop(columns=["_id"], inplace=True)

        if "__v" in column_list:
            self.track_df.drop(columns=["__v"], inplace=True)

        if "updateAt" in column_list:
            self.track_df.drop(columns=["updatedAt"], inplace=True)

        if "embeddingsStatus" in column_list:
            self.track_df.drop(columns=["embeddingsStatus"], inplace=True)

        if "source" in column_list:
            self.track_df.drop(columns=["source"], inplace=True)

    def createTextualEmbeddings(self):
        textual_data = (
            "Title: "
            + self.track_df["title"].astype(str).fillna("")
            + " | Artists: "
            + self.track_df["artists"].astype(str).fillna("")
            + " | Album: "
            + self.track_df["release"].astype(str).fillna("")
            + " | Tags: "
            + self.track_df["all_tags"].replace("_", ",").astype(str).fillna("")
            + " | Wiki_Summary: "
            + self.track_df["wiki_summary"].astype(str).fillna("")
        )

        self.textual_embeddings = None

        self.textual_embeddings = self.embeddings_model.encode(textual_data)

    def updatePopularity(self):
        """
        Updates the 'popularity_score' column in a tracks DataFrame
        using normalized numerical features (play counts, listeners, Spotify popularity).

        - Only updates rows where popularity_score == 0 or is NaN.
        - Scales relevant columns with MinMaxScaler.
        - Combines multiple signals with weighted sum.
        """

        # self.track_df = self.track_df.copy(deep=True)
        mnmx_scaler = MinMaxScaler()

        # --- Normalize relevant numeric columns ---

        total_play_counts_normalized = mnmx_scaler.fit_transform(
            self.track_df[["total_play_counts"]]
        )
        total_listeners_count_normalized = mnmx_scaler.fit_transform(
            self.track_df[["total_listeners_counts"]]
        )
        spotify_popularity_score_normalized = (
            self.track_df["spotify_popularity"] / 100
        ).values.reshape(-1, 1)

        # --- Define weights for combining features ---
        w_play = 0.55
        w_listeners = 0.30
        w_listeners_1 = 0.35
        w_spotify = 0.15

        # --- Mask for songs needing an update ---
        # mask = (self.track_df["popularity_score"].isna()) | (
        #     self.track_df["popularity_score"]
        #     <= 0 | (self.track_df["spotify_popularity"] <= 0)
        # )

        mask = (
            (self.track_df["popularity_score"].isna())
            | (self.track_df["popularity_score"] <= 0)
            | (self.track_df["spotify_popularity"] <= 0)
        )

        if mask.any():
            subset = self.track_df.loc[mask]

            # --- Combine weighted components ---
            if (subset["spotify_popularity"] > 0).any():
                # Case: Spotify popularity available
                a = w_play * total_play_counts_normalized[mask]
                b = w_listeners * total_listeners_count_normalized[mask]
                c = w_spotify * spotify_popularity_score_normalized[mask]
                combined = a + b + c
            else:
                # Case: Spotify popularity not available
                a = w_play * total_play_counts_normalized[mask]
                b = w_listeners_1 * total_listeners_count_normalized[mask]
                combined = a + b

            # --- Normalize the combined score ---
            combined_scaled = mnmx_scaler.fit_transform(combined)

            # --- Convert to 1–100 scale ---
            popularity_new = 1 + np.around(99 * combined_scaled)

            # --- Update DataFrame ---
            self.track_df.loc[mask, "popularity_score"] = popularity_new.flatten()

        self.track_df["popularity_normalized"] = mnmx_scaler.fit_transform(
            self.track_df["popularity_score"].values.reshape(-1, 1)
        )

    def generate_embedding_numericals(self):
        """Creates a simple normalized embedding for a song."""
        features = []

        min_max_values = self.get_min_max_from_db()

        for field in [
            "year",
            "duration",
            "total_play_counts",
            "total_listeners_counts",
        ]:
            if field in self.track_df.columns and field in min_max_values:
                val = self.minmax_scale(
                    self.track_df[field],
                    min_max_values[field]["min"],
                    min_max_values[field]["max"],
                )

                self.track_df[field + "_normalized"] = val
            else:
                val = 0.5
            features.append(val)

        # Add relative recency (optional)
        # max_year = min_max_values["year"]["max"]
        # features.append((song_data.get("year", max_year) - max_year) / 10.0)

        # Convert to np array for consistency
        return np.array(features, dtype=np.float32).tolist()

    def generateEmbeddings(
        self,
    ):
        self.updatePopularity()
        self.createTextualEmbeddings()
        x = self.generate_embedding_numericals()

        numeric_features = (
            self.track_df[
                [
                    "year_normalized",
                    "duration_normalized",
                    "total_play_counts_normalized",
                    "total_listeners_counts_normalized",
                    "popularity_normalized",
                ]
            ]
            .fillna(0)
            .values
        )

        textual_norm = normalize(self.textual_embeddings)

        # self.embeddings = np.concatenate(
        #     (
        #         self.textual_embeddings,
        #         self.track_df[["year_normalized"]],
        #         self.track_df[["duration_normalized"]],
        #         self.track_df[["total_play_counts_normalized"]],
        #         self.track_df[["total_listeners_counts_normalized"]],
        #         self.track_df[["popularity_normalized"]],
        #     ),
        #     axis=1,
        # )

        self.embeddings = np.concatenate((textual_norm, numeric_features), axis=1)

        # --- Optional: normalize entire vector to equalize weight ---
        self.embeddings = normalize(self.embeddings)

    def storeEmbeddingsInDatabase(self):
        now = datetime.now()
        formatted_timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

        self.track_df["updatedAt"] = formatted_timestamp

        ndf = self.track_df[
            ["song_id", "spotify_id", "lastfm_id", "embeddings", "updatedAt"]
        ]
        ndf["embeddings"] = ndf["embeddings"].apply(lambda row: row.tolist())

        df_dict = ndf.to_dict(orient="records")
        print(len(df_dict))

        bulk_request = []

        for t in df_dict:
            bulk_request.append(
                UpdateOne({"song_id": t["song_id"]}, {"$set": t}, upsert=True)
            )

        res = self.embeddings_collection.bulk_write(bulk_request)

    def updateTracksWithEmbeddingStatus(self):
        df_dict = self.track_df.to_dict(orient="records")
        print(len(df_dict))

        bulk_request = []

        for t in df_dict:
            bulk_request.append(
                UpdateOne(
                    {"song_id": t["song_id"]},
                    {
                        "$set": {
                            "embeddingsStatus": "done",
                            "popularity_score": t["popularity_score"],
                        }
                    },
                    upsert=True,
                )
            )

        res = self.tracks_collection.bulk_write(bulk_request)
        print("finished tracks: ", res)

    def start(self):
        print("going to start")
        self.loadData()
        self.sanitizeDataframe()
        self.generateEmbeddings()
        print("=======")

        self.track_df["embeddings"] = [emb for emb in self.embeddings]

        self.storeEmbeddingsInDatabase()

        self.updateTracksWithEmbeddingStatus()
