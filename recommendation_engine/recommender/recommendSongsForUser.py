import re
import pandas as pd
import numpy as np

from sentence_transformers import SentenceTransformer, util


class MyCustomError(Exception):
    """
    A custom exception for demonstrating custom error handling.
    """

    def __init__(self, message="A custom error occurred."):
        self.message = message
        super().__init__(self.message)


class Recommender:
    def __init__(
        self,
        user_id,
        tracks_colletion,
        embeddings_collection,
        embeddings_model,
        user_fav_artist_collection,
        user_fav_genre_collection,
        user_song_interaction_collection,
        use_sample_data,
    ):
        self.user_id = user_id
        self.tracks_collection = tracks_colletion
        self.embeddings_collection = embeddings_collection
        self.embeddings_model = embeddings_model
        self.user_fav_artist_collection = user_fav_artist_collection
        self.user_fav_genre_collection = user_fav_genre_collection
        self.user_song_interaction_collection = user_song_interaction_collection
        self.use_sample_data = use_sample_data

    # Step 1: for the 3 user databases, check if data is there
    def fetchUserDetails(self):
        try:
            print("going to fetch user details")
            # First, lets see what genres does user like
            user_pref_genres = self.user_fav_genre_collection.find(
                {"user_id": self.user_id}, projection={"_id": False, "fav_genres": True}
            )
            # user_pref_genres_list = list(user_pref_genres)
            user_pref_genres_list = [doc for doc in user_pref_genres]
            print("fav gebnre list: ", user_pref_genres_list)
            if user_pref_genres_list and len(user_pref_genres_list) > 0:
                self.user_pref_genres = user_pref_genres_list[0]["fav_genres"][0].split(
                    ","
                )
            else:
                self.user_pref_genres = list()

            # Second, find user fav artists
            user_pref_artists = self.user_fav_artist_collection.find(
                {"user_id": self.user_id},
                projection={"_id": False, "fav_artist": True},
            )

            # user_pref_artists_list = list(user_pref_artists)
            user_pref_artists_list = [doc for doc in user_pref_artists]

            user_pref_artists_formatted = list()

            if user_pref_artists_list and len(user_pref_artists_list) > 0:
                for pre in user_pref_artists_list:
                    user_pref_artists_formatted.append(pre["fav_artist"])

            self.user_pref_artists = user_pref_artists_formatted

            # Lastly, lets see what songs user has liked
            user_liked_songs = self.user_song_interaction_collection.find(
                # {"rating": {"$gte": 1}},
                projection={"_id": False, "song_id": True}
            )
            # user_liked_songs_list = list(user_liked_songs)
            user_liked_songs_list = [doc for doc in user_liked_songs]

            user_liked_songs_formatted = list()

            if user_liked_songs_list and len(user_liked_songs_list) > 0:
                for song in user_liked_songs_list:
                    user_liked_songs_formatted.append(song["song_id"])

            self.user_liked_songs = user_liked_songs_formatted

            # TODO: later add a logic so that we do not recommend songs taht are not liked by user
        except Exception as e:
            print("Error in fetching user details: ", e)

    # Step 2: For all the data that has been collected for the user, fetch tracks

    def fetchTracksBasedOnUserPref(self):
        try:
            print("going to fetch tracks")
            # build $or conditions
            # conditions = [
            #     {"artists.name": {"$in": self.user_pref_artists}},
            #     {
            #         "all_tags": {
            #             "$regex": "|".join(
            #                 [re.escape(tag) for tag in self.user_pref_genres]
            #             ),
            #             "$options": "i",
            #         }
            #     },
            #     {"song_id": {"$in": self.user_liked_songs}},
            # ]

            conditions = [
                {"artists.name": {"$in": self.user_pref_artists}},
                {"all_tags": {"$in": self.user_pref_genres}},
                {"song_id": {"$in": self.user_liked_songs}},
            ]
            # final query
            query = {"$or": conditions}

            candidate_tracks_artists = self.tracks_collection.find(
                {"artists.name": {"$in": self.user_pref_artists}}
            )
            candidate_tracks_list_artists = list(candidate_tracks_artists)

            print(
                "candidate tracks based on preferred artist: ",
                len(candidate_tracks_list_artists),
            )

            candidate_tracks_genres = []
            if self.user_pref_genres:
                candidate_tracks_genres = self.tracks_collection.find(
                    {
                        "$or": [
                            {"all_tags": {"$regex": tag}}
                            for tag in self.user_pref_genres
                        ]
                    }
                )
            candidate_tracks_genres_list = list(candidate_tracks_genres)

            candidate_tracks_tracks = self.tracks_collection.find(
                {"song_id": {"$in": self.user_liked_songs}}
            )
            candidate_tracks_list = list(candidate_tracks_tracks)

            df1 = pd.DataFrame(candidate_tracks_list_artists)
            df2 = pd.DataFrame(candidate_tracks_genres_list)
            df3 = pd.DataFrame(candidate_tracks_list)

            df1["type"] = "fav_artists"
            df2["type"] = "fav_genres"
            df3["type"] = "liked_songs"

            candidate_tracks_df = pd.concat([df1, df2, df3], axis=0)
            print("shape: ", candidate_tracks_df.shape)
            if candidate_tracks_df.shape[0] == 0:
                raise MyCustomError("Empty dataframe")

            column_list = candidate_tracks_df.columns

            if "_id" in column_list:
                candidate_tracks_df.drop(columns=["_id"], inplace=True)

            if "__v" in column_list:
                candidate_tracks_df.drop(columns=["__v"], inplace=True)

            print("top tracks columns: ", candidate_tracks_df.columns)
            self.requested_song_ids = candidate_tracks_df["song_id"].values

            self.top_tracks = candidate_tracks_df

        except Exception as e:
            print("error in fetching tracks based on user pref: ", e)
            raise

    def checkArtistName(self, aristName_array):
        aristsName = [artist["name"] for artist in aristName_array]
        set1 = set(aristsName)
        set2 = set(self.user_liked_artists["fav_artist"].to_list())
        # print(set1.intersection(set2))
        if len(set1.intersection(set2)) > 0:
            return True
        else:
            return False

    def checkGenres(self, genres_list):
        set1 = set([x.lower().strip() for x in genres_list.split(",")])
        set2 = set(
            [
                x.lower().strip()
                for x in self.user_liked_genres["fav_genres"].values.tolist()[0]
            ]
        )

        if len(set1.intersection(set2)) > 0:
            return True
        else:
            return False

    def prepareDataForSample(self):
        try:

            print("inside sample")
            user_liked_songs = self.user_song_interaction_collection[
                self.user_song_interaction_collection["user_id"] == self.user_id
            ]
            self.user_liked_artists = self.user_fav_artist_collection[
                self.user_fav_artist_collection["user_id"] == self.user_id
            ]
            self.user_liked_genres = self.user_fav_genre_collection[
                self.user_fav_genre_collection["user_id"] == self.user_id
            ]

            user_liked_tracks_details = self.tracks_collection[
                self.tracks_collection["song_id"].isin(user_liked_songs["song_id"])
            ]
            tracks_for_artists = self.tracks_collection[
                self.tracks_collection["artists"].apply(self.checkArtistName)
            ]
            tracks_for_genres = self.tracks_collection[
                self.tracks_collection.dropna(subset="all_tags")["all_tags"].apply(
                    self.checkGenres
                )
            ]

            user_liked_tracks_details["type"] = "liked_songs"
            tracks_for_artists["type"] = "fav_artists"
            tracks_for_genres["type"] = "fav_genres"

            candidate_tracks_df = pd.concat(
                [tracks_for_artists, tracks_for_genres, user_liked_tracks_details],
                axis=0,
            )
            column_list = candidate_tracks_df.columns
            if "_id" in column_list:
                candidate_tracks_df.drop(columns=["_id"], inplace=True)

            if "__v" in column_list:
                candidate_tracks_df.drop(columns=["__v"], inplace=True)

            print("top tracks columns: ", candidate_tracks_df.columns)
            self.requested_song_ids = candidate_tracks_df["song_id"].values
            print("requested ids: ", self.requested_song_ids)

            print("candaidate:\n ", candidate_tracks_df)

            self.top_tracks = candidate_tracks_df
        except Exception as e:
            print("exception for sample: ", e)

    def safe_mean(self, vectors, dim=389):
        if len(vectors) == 0:
            return np.zeros((dim,))
        vec = np.mean(vectors, axis=0)
        return np.nan_to_num(vec, nan=0.0)

    def getAllEmbeddings(self):

        if self.use_sample_data == True:
            all_embeddings_df = self.embeddings_collection
        else:
            all_embeddings_cursor = self.embeddings_collection.find()
            all_embeddings_list = list(all_embeddings_cursor)
            # print("All embeddings list: ", all_embeddings_list)

            all_embeddings_df = pd.DataFrame(all_embeddings_list)

        # print("all embeddings df: ", all_embeddings_df.head())
        print("all embeddings column: ", all_embeddings_df.columns)

        column_list = all_embeddings_df.columns

        if "_id" in column_list:
            all_embeddings_df.drop(columns=["_id"], inplace=True)

        # print("all embeddings column: ", all_embeddings_df.columns)

        # print("and re: ", self.requested_song_ids)

        requested_embeddings = all_embeddings_df[
            all_embeddings_df["song_id"].isin(self.requested_song_ids)
        ]
        print("requested: ", requested_embeddings.shape)

        self.all_embeddings = all_embeddings_df
        self.requested_embeddings = requested_embeddings

        # self.requestedEmbeddings =

    def calculateSimilarity(self):
        try:
            print("will try to calculate similarities")
            # adding logic to add weights to different embeddings

            embeddings_based_on_fav_arists = self.requested_embeddings[
                self.requested_embeddings["song_id"].isin(
                    self.top_tracks[self.top_tracks["type"] == "fav_artists"]["song_id"]
                )
            ]
            print("mebeddings: ", embeddings_based_on_fav_arists)

            embeddings_based_on_fav_genres = self.requested_embeddings[
                self.requested_embeddings["song_id"].isin(
                    self.top_tracks[self.top_tracks["type"] == "fav_genres"]["song_id"]
                )
            ]
            print("mebeddings for fav genre: ", embeddings_based_on_fav_genres.shape)

            embeddings_based_on_liked_tracks = self.requested_embeddings[
                self.requested_embeddings["song_id"].isin(
                    self.top_tracks[self.top_tracks["type"] == "liked_songs"]["song_id"]
                )
            ]
            # print("mebeddings: ", embeddings_based_on_liked_tracks)

            # artist_pref_vec = np.array(
            #     embeddings_based_on_fav_arists["embeddings"].to_list()
            # ).mean(axis=0)

            # print("artist mean: ", artist_pref_vec.shape)

            # if embeddings_based_on_liked_tracks.shape[0] > 0:
            #     liked_pref_vec = np.array(
            #         embeddings_based_on_liked_tracks["embeddings"].to_list()
            #     ).mean(axis=0)
            # else:
            #     liked_pref_vec = np.zeros((389,))

            # genre_pref_vec = np.array(
            #     embeddings_based_on_fav_genres["embeddings"].to_list()
            # ).mean(axis=0)

            artist_pref_vec = self.safe_mean(
                np.array(embeddings_based_on_fav_arists["embeddings"].to_list())
            )
            genre_pref_vec = self.safe_mean(
                np.array(embeddings_based_on_fav_genres["embeddings"].to_list())
            )
            liked_pref_vec = self.safe_mean(
                np.array(embeddings_based_on_liked_tracks["embeddings"].to_list())
            )

            user_pref_embedding = (
                0.5 * liked_pref_vec + 0.3 * artist_pref_vec + 0.2 * genre_pref_vec
            )
            # print("user pre: ", user_pref_embedding)

            # req_embs = np.vstack(self.requested_embeddings["embeddings"].values)
            all_embs = np.vstack(self.all_embeddings["embeddings"].values)

            print("NaNs in user_pref_embedding:", np.isnan(user_pref_embedding).any())
            print("NaNs in all_embs:", np.isnan(all_embs).any())

            user_pref_embedding = np.nan_to_num(user_pref_embedding, nan=0.0)
            all_embs = np.nan_to_num(all_embs, nan=0.0)

            print("NaNs in user_pref_embedding:", np.isnan(user_pref_embedding).any())
            print("NaNs in all_embs:", np.isnan(all_embs).any())

            # Then compute cosine similarities
            similarities = util.cos_sim(user_pref_embedding, all_embs)
            print("similarities: ", similarities)
            print(similarities.shape)

            # going to modify these sim scores so that we can add bonus score if any song matches multiple criterions
            print(
                "self.all_embeddings.values: ",
                self.all_embeddings["song_id"].values.shape,
            )
            print("similarities.numpy(): ", similarities.numpy().shape)

            # this df contains the similarity score of each song with user pref vector
            sim_df = pd.DataFrame(
                similarities.numpy(),
                columns=self.all_embeddings["song_id"].values,
            )
            sim_df = sim_df.T

            sim_df.reset_index(inplace=True)
            sim_df.rename(columns={"index": "song_id", 0: "sim_score"}, inplace=True)
            print(sim_df.columns)

            print("sim_df: \n", sim_df.head())

            print("calculating bonus")

            # now, craete a column for bonus score and set it to 0
            sim_df["bonus_score"] = 0

            # for each song, if it is in fav genres, add a score of 0.05
            songs_fav_genres = sim_df[
                sim_df["song_id"].isin(
                    self.top_tracks[self.top_tracks["type"] == "fav_genres"]["song_id"]
                )
            ].index.values
            sim_df.loc[songs_fav_genres, "bonus_score"] += 0.05

            print(sim_df["bonus_score"].value_counts())

            # for each song, if it is in fav artists, add a score of 0.1
            songs_fav_artists = sim_df[
                sim_df["song_id"].isin(
                    self.top_tracks[self.top_tracks["type"] == "fav_artists"]["song_id"]
                )
            ].index.values
            sim_df.loc[songs_fav_artists, "bonus_score"] += 0.05

            print(sim_df["bonus_score"].value_counts())

            # for each song, if it is a song that user has already liked, add a bonus score of 0.1

            songs_user_liked = sim_df[
                sim_df["song_id"].isin(
                    self.top_tracks[self.top_tracks["type"] == "liked_songs"]["song_id"]
                )
            ].index.values
            sim_df.loc[songs_user_liked, "bonus_score"] += 0.05

            print(sim_df["bonus_score"].value_counts())

            # adding bonus weight
            sim_df["final_score"] = sim_df["sim_score"] + sim_df["bonus_score"]
            print("sim_df: ", sim_df.head())

            self.sim_df = sim_df

        except Exception as e:
            print("Error occurred while calculating similarity: ", e)

    def fetchSimilarSongs(self):
        try:
            # print("will try to find similar songs")

            # print("similarity indices: ", self.requested_song_ids)
            # similarity_df = pd.DataFrame(
            #     self.similarities.numpy(),
            #     index=self.requested_song_ids,
            #     columns=self.all_embeddings["song_id"].values,
            # )
            # # similarity_df.index = self.requested_song_ids
            # print("similarrity df: ", similarity_df.head())

            # similarity_df.T.to_csv("server/data/interim/similarity_charlie_puth.csv")

            # top_k = 20
            # top_matches = similarity_df.apply(
            #     lambda row: row.nlargest(top_k).index.tolist(), axis=1
            # )

            # self.recommended_ids = set(
            #     [song for sublist in top_matches for song in sublist]
            # )

            self.recommendations = self.sim_df.sort_values(
                "final_score", ascending=False
            ).head(40)
            # print("rec: ", self.recommendations)

        except Exception as e:
            print("Exception while trying to fetch similar songs: ", e)

    def getSimilarSongs(self):
        try:
            print("trying to fetch similar data")

            if self.use_sample_data == True:
                df = self.tracks_collection[
                    self.tracks_collection["song_id"].isin(
                        self.recommendations["song_id"].to_list()
                    )
                ]
            else:
                songs_data = self.tracks_collection.find(
                    {"song_id": {"$in": list(self.recommendations["song_id"])}}
                )
                # print(list(songs_data))
                df = pd.DataFrame(list(songs_data))
            # print("df: ", df)

            x = self.recommendations.merge(df, on="song_id", how="left")
            col_list = x.columns.to_list()
            print(col_list)
            colsToRemove = list()
            if "_id" in col_list:
                # colsToRemove.append("_id")
                x["_id"] = x["_id"].astype("str")
                # colsToRemove.append("_id")

            if "__v" in col_list:
                colsToRemove.append("__v")

            if "updatedAt" in col_list:
                colsToRemove.append("updatedAt")

            if "image" in col_list:
                x["image"] = x["image"].astype("str")

            # if "wiki_summary" in col_list:
            #     colsToRemove.append("wiki_summary")

            if "artistRef" in col_list:
                colsToRemove.append("artistRef")

            x.drop(columns=colsToRemove, inplace=True)
            # x["_id"] = x["_id"].astype("str")

            self.recommendations = x

        except Exception as e:
            print(
                "File: recSongsForUsersexception occurred while getting similar songs: ",
                e,
            )

    def start(self):
        try:
            print("self: ", self.use_sample_data)
            if self.use_sample_data == True:
                self.prepareDataForSample()
            else:
                self.fetchUserDetails()
                self.fetchTracksBasedOnUserPref()
            self.getAllEmbeddings()
            self.calculateSimilarity()
            self.fetchSimilarSongs()
            self.getSimilarSongs()

            return {"recs": "123"}
        except Exception as e:
            print("error occurred in start: ", e)
            raise
            # return {"error: ", type(e)}
