"""This piece of code will fetch tracks from the csv file: tracks_data_final.csv and insert the tracks details in the database"""

import logging
import time
import pandas as pd
from pymongo import UpdateMany
import regex as re
import numpy as np
from sklearn.preprocessing import MinMaxScaler


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Tracks:

    def __init__(self, path, tracks_collection):
        self.path = path
        self.tracks_collection = tracks_collection

    def modifyArtist(self, artist):
        artist_list = re.split(r"\s+feat\.?\s+", artist, flags=re.IGNORECASE)
        toReturn = list()

        for i in artist_list:
            toReturn.append({"name": i, "spotify_id": ""})

        return toReturn

    def load_dataframe(self):
        tracks_dataframe = pd.read_csv(self.path)

        columns_list = tracks_dataframe.columns

        if "user_id" in columns_list:
            tracks_dataframe.drop(columns=["user_id"], inplace=True)

        if "play_count" in columns_list:
            tracks_dataframe.drop(columns=["play_count"], inplace=True)

        tracks_dataframe.drop_duplicates(keep="first", inplace=True)

        tracks_dataframe.reset_index(drop=True)

        tracks_dataframe["artists"] = tracks_dataframe["artist_name"].apply(
            lambda x: self.modifyArtist(x)
        )
        tracks_dataframe.drop(columns=["artist_name"], inplace=True)

        tracks_dataframe["all_tags"] = tracks_dataframe["all_tags"].str.replace(
            "_", ","
        )

        if "spotify_id" not in columns_list:
            tracks_dataframe["spotify_id"] = ""

        if "lastfm_id" not in columns_list:
            tracks_dataframe["lastfm_id"] = ""

        if "wiki_summary" not in columns_list:
            tracks_dataframe["wiki_summary"] = ""

        if "source" not in columns_list:
            tracks_dataframe["source"] = "msd"

        if "embeddingsStatus" not in columns_list:
            tracks_dataframe["embeddingsStatus"] = "pending"

        default_values = {"url": "", "height": 0, "width": 0}
        tracks_dataframe["image"] = [
            default_values.copy() for _ in range(len(tracks_dataframe))
        ]

        self.tracks_df = tracks_dataframe.copy(deep=True)

    def updatePopularity(self):
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
            self.tracks_df["year"].values.reshape(-1, 1)
        )
        duration_normalized = mnmx_scaler.fit_transform(self.tracks_df[["duration"]])
        total_play_counts_normalized = mnmx_scaler.fit_transform(
            self.tracks_df[["total_play_counts"]]
        )
        total_listeners_count_normalized = mnmx_scaler.fit_transform(
            self.tracks_df[["total_listeners_counts"]]
        )
        spotify_popularity_score_normalized = (
            self.tracks_df["spotify_popularity"] / 100
        ).values.reshape(-1, 1)

        # --- Define weights for combining features ---
        w_play = 0.55
        w_listeners = 0.30
        w_listeners_1 = 0.35
        w_spotify = 0.15

        # --- Mask for songs needing an update ---
        mask = (self.tracks_df["popularity_score"].isna()) | (
            self.tracks_df["popularity_score"] <= 0
        )

        if mask.any():
            subset = self.tracks_df.loc[mask]

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
            self.tracks_df.loc[mask, "popularity_score"] = popularity_new.flatten()

    def insertInDatabase(self):
        start_time = time.perf_counter()
        try:
            logger.info("Starting db uopdate")

            bulk_request = []

            df_dict = self.tracks_df.to_dict(orient="records")
            print(len(df_dict))
            for t in df_dict:
                bulk_request.append(
                    UpdateMany({"song_id": t["song_id"]}, {"$set": t}, upsert=True)
                )

            res = self.tracks_collection.bulk_write(bulk_request)
            self.res = res

            # print(res)
            elapsed = time.perf_counter() - start_time
            print("finished: ", elapsed)
            pass
        except Exception as e:
            print("Exception while trying to update database with tracks: ", e)

    def start(self):
        self.load_dataframe()
        print("dataframe loaded")
        self.updatePopularity()
        print("popularity updated")
        self.insertInDatabase()
        print("inserted")
