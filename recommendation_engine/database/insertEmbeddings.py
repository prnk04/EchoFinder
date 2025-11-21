"""Here, I will get tracks details from database, create their embeddings, and update the database"""

from datetime import datetime
import pandas as pd
import pickle as pkl
import numpy as np
from sklearn.preprocessing import normalize

from pymongo import UpdateOne
from sklearn.preprocessing import MinMaxScaler


class EmbeddingsOps:

    def __init__(
        self, embeddingsCollection, tracksCollection, embeddingModel, forceUpdate
    ):
        self.embeddings_collection = embeddingsCollection
        self.tracks_collection = tracksCollection
        self.embeddingModel = embeddingModel
        self.forceUpdate = forceUpdate

    def getTracksFromDb(self):
        if self.forceUpdate == "true":
            tracks_list = self.tracks_collection.find()
        else:
            tracks_list = self.tracks_collection.find({"embeddingsStatus": "pending"})
        self.tracks_list_df = pd.DataFrame(list(tracks_list))
        print("shape of data: ", self.tracks_list_df.shape)

    def concatenateNames(self, artist):
        print("artist: ", artist)
        artist_names_list = list()
        artist_names = ""
        for i in artist:
            if i.get("name"):
                artist_names_list.append(i["name"])

        artist_names = ",".join(artist_names_list)

        return artist_names

    def sanitizeDataframe(self):
        column_list = self.tracks_list_df.columns
        print("col list: ", column_list)

        if "_id" in column_list:
            self.tracks_list_df.drop(columns=["_id"], inplace=True)

        if "__v" in column_list:
            self.tracks_list_df.drop(columns=["__v"], inplace=True)

        if "updateAt" in column_list:
            self.tracks_list_df.drop(columns=["updatedAt"], inplace=True)

        if "embeddingsStatus" in column_list:
            self.tracks_list_df.drop(columns=["embeddingsStatus"], inplace=True)

        if "source" in column_list:
            self.tracks_list_df.drop(columns=["source"], inplace=True)

        self.tracks_list_df["artists"] = self.tracks_list_df["artists"].apply(
            lambda x: self.concatenateNames(x)
        )

    def createTextualEmbeddings(self):
        textual_data = (
            "Title: "
            + self.tracks_list_df["title"].astype(str)
            + " | Artists: "
            + self.tracks_list_df["artists"].astype(str)
            + " | Album: "
            + self.tracks_list_df["release"].astype(str)
            + " | Tags: "
            + self.tracks_list_df["all_tags"].replace("_", ",").astype(str)
            + " | Wiki_Summary: "
            + self.tracks_list_df["wiki_summary"].astype(str)
        )

        self.textual_embeddings = None

        self.textual_embeddings = self.embeddingModel.encode(textual_data)

    def createNumericalEmbeddings(self):
        """
        Updates the 'popularity_score' column in a tracks DataFrame
        using normalized numerical features (play counts, listeners, Spotify popularity).

        - Only updates rows where popularity_score == 0 or is NaN.
        - Scales relevant columns with MinMaxScaler.
        - Combines multiple signals with weighted sum.
        """

        # self.tracks_list_df = self.tracks_list_df.copy(deep=True)
        mnmx_scaler = MinMaxScaler()

        # --- Normalize relevant numeric columns ---
        years_normalized = mnmx_scaler.fit_transform(
            self.tracks_list_df["year"].values.reshape(-1, 1)
        )
        duration_normalized = mnmx_scaler.fit_transform(
            self.tracks_list_df[["duration"]]
        )
        total_play_counts_normalized = mnmx_scaler.fit_transform(
            self.tracks_list_df[["total_play_counts"]]
        )
        total_listeners_count_normalized = mnmx_scaler.fit_transform(
            self.tracks_list_df[["total_listeners_counts"]]
        )
        spotify_popularity_score_normalized = (
            self.tracks_list_df["spotify_popularity"] / 100
        ).values.reshape(-1, 1)

        # --- Define weights for combining features ---
        w_play = 0.55
        w_listeners = 0.30
        w_listeners_1 = 0.35
        w_spotify = 0.15

        # --- Mask for songs needing an update ---
        # mask = (self.tracks_list_df["popularity_score"].isna()) | (
        #     self.tracks_list_df["popularity_score"]
        #     <= 0 | (self.tracks_list_df["spotify_popularity"] <= 0)
        # )

        mask = (
            (self.tracks_list_df["popularity_score"].isna())
            | (self.tracks_list_df["popularity_score"] <= 0)
            | (self.tracks_list_df["spotify_popularity"] <= 0)
        )

        if mask.any():
            subset = self.tracks_list_df.loc[mask]

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
            self.tracks_list_df.loc[mask, "popularity_score"] = popularity_new.flatten()

        self.tracks_list_df["years_normalized"] = years_normalized
        self.tracks_list_df["duration_normalized"] = duration_normalized
        self.tracks_list_df["total_play_counts_normalized"] = (
            total_play_counts_normalized
        )
        self.tracks_list_df["total_listeners_count_normalized"] = (
            total_listeners_count_normalized
        )
        self.tracks_list_df["spotify_popularity_score_normalized"] = (
            spotify_popularity_score_normalized
        )
        self.tracks_list_df["popularity_normalized"] = mnmx_scaler.fit_transform(
            self.tracks_list_df["popularity_score"].values.reshape(-1, 1)
        )

    def generateEmbeddings(
        self,
    ):
        self.createNumericalEmbeddings()
        self.createTextualEmbeddings()

        numeric_features = (
            self.tracks_list_df[
                [
                    "years_normalized",
                    "duration_normalized",
                    "total_play_counts_normalized",
                    "total_listeners_count_normalized",
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
        #         self.tracks_list_df[["years_normalized"]],
        #         self.tracks_list_df[["duration_normalized"]],
        #         self.tracks_list_df[["total_play_counts_normalized"]],
        #         self.tracks_list_df[["total_listeners_count_normalized"]],
        #         self.tracks_list_df[["popularity_normalized"]],
        #     ),
        #     axis=1,
        # )

        self.embeddings = np.concatenate((textual_norm, numeric_features), axis=1)
        self.embeddings = normalize(self.embeddings)

    def storeEmbeddingsInFile(self):
        self.tracks_list_df[
            ["song_id", "spotify_id", "lastfm_id", "embeddings"]
        ].to_csv(
            "server/data/processed/embeddings_"
            + datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
            + ".csv",
            index=False,
        )
        self.tracks_list_df.drop(columns=["embeddings"]).to_csv(
            "server/data/processed/tracks_data_"
            + datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
            + ".csv",
            index=False,
        )

    def storeEmbeddingsInDatabase(self):
        now = datetime.now()
        formatted_timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

        self.tracks_list_df["updatedAt"] = formatted_timestamp

        ndf = self.tracks_list_df[
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
        # print(res)
        print("finished: ", res)

    def updateTracksWithEmbeddingStatus(self):
        df_dict = self.tracks_list_df.to_dict(orient="records")
        print(len(df_dict))

        bulk_request = []

        for t in df_dict:
            print("t is: ", t)
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
        try:
            print("starting")

            self.getTracksFromDb()

            print("data loaded from db")

            self.sanitizeDataframe()
            print("dataframe sanitized")
            # get the embeddings
            print("concatenating the embeddings")
            self.generateEmbeddings()

            # add embeddings to the dataframe
            print("adding embeddings to the dataframe")
            self.tracks_list_df["embeddings"] = [emb for emb in self.embeddings]

            # store embeddings in the file
            self.storeEmbeddingsInFile()

            print("embeddings stored in file")

            # store embeddings in database
            self.storeEmbeddingsInDatabase()
            print("embeddinsg stored in db")

            # update tracks db for embedding status
            self.updateTracksWithEmbeddingStatus()
        except Exception as e:
            print("Exception in updatingg embeddings: ", e)
