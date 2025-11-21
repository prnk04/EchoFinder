from datetime import datetime
import logging
import time

from pymongo import UpdateMany
import pandas as pd
import numpy as np
import ast

from pymongo import MongoClient

from db import MongoConnect
from pathlib import Path


import asyncio
import regex as re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def updateTracks(tracks_df, tracks_collection):
    print("updating Tracks")

    start_time = time.perf_counter()

    try:
        logger.info("Starting db uopdate")

        bulk_request = []

        df_dict = tracks_df.to_dict(orient="records")
        print(len(df_dict))
        for t in df_dict:
            bulk_request.append(
                UpdateMany({"song_id": t["song_id"]}, {"$set": t}, upsert=True)
            )

        tracks_collection.bulk_write(bulk_request)
        # print(res)
        elapsed = time.perf_counter() - start_time
        print("finished: ", elapsed)
    except Exception as e:
        elapsed = time.perf_counter() - start_time
        print("took ", elapsed)
        print("Error in updating database: ", e)


def handleTracks(df):
    mongo_client = None
    try:
        print("Trying to connect to database")
        mongo_connection = MongoConnect()
        mongo_client = mongo_connection.connect()

        db = mongo_client["EchoFinder"]
        tracks_collection = db["tracks"]
        print("connected with mongo")
        # x = tracks_collection.find_one({'artist_name': 'Bruno Mars'})
        # print("x is: " ,x)

        col_names = df.columns.to_list()

        now = datetime.now()
        formatted_timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

        if "updatedAt" not in col_names:
            df["updatedAt"] = formatted_timestamp

        print("shape: ", df.shape)

        # mongo_connection = MongoConnect()
        # mongo_client = mongo_connection.connect()

        updateTracks(df, tracks_collection)
    except Exception as e:
        print("Error in updating tracks: ", e)
    finally:
        mongo_connection.close()


# def handleTracks(path):
#     mongo_client = None
#     try:
#         print("Trying to connect to database")
#         mongo_connection = MongoConnect()
#         mongo_client = mongo_connection.connect()

#         db = mongo_client["EchoFinder"]
#         tracks_collection = db["tracks"]
#         print("connected with mongo")
#         # x = tracks_collection.find_one({'artist_name': 'Bruno Mars'})
#         # print("x is: " ,x)
#         df = pd.read_csv(path)
#         print("dataframe loaded: ", df.columns)
#         col_names = df.columns.to_list()

#         df.drop(columns=["user_id", "play_count"], inplace=True)
#         df.drop_duplicates(keep="first", inplace=True)
#         df.reset_index(drop=True)

#         if "spotify_id" not in col_names:
#             df["spotify_id"] = ""

#         if "lastfm_id" not in col_names:
#             df["lastfm_id"] = ""

#         if "wiki_summary" not in col_names:
#             df["wiki_summary"] = ""

#         now = datetime.now()
#         formatted_timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

#         if "updated_at" not in col_names:
#             df["updated_at"] = formatted_timestamp

#         print("shape: ", df.shape)

#         # mongo_connection = MongoConnect()
#         # mongo_client = mongo_connection.connect()

#         updateTracks(df, tracks_collection)
#     except Exception as e:
#         print("Error in updating tracks: ", e)
#     finally:
#         mongo_connection.close()


def updateEmbeddings(embeddings_df, mongo_client):
    print("updating Embeddings")
    db = mongo_client["EchoFinder"]
    embeddings_collection = db["songs_embeddings"]

    start_time = time.perf_counter()

    try:
        logger.info("Starting db update")

        bulk_request = []

        now = datetime.now()
        formatted_timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

        ndf = pd.DataFrame(
            {
                "song_id": embeddings_df["song_id"],
                "embeddings": embeddings_df.drop(columns="song_id").apply(
                    lambda row: row.tolist(), axis=1
                ),
                "updaatedAt": formatted_timestamp,
            }
        )
        df_dict = ndf.to_dict(orient="records")
        print(len(df_dict))
        for t in df_dict:
            bulk_request.append(
                UpdateMany({"song_id": t["song_id"]}, {"$set": t}, upsert=True)
            )

        embeddings_collection.bulk_write(bulk_request)
        # print(res)
        elapsed = time.perf_counter() - start_time
        print("finished: ", elapsed)
    except Exception as e:
        elapsed = time.perf_counter() - start_time
        print("took ", elapsed)
        print("Error in updating dataembeddings in database: ", e)


def handleEmbeddings(path):
    try:
        df = pd.read_csv(path)
        logger.info("dataframe loaded")

        print("shape: ", df.shape)

        mongo_connection = MongoConnect()
        mongo_client = mongo_connection.connect()

        updateEmbeddings(df, mongo_client)
        pass
    except Exception as e:
        print("Error in handling embeddings: ", e)


def modifyArtist(artist):
    # print("artist is: ", artist)
    artist_list = re.split(r"\s+feat\.?\s+", artist, flags=re.IGNORECASE)
    # print("artist_list: ", artist_list)
    toReturn = list()

    for i in artist_list:
        toReturn.append({"name": i, "spotify_id": ""})

    return toReturn


def prepareDataFrame(path):
    try:
        df = pd.read_csv(path)
        df.drop(columns=["user_id", "play_count"], inplace=True)
        df.drop_duplicates(keep="first", inplace=True)

        col_names = df.columns.to_list()

        df.reset_index(drop=True)

        # df["artist_name"] = df["artist_name"].apply(
        #     lambda x: re.split(r"\s+feat\.?\s+", x, flags=re.IGNORECASE)
        # )

        # print("trying to do something with artist")

        df["artists"] = df["artist_name"].apply(lambda x: modifyArtist(x))
        df.drop(columns=["artist_name"], inplace=True)

        df["all_tags"] = df["all_tags"].str.replace("_", ",")

        if "spotify_id" not in col_names:
            df["spotify_id"] = ""

        if "lastfm_id" not in col_names:
            df["lastfm_id"] = ""

        if "wiki_summary" not in col_names:
            df["wiki_summary"] = ""

        if "source" not in col_names:
            df["source"] = "msd"

        if "embeddingsStatus" not in col_names:
            df["embeddingsStatus"] = "pending"

        default_values = {"url": "", "height": 0, "width": 0}
        df["image"] = [default_values.copy() for _ in range(len(df))]

        handleTracks(df)

    except Exception as e:
        print("Exception while preparing dataframe: ", e)


async def main():
    logger.info("Inside main")
    current_working_directory = Path.cwd()
    print(current_working_directory)

    # prepareDataFrame(path="server/data/processed/tracks_data_final.csv")

    # handleTracks("server/data/processed/tracks_data_final.csv")
    handleEmbeddings("server/data/processed/song_embeddings.csv")
    # df = pd.read_csv('data/processed/tracks_data_final.csv')
    # logger.info("dataframe loaded")

    # df.drop(columns=['user_id', 'play_count'], inplace=True)
    # df.drop_duplicates(keep='first', inplace=True)
    # df.reset_index(drop=True)

    # print("shape: ", df.shape[0])

    # mongo_connection = MongoConnect()
    # mongo_client = mongo_connection.connect()

    # await updateTracks(df, mongo_client)


if __name__ == "__main__":
    asyncio.run(main())
