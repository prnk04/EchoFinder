import os
from typing import List, Union
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import pickle as pkl
import pandas as pd
from datetime import datetime
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from contextlib import asynccontextmanager
from server.database.db import MongoConnect

from server.database.insertTracks import Tracks
from server.database.insertEmbeddings import EmbeddingsOps
from server.database.createEmbeddingForSong import SingleSongEmbedding
from server.recommender.recommendSongsForUser import Recommender

import os
from .config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):

    app.state.use_sample_data = settings.USE_SAMPLE_DATA

    if settings.USE_SAMPLE_DATA == True:
        app.state.embeddings_with_songs = pd.read_json(settings.SAMPLE_EMBEDDINGS_PATH)
        app.state.mongo_client = None
        app.state.tracks_collection = pd.read_json(settings.SAMPLE_TRACKS_PATH)
        app.state.embeddings_collection = pd.read_json(settings.SAMPLE_EMBEDDINGS_PATH)
        app.state.user_fav_artist_collection = pd.read_csv(
            settings.SAMPLE_USER_FAV_ARTIST_PATH
        )
        app.state.user_fav_genre_collection = pd.read_json(
            settings.SAMPLE_USER_FAV_GENRES_PATH
        )
        app.state.user_song_interaction_collection = pd.read_csv(
            settings.SAMPLE_USER_SONG_INTERACTION_PATH
        )

        print("Using sample data for recommendations")
    else:
        # Connect to mongo db on startup
        mongo_client = MongoConnect().connect(settings.MONGO_URI)
        db = mongo_client["EchoFinder"]
        embeddings_collection = db["songs_embeddings"]
        tracks_collection = db["trackdetails"]
        user_fav_artist_collection = db["userfavartists"]
        user_fav_genre_collection = db["userfavgenres"]
        user_song_interaction_collection = db["usersonginteractions"]

        app.state.embeddings_with_songs = embeddings_collection.find().to_list()
        app.state.mongo_client = mongo_client
        app.state.tracks_collection = tracks_collection
        app.state.embeddings_collection = embeddings_collection
        app.state.embeddings_collection = embeddings_collection
        app.state.user_fav_artist_collection = user_fav_artist_collection
        app.state.user_fav_genre_collection = user_fav_genre_collection
        app.state.user_song_interaction_collection = user_song_interaction_collection

        print("MongoDB connection initialized.")

    embeddingModel = None
    with open(settings.EMBEDDINGS_MODEL, "rb") as f:
        embeddingModel = pkl.load(f)

    app.state.embeddingModel = embeddingModel
    print("embeddings model loadedd")

    yield  # Let FastAPI run the app

    # Shutdown logic (optional)
    if mongo_client:
        mongo_client.close()
        print("MongoDB connection closed.")


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your mobile IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/healthCheck")
def healthCheck():
    return {"health": "ok"}


@app.post("/updateEmbeddings")
def updateEmbeddings(trackId: str, request: Request, background_tasks: BackgroundTasks):
    try:
        print("I have been asked to update embeddings for: ", trackId)

        em_song = SingleSongEmbedding(
            trackId,
            request.app.state.tracks_collection,
            request.app.state.embeddings_collection,
            request.app.state.embeddingModel,
        )

        background_tasks.add_task(em_song.start)

        return {"message": "Embedding update scheduled"}
    except Exception as e:
        print("Error while updating embeddings: ", e)
        return {"message": "Embedding update schedule failed"}


@app.get("/updateTracksDb")
def updateTracksDb(request: Request):
    try:
        print("trying to update tracks database")
        tracks = Tracks(
            "data/processed/tracks_data_final.csv",
            request.app.state.tracks_collection,
        )

        tracks.start()
    except Exception as e:
        print("exception while insretinmg tracks in database: ", e)


@app.get("/updateEmbeddingsDb")
def updateEmbeddingsDb(forceUpdate: str, request: Request):
    try:
        print("trying to update embeddings database")
        embeddings = EmbeddingsOps(
            request.app.state.embeddings_collection,
            request.app.state.tracks_collection,
            request.app.state.embeddingModel,
            forceUpdate,
        )

        embeddings.start()
        return {"status": "done"}
    except Exception as e:
        print("exception while insretinmg embeddings in database: ", e)


@app.get("/user/recommendSongs")
def getRecommendations(userId: str, request: Request):
    res = None
    print("WIll try to provide recommendations for: ", userId)
    try:
        rec_class = Recommender(
            userId,
            request.app.state.tracks_collection,
            request.app.state.embeddings_collection,
            request.app.state.embeddingModel,
            request.app.state.user_fav_artist_collection,
            request.app.state.user_fav_genre_collection,
            request.app.state.user_song_interaction_collection,
            request.app.state.use_sample_data,
        )

        rec_ids = rec_class.start()
        res = rec_class.recommendations

        return {
            "top_songs": res[
                [
                    "song_id",
                    "sim_score",
                    "bonus_score",
                    "final_score",
                    "popularity_score",
                    "release",
                    "spotify_id",
                    "spotify_popularity",
                    "title",
                    "artistsName",
                    "_id",
                    "image",
                ]
            ].to_dict(orient="records")
        }
    except Exception as e:
        print("exception while providing recommendations: ", e)
        if res != None:
            JSONResponse(
                content={
                    "top_songs": jsonable_encoder(
                        res[
                            [
                                "song_id",
                                "sim_score",
                                "bonus_score",
                                "final_score",
                                "popularity_score",
                                "release",
                                "spotify_id",
                                "spotify_popularity",
                                "title",
                                "wiki_summary",
                                "year",
                            ]
                        ].to_dict(orient="records")
                    )
                }
            )
        else:
            return {"error": "Internal Server Error"}


# To run: uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
