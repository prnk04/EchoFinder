# 📡 EchoFinder API Gateway

Central orchestration layer between the EchoFinder mobile app, external music data providers, MongoDB, and the FastAPI recommendation engine.

---

## 📖 Overview

The EchoFinder API Gateway is a Node.js + Express service that powers the EchoFinder mobile app.
It aggregates song metadata, charts, and artist information from external music platforms, manages user interactions, synchronizes data with MongoDB, and fetches personalized recommendations from the machine learning service.

This service acts as the single backend entry point for all mobile app requests.

---

## 🚀 Key Responsibilities

- Serve mobile app requests for tracks, artists, user interactions, and recommendations
- Fetch metadata from external music APIs
  - Spotify
  - LastFM
  - Billboard Charts (scraped)
- Store & retrieve data in MongoDB using Mongoose models
- Communicate with FastAPI to deliver personalized recommendations
- Maintain user identity via randomly generated mobile app user IDs
- Provide rate-limited, secure endpoints wrapped with CORS

---

## 🛠️ Tech Stack

- Node.js, Express
- JavaScript (ES6+)
- Axios for HTTP requests
- MongoDB + Mongoose
- External Integrations: Spotify API, LastFM API, Billboard scraping
- Security & Middleware:
  - CORS
  - Express-rate-limit
  - dotenv for environment variables

---

## 🔗 API Endpoints (High-Level)

Method Endpoint Description

- GET /recommender/getRecommendations : Fetch recommendations from FastAPI
- GET /songs/trending : Get trending + chart-based tracks
- POST /user/songFeedback : Like/dislike song feedback
- GET /artist/details : Artist metadata, top tracks, info
- GET /artist/songs : Songs for a specific artist
- POST /user/userDetails : User info + preferences
- GET /user/fav_track : Favorite track info

---

## ⚙️ Environment Variables

Create a .env file:

```
PORT=3000
MONGO_URI=<mongodb+srv://...>
FASTAPI_URL=<your_fastpi_url>
SPOTIFY_CLIENT_ID=<your_spotify_client_id>
SPOTIFY_CLIENT_SECRET=<your_spotify_client_secret>
LASTFM_API_KEY=<your_lastfm_api_key>
```

---

## ▶️ Running the Server

Install dependencies
`npm install`

Start in development
`npm run dev`

The API Gateway will start on the port defined in .env.

---

## 📌 Notes

- User IDs are generated on the mobile app; stored and used for personalized responses.
- Device ID is captured but not used yet — included for future features.
- Billboard scraping is lightweight and cached to reduce load.
- FastAPI recommendations API is required for full functionality.

## 📬 Future Improvements

- Centralized logging (Winston / CloudWatch / ELK)
- Unified caching layer (Redis)
- Authentication layer for a multi-user version
- OpenAPI/Swagger docs for the gateway

---

## 🪪 Data & API Credits

- [Spotify Web API](https://developer.spotify.com/documentation/web-api) — for song and artist metadata
- [Last.fm API](https://www.last.fm/api) — for additional artist and track info
- [Billboard](https://www.billboard.com/charts/) - for trending songs

  > Data is used only for educational and demonstration purposes.

---

## 🧍‍♂️ Author

Priyanka Pandey
📧 prnkpandey00@gmail.com
