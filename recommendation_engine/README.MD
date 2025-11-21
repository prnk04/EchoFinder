# EchoFinder Music Recommendation System

A content-based music recommendation engine for the EchoFinder ecosystem, powered by semantic embeddings and user interaction analysis.

## Overview

This recommendation system is the core intelligence behind EchoFinder's personalized music discovery. It leverages semantic embeddings generated from track metadata to deliver contextually relevant song recommendations based on user listening history, favorite artists, and preferred genres.

## EchoFinder Ecosystem

This recommendation system is part of the larger EchoFinder music application:

- **Mobile Frontend** - User-facing mobile application
- **Express Server** - Serves the frontend and integrates with external music APIs (Spotify, Last.fm, Billboard)
- **Recommendation System** (this repository) - Handles all recommendation logic and embedding management
- **MongoDB** - Centralized data storage for tracks, user interactions, and embeddings

## Features

- **Content-Based Recommendations** - Uses semantic similarity between songs based on rich metadata
- **Multi-Source User Analysis** - Considers user's likeness of a song, favorite artists, and preferred genres
- **Semantic Embeddings** - Leverages Sentence Transformers for meaningful track representations
- **Dynamic Embedding Updates** - Endpoints to refresh embeddings for single or all tracks
- **Scalable Architecture** - Handles large-scale music datasets efficiently
- **Pre-computed Model Storage** - Reuses trained embedding model for consistent new song processing

## Tech Stack

- **API Framework**: FastAPI
- **Database**: MongoDB
- **ML/Processing**:
  - pandas
  - numpy
  - Sentence Transformers (Hugging Face)
  - scikit-learn (cosine_similarity)
  - pickle (model serialization)
- **Configuration**: Pydantic Settings (environment variable management)
- **Language**: Python 3.8+

## Data Sources

The system utilizes a comprehensive dataset compiled from multiple sources:

- **Million Song Dataset** - Large-scale music metadata collection
- **Taste Profile Subset** - User listening patterns and preferences
- **Spotify API** - Track popularity and metadata
- **Last.fm API** - Play counts and listener statistics
- **Billboard Charts** - Trending songs and chart positions

**Note**: The data cleaning, EDA, and dataset building processes were performed separately and are not included in this repository.

### Dataset Information

The full dataset contains **30,000+ tracks** with complete metadata and pre-computed embeddings. However, for demonstration and ease of setup, this repository includes sample data files with **~2,000 tracks**. This smaller dataset allows you to:

- Quickly set up and test the recommendation system
- Understand the data structure and API responses
- Experiment with the embedding generation process
- Validate the recommendation algorithm without requiring extensive computational resources

## How It Works

### 1. Embedding Generation

Track embeddings are created from rich metadata including:

- Title
- Album name
- Artist(s)
- Release year
- Tags/genres
- Wikipedia summary
- Spotify popularity score
- Total listener count
- Total play count

These features are concatenated and processed through a Sentence Transformer model to generate high-dimensional semantic embeddings, which are stored in MongoDB.

### 2. Recommendation Process

When a user requests recommendations:

1. **User Profile Analysis** - The system queries MongoDB collections to gather:

   - Songs the user has liked
   - Songs by artists the user follows/likes
   - Songs from genres the user prefers

2. **Similarity Calculation** - User profile song embeddings are compared against all other track embeddings using cosine similarity

3. **Ranking & Filtering** - Songs are ranked by similarity score and returned as recommendations

### 3. Model Persistence

The Sentence Transformer model is serialized using pickle, ensuring:

- Consistent embeddings for new songs
- Fast inference without retraining
- Version control for the embedding model

## Installation

### Prerequisites

- Python 3.8 or higher
- MongoDB instance (local or cloud)
- pip package manager
- Virtual environment (recommended)

### Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/echofinder-recommendation-system.git
cd echofinder-recommendation-system
```

2. Create and activate virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your MongoDB connection string and other settings
```

Example `.env` file:

```env
USE_SAMPLE_DATA=True
MONGODB_URI=mongodb://localhost:27017/
MONGO_DB_NAME=echofinder
SAMPLE_TRACKS_PATH = "server/data/processed/EchoFinder.trackdetails.json"
SAMPLE_EMBEDDINGS_PATH = "server/data/processed/EchoFinder.songEmbeddings.json"
SAMPLE_USER_SONG_INTERACTION_PATH="server/data/processed/EchoFinder.usersonginteractions.csv"
SAMPLE_USER_FAV_ARTIST_PATH= "server/data/processed/EchoFinder.userfavartists.csv"
SAMPLE_USER_FAV_GENRES_PATH="server/data/processed/EchoFinder.userfavgenres.json"

```

5. Ensure MongoDB is running and accessible

## Usage

### Starting the API Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API documentation available at: `http://localhost:8000/docs`

### API Endpoints

#### Get Recommendations for User

```http
GET /api/recommendations/{user_id}
```

**Parameters:**

- `user_id` (path) - Unique user identifier

**Response:**

```json
{
  "user_id": "12345",
  "recommendations": [
    {
      "track_id": "abc123",
      "title": "Song Title",
      "artist": "Artist Name",
      "similarity_score": 0.87
      ...
    }
  ]
}
```

#### Update Single Song Embedding

```http
POST /updateEmbeddings/{track_id}
```

Regenerates embedding for a specific track using the latest metadata.

#### Update All Embeddings

```http
POST /updateEmbeddingsDb/{forceUpdate:false}
```

Regenerates embeddings for all tracks in the database. Use with caution on large datasets.

## Algorithm Details

### Content-Based Filtering with Semantic Embeddings

The system uses a pure content-based approach that relies on the semantic similarity between songs:

1. **Feature Extraction** - Multiple metadata fields are combined into a rich textual representation
2. **Embedding Generation** - Sentence Transformer converts text into dense vector representations
3. **Similarity Measurement** - Cosine similarity computes the angle between embedding vectors
4. **Contextual Ranking** - User interaction history provides context for personalized ranking

**Advantages:**

- No cold start problem for new users
- Explainable recommendations based on content similarity
- Works well with rich metadata
- Scales efficiently with pre-computed embeddings

## Development Status

**Current Status**: MVP Complete ✅

The core recommendation engine is functional and integrated with the EchoFinder ecosystem.

## Roadmap

Future enhancements planned for the recommendation system:

- [ ] **Negative Feedback Integration** - Penalize songs that users have explicitly disliked or skipped
- [ ] **Hybrid Recommendation Algorithms** - Incorporate collaborative filtering and popularity-based methods
- [ ] **Feedback Loop System** - Implement continuous learning from user interactions to improve recommendations over time
- [ ] **A/B Testing Framework** - Compare different recommendation strategies
- [ ] **Diversity Controls** - Ensure recommendations span multiple artists and genres

## License

This project is licensed under the MIT License

## Acknowledgments

- Million Song Dataset project
- Hugging Face for Sentence Transformers
- Spotify, Last.fm, and Billboard for music data APIs
- MongoDB for scalable document storage

## Contact

Priyanka Pandey - prnkpandey00@gmail.com
