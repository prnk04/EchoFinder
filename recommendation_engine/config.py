# # config.py
import os

# from dotenv import load_dotenv

# load_dotenv()

# # Option 1 — Hardcode for now (simple)
# USE_SAMPLE_DATA = True  # Change to False when deploying live

# # Option 2 — Better for deployment (uses environment variable)
# USE_SAMPLE_DATA = os.getenv("USE_SAMPLE_DATA", "True").lower() == "true"

# # MongoDB settings (used only in live mode)
# MONGO_URI = os.getenv("MONGO_URI", "")
# MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "echofinder")

# # Path for sample CSVs (used only in demo mode)
# SAMPLE_TRACKS_PATH = "data/tracks_sample.csv"
# SAMPLE_EMBEDDINGS_PATH = "data/embeddings_sample.csv"


from fastapi import FastAPI

# from pydantic_settings import BaseSettings
from pydantic_settings import BaseSettings, SettingsConfigDict

# ... rest of your code

DOTENV = os.path.join(os.path.dirname(__file__), ".env")


class Settings(BaseSettings):

    model_config = SettingsConfigDict(env_file=DOTENV)

    # For demo mode
    USE_SAMPLE_DATA: bool
    MONGO_URI: str
    MONGO_DB_NAME: str

    SAMPLE_TRACKS_PATH: str
    SAMPLE_EMBEDDINGS_PATH: str
    SAMPLE_USER_SONG_INTERACTION_PATH: str
    SAMPLE_USER_FAV_ARTIST_PATH: str
    SAMPLE_USER_FAV_GENRES_PATH: str


settings = Settings()
