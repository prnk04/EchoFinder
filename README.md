# 🎵 EchoFinder

An end-to-end music discovery platform powered by AI-driven personalized recommendations.

## Overview

EchoFinder is a complete music recommendation ecosystem that combines a React Native mobile app, a Node.js API gateway, and a machine learning recommendation engine to deliver personalized music discovery experiences. The system leverages semantic embeddings and user interaction data to suggest songs that match individual tastes, adapting continuously as users engage with the app.

Built as a comprehensive demonstration of modern full-stack development, EchoFinder showcases the integration of mobile development, backend orchestration, machine learning deployment, and multi-source data aggregation in a production-ready architecture.

## Demo

🎥 **[View Live Demo](https://github.com/prnk04/EchoFinder/blob/main/Demo/Demo.gif)**

## List of Contents

- [Architecture](#Architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Key Features](#key-features)
- [Development Status](#key-features)
- [Further Enhancements](#further-enhancements)
- [Documentation](#documentation)
- [Data & API Credits](#data--api-credits)
- [License](#license)
- [Contact](#contact)

## Architecture

EchoFinder consists of three interconnected services:

```
┌─────────────────────────────────────────────────────────────┐
│                     EchoFinder Ecosystem                     │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │   Mobile App     │
    │  (React Native)  │
    └────────┬─────────┘
             │
             │ REST API
             ▼
    ┌──────────────────┐
    │   API Gateway    │
    │  (Express.js)    │
    └────┬────────┬────┘
         │        │
         │        └──────────────────┐
         │                           │
         │ REST API                  │ External APIs
         ▼                           ▼
┌────────────────────┐    ┌──────────────────────┐
│  Recommendation    │    │  Spotify, Last.fm    │
│     Engine         │    │     Billboard        │
│   (FastAPI + ML)   │    └──────────────────────┘
└────────┬───────────┘
         │
         │ MongoDB
         ▼
    ┌─────────┐
    │ Database│
    └─────────┘
```

### System Components

#### 🎨 Mobile Frontend

**Technology**: React Native + Expo + TypeScript  
**Location**: `/mobile`

The user-facing mobile application providing an intuitive interface for music discovery. Features include trending songs, personalized recommendations, artist exploration, and preference management.

**Key Features:**

- Genre and artist preference selection
- Like/dislike feedback system with undo functionality
- Real-time recommendation updates
- Persistent caching with React Query
- Smooth animations and custom skeleton loaders

#### 🔌 API Gateway

**Technology**: Node.js + Express.js  
**Location**: `/api-gateway`

The central orchestration layer that serves as the single backend entry point for all mobile app requests. Aggregates data from multiple sources and coordinates between the mobile app, external APIs, and the ML recommendation service.

**Key Responsibilities:**

- Serve mobile app requests for tracks, artists, and recommendations
- Fetch metadata from Spotify, Last.fm, and Billboard
- Manage user interactions and preferences in MongoDB
- Communicate with the FastAPI recommendation engine
- Provide rate-limited, CORS-enabled endpoints

#### 🧠 Recommendation Engine

**Technology**: FastAPI + Python + ML  
**Location**: `/recommendation-engine`

The intelligence core of EchoFinder, powered by content-based filtering using semantic embeddings. Generates personalized song recommendations by analyzing track metadata and user interaction patterns.

**Key Features:**

- Semantic embeddings using Sentence Transformers (Hugging Face)
- Content-based similarity matching with cosine similarity
- Multi-factor recommendation based on listening history, favorite artists, and genre preferences
- Dynamic embedding updates for new tracks
- Pre-computed embeddings stored in MongoDB for fast retrieval

## Tech Stack

### Frontend

- React Native with Expo
- TypeScript
- Expo Router (file-based routing)
- React Query (data fetching & caching)
- React Native Paper (UI components)
- React Native Reanimated (animations)
- AsyncStorage (local persistence)

### Backend

- Node.js + Express.js
- MongoDB + Mongoose
- Axios (HTTP client)
- CORS & rate limiting middleware
- dotenv (configuration)

### Machine Learning

- Python 3.8+
- FastAPI (API framework)
- Sentence Transformers (Hugging Face)
- pandas & numpy (data processing)
- scikit-learn (cosine similarity)
- Pydantic Settings (configuration)
- pickle (model serialization)

### Data Sources

- **Million Song Dataset** - Large-scale music metadata
- **Taste Profile Subset** - User listening patterns
- **Spotify API** - Track popularity and metadata
- **Last.fm API** - Play counts and listener statistics
- **Billboard Charts** - Trending songs

### Database

- MongoDB (user data, tracks, embeddings, preferences)

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js 16.x or higher
- Python 3.8 or higher
- MongoDB (local or cloud instance)
- Expo CLI (`npm install -g expo-cli`)
- npm or yarn
- iOS Simulator (macOS) or Android Emulator

### Quick Start

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/echofinder.git
cd echofinder
```

#### 2. Set Up MongoDB

Ensure MongoDB is running locally or use a cloud instance (MongoDB Atlas). Note the connection string for configuration.

#### 3. Set Up the Recommendation Engine

```bash
cd recommendation-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI

# Start the FastAPI server
uvicorn index:app --reload --host 0.0.0.0 --port 8000
```

The recommendation service will be available at `http://localhost:8000`

#### 4. Set Up the API Gateway

```bash
cd ../api-gateway

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with:
# - MongoDB URI
# - FastAPI URL (http://localhost:8000)
# - Spotify API credentials
# - Last.fm API key

# Start the Express server
npm run dev
```

The API gateway will be available at `http://localhost:3000`

#### 5. Set Up the Mobile App

```bash
cd ../mobile

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with API Gateway URL (http://localhost:3000)

# Start Expo
npx expo start
```

Scan the QR code with Expo Go or press `i`/`a` for iOS/Android simulator.

### Environment Configuration

Each service requires its own `.env` file:

**Recommendation Engine** (`/recommendation-engine/.env`):

```env
USE_SAMPLE_DATA=True
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=echofinder
SAMPLE_TRACKS_PATH = "data/processed/EchoFinder.trackdetails.json"
SAMPLE_EMBEDDINGS_PATH = "data/processed/EchoFinder.songEmbeddings.json"
SAMPLE_USER_SONG_INTERACTION_PATH="data/processed/EchoFinder.usersonginteractions.csv"
SAMPLE_USER_FAV_ARTIST_PATH= "data/processed/EchoFinder.userfavartists.csv"
SAMPLE_USER_FAV_GENRES_PATH="data/processed/EchoFinder.userfavgenres.json"
EMBEDDINGS_MODEL=rec_models/embeddingModel
```

**API Gateway** (`/api-gateway/.env`):

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/echofinder
FASTAPI_URL=http://localhost:8000
SPOTIFY_CLIENT_ID=<your_spotify_client_id>
SPOTIFY_CLIENT_SECRET=<your_spotify_client_secret>
LASTFM_API_KEY=<your_lastfm_api_key>
```

**Mobile App** (`/mobile/.env`):

```env
API_URL=<your_express_server_url>
```

### External API Setup

#### Spotify API

1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy Client ID and Client Secret to API Gateway `.env`

#### Last.fm API

1. Visit [Last.fm API Account](https://www.last.fm/api/account/create)
2. Register for an API key
3. Add the key to API Gateway `.env`

## How It Works

### Data Pipeline

1. **Data Collection**: The recommendation engine uses a curated dataset of 30,000+ tracks from Million Song Dataset, Taste Profile subset, Spotify, Last.fm, and Billboard (sample 2,000-track dataset included for testing)

2. **Embedding Generation**: Track metadata (title, artist, album, tags, wiki summary, popularity, play counts) is processed through Sentence Transformers to create semantic embeddings

3. **Storage**: Embeddings and metadata are stored in MongoDB for efficient retrieval

4. **User Interaction**: Mobile app users like/dislike songs, select favorite artists and genres

5. **Recommendation**: When a user requests recommendations:

   - System gathers user's liked songs, favorite artists' songs, and preferred genre tracks
   - Computes cosine similarity between user profile embeddings and all track embeddings
   - Returns top-ranked songs based on similarity scores

6. **Continuous Learning**: As users interact, their profile evolves, improving future recommendations

### Recommendation Algorithm

**Type**: Content-Based Filtering with Semantic Embeddings

**Process**:

1. Extract and combine multiple metadata features into rich textual representations
2. Generate dense vector embeddings using pre-trained Sentence Transformers
3. Compute cosine similarity between user profile vectors and candidate song vectors
4. Rank songs by similarity score and filter already-interacted tracks
5. Return personalized recommendations

**Advantages**:

- No cold start problem for new users
- Explainable recommendations based on content similarity
- Works well with rich metadata
- Scalable with pre-computed embeddings

## Key Features

### For Users

- 🎵 **Personalized Recommendations** - AI-driven suggestions based on your taste
- 🔥 **Trending Discovery** - Explore what's popular right now
- 🎨 **Genre & Artist Preferences** - Customize your music profile
- ❤️ **Like/Dislike System** - Simple feedback to improve recommendations
- 🔄 **Adaptive Learning** - Recommendations improve with every interaction
- ⚡ **Fast & Responsive** - Optimistic updates and persistent caching

### For Developers

- 📱 **Modern Mobile Stack** - React Native + Expo + TypeScript
- 🔌 **Clean API Architecture** - RESTful Express.js gateway
- 🧠 **Production ML Deployment** - FastAPI with pre-computed embeddings
- 📊 **Multi-Source Data** - Spotify, Last.fm, Billboard integration
- 🎯 **Type Safety** - TypeScript across frontend, Pydantic in backend
- 🔄 **Real-Time Updates** - React Query with optimistic mutations
- 📦 **Scalable Design** - Modular, service-oriented architecture

## Development Status

**Current Status**: MVP Complete ✅

All core features are implemented and functional. The system is ready for demonstration and further enhancement.

## Further Enhancements

### Short Term

- [ ] **Music Preview** - Add 30-second Spotify preview playback
- [ ] **Search Functionality** - Search for songs, artists, albums
- [ ] **Negative Feedback** - Penalize disliked songs in recommendations
- [ ] **UI Polish** - Enhanced animations, dark mode, themes

### Medium Term

- [ ] **Hybrid Recommendations** - Combine content-based with collaborative filtering
- [ ] **Feedback Loop** - Continuous learning from user interactions
- [ ] **Playlist Creation** - Build and save custom playlists
- [ ] **Advanced Filtering** - Filter by mood, tempo, energy

### Long Term

- [ ] **Real-Time Updates** - WebSocket support for live recommendations
- [ ] **Multi-User Analytics** - Dashboard for aggregate listening patterns
- [ ] **Deep Learning Models** - Neural collaborative filtering
- [ ] **Production Deployment** - AWS/GCP deployment with CI/CD

## Documentation

Each service also its own detailed README:

- [Mobile App README](/mobile/README.md)
- [API Gateway README](/express_backend/README.md)
- [Recommendation Engine README](/recommendation_engine/README.MD)

## Data & API Credits

This project integrates with the following services for educational and demonstration purposes:

- [Million Song Dataset](http://millionsongdataset.com/) - Music metadata collection
- [Spotify Web API](https://developer.spotify.com/documentation/web-api) - Song and artist metadata
- [Last.fm API](https://www.last.fm/api) - Additional artist and track information
- [Billboard Charts](https://www.billboard.com/charts/) - Trending songs and chart data

All data is used in compliance with respective terms of service for non-commercial, educational purposes.

## License

This project is licensed under the MIT License

## Acknowledgments

- Hugging Face for Sentence Transformers
- Million Song Dataset project
- Spotify, Last.fm, and Billboard for music data APIs
- React Native and Expo communities
- FastAPI and Express.js communities

## Contact

**Priyanka Pandey**  
📧 prnkpandey00@gmail.com  
🔗 [GitHub](https://github.com/prnk04)  
🔗 [LinkedIn](https://www.linkedin.com/in/priyankapandey03/)

---

_Built with ❤️ as a demonstration of full-stack development with machine learning integration._
