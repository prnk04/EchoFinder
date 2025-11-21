# EchoFinder Mobile App

A React Native music discovery application that delivers personalized song recommendations powered by machine learning and user preferences.

## Overview

EchoFinder is a mobile app built with React Native and Expo that helps users discover new music effortlessly. Users can explore trending tracks, browse songs from their favorite artists, customize their genre and artist preferences, and receive AI-powered recommendations that adapt based on their interactions.

The app serves as the user-facing layer of the EchoFinder ecosystem, demonstrating how preference collection, interaction logging, and ML-driven recommendation delivery can be combined into a seamless mobile experience.

## EchoFinder Ecosystem

This mobile app is part of the larger EchoFinder music application:

- **Mobile Frontend** (this repository) - React Native application for music discovery
- **API Gateway** - Node.js/Express orchestration layer
- **Recommendation System** - FastAPI-based ML service for personalized recommendations
- **MongoDB** - Centralized data storage for tracks, users, and interactions

## Demo

For a complete demonstration of the EchoFinder ecosystem including this mobile app in action, visit the [EchoFinder main repository](https://github.com/prnk04/echofinder).

## Features

### Music Discovery

- **Trending Songs** - Browse current popular tracks from Billboard and Spotify
- **Personalized Recommendations** - AI-powered suggestions based on your taste
- **Artist Exploration** - Discover songs from your favorite artists

### Personalization

- **Genre Selection** - Choose your favorite music genres during onboarding
- **Artist Preferences** - Select artists you love to improve recommendations
- **Adaptive Learning** - Recommendations improve as you interact with songs

### User Interactions

- **Like/Dislike Songs** - Simple feedback mechanism to refine recommendations
- **Undo Actions** - Quick snackbar to reverse accidental interactions
- **Preferences Management** - View and edit:
  - Liked genres
  - Favorite artists
  - Disliked songs
- **Account Management** - Option to delete your account and data

### App Experience

- **Persistent Caching** - Fast data loading with React Query
- **Smooth Navigation** - File-based routing with Expo Router
- **Custom Skeleton Loader** - Polished loading states using Reanimated
- **Optimistic UI Updates** - Immediate feedback for better responsiveness

## Tech Stack

### Frontend

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + useReducer
- **Data Fetching**: React Query (TanStack Query) with AsyncStorage persistence
- **UI Library**: React Native Paper
- **Animations**: React Native Reanimated
- **Local Storage**: AsyncStorage

### Backend Integration

- **Express.js** - API gateway for requests, metadata, and external integrations
- **FastAPI** - ML-powered recommendation engine
- **MongoDB** - User data and preference storage
- **External APIs**: Spotify, Last.fm, Billboard

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for physical device testing)

### Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/echofinder-mobile.git
cd echofinder-mobile
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
```

Example `.env` file:

```env
PORT=3000
MONGO_URI=mongodb+srv://...
FASTAPI_URL=http://localhost:8000
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
LASTFM_API_KEY=...
```

4. Ensure backend services are running

- Express API Gateway
- FastAPI recommendation service
- MongoDB instance

### Running the App

Start the Expo development server:

```bash
npx expo start
```

Then choose your platform:

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your physical device

## Architecture

### Data Flow

```
Mobile App ⇄ Express Server ⇄ FastAPI (ML Recommendations)
                ↓
            MongoDB (User Data)
                ↓
        External APIs (Spotify, Last.fm, Billboard)
```

1. Mobile app sends requests to Express API Gateway
2. Express fetches metadata from Spotify, Last.fm, and Billboard
3. For recommendations, Express queries the FastAPI service
4. FastAPI generates personalized recommendations using ML algorithms
5. Results are cached and displayed in the mobile app

### Key Technical Highlights

#### React Query with Persistent Caching

Handles data fetching for trending songs, recommendations, and artist information with automatic background refetching and AsyncStorage persistence for offline-capable, responsive experiences.

```typescript
export const useRecommendedSongs = (user_id: string) =>
  useQuery({
    queryKey: [queryKeys.songs.recommended, user_id],
    queryFn: async ({ queryKey }) => {
      const [, user_id] = queryKey;

      return apiClient(`/recommender/getRecommendations?user_id=${user_id}`);
    },
    enabled: !!user_id,
    // Poll ONLY when tracks are empty
    refetchInterval: (query) => {
      const tracks = query.state.data?.data?.rec_songs;
      // no data or empty tracks → keep polling every 10s
      if (!tracks || tracks.length === 0) return 10_000;
      // tracks exist → stop polling
      return false;
    },
    // Prevent hydration glitches
    refetchOnMount: false,
    retry: false, // you don’t want immediate hammering retries
  });
```

#### Context + Reducer for Preferences

Centralized state management using React Context and useReducer ensures predictable and maintainable logic for user preferences, genres, artists, and interaction history.

```typescript
const [state, dispatch] = useReducer(preferencesReducer, initialState);
dispatch({ type: "SET_GENRES", payload: { genres: JSON.parse(genresStored) } });
```

#### File-Based Routing with Expo Router

Modular navigation structure keeps the app organized and makes adding new flows straightforward. Each screen is a file in the `app/` directory.

#### Optimistic Updates with Undo Snackbar

Immediate UI updates improve responsiveness. When users like/dislike a song, the UI updates instantly while server synchronization happens in the background. An undo snackbar allows quick reversal.

#### Custom Reanimated Skeleton Loader

Handcrafted loading animations using React Native Reanimated provide a polished experience during data fetches, improving perceived performance.

#### Decoupled Backend Integration

The mobile app communicates exclusively with the Express API Gateway, which aggregates all external sources and the FastAPI recommendation engine. This separation of concerns keeps the mobile codebase clean and focused.

## User Flow

### First-Time User

1. **Landing Screen** - Welcome to EchoFinder
2. **Genre Selection** - Choose preferred music genres
3. **Artist Selection** - Select favorite artists
4. **Home Screen** - Start exploring with initial recommendations

### Returning User

1. **Home Screen** - View personalized recommendations
2. **Like/Dislike Songs** - Provide feedback to refine suggestions
3. **Explore Artists** - Browse songs from favorite artists
4. **Manage Preferences** - Update genres, artists, or view disliked songs

## Development Status

**Current Status**: MVP Complete ✅

The mobile app is fully functional with core features implemented and integrated with the backend services.

## Roadmap

Future enhancements planned for the mobile app:

- [ ] **In-App Music Preview** - Play 30-second previews of songs (Spotify SDK integration)
- [ ] **Search Functionality** - Search for songs, artists, and albums
- [ ] **UI/UX Enhancements** - Additional animations, dark mode, customizable themes
- [ ] **Playlist Creation** - Build and save custom playlists
- [ ] **Offline Mode** - Full offline support with cached data
- [ ] **Push Notifications** - New recommendation alerts
- [ ] **Advanced Filtering** - Filter recommendations by mood, tempo, or energy
- [ ] **Statistics Dashboard** - View listening history and taste profile

## Related Repositories

- [EchoFinder API Gateway](https://github.com/prnk04/EchoFinder/tree/main/express_backend) - Node.js/Express backend
- [EchoFinder Recommendation System](https://github.com/prnk04/EchoFinder/tree/main/recommendation_engine) - FastAPI ML service

## Data & API Credits

This application integrates with the following services for educational and demonstration purposes:

- [Spotify Web API](https://developer.spotify.com/documentation/web-api) - Song and artist metadata
- [Last.fm API](https://www.last.fm/api) - Additional artist and track information
- [Billboard Charts](https://www.billboard.com/charts/) - Trending songs and chart data

All data is used in compliance with respective terms of service for non-commercial, educational purposes.

## License

This project is licensed under the MIT License

## Contact

Priyanka Pandey  
📧 prnkpandey00@gmail.com

Project Link: [https://github.com/prnk04/EchoFinder/tree/main/mobile](https://github.com/prnk04/EchoFinder/tree/main/mobile)
