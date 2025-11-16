# 🎧 EchoFinder – Mobile App (React Native)

**EchoFinder** is a mobile app built with React Native and Expo that helps users discover new music effortlessly.
Users can explore trending tracks, browse songs from their favorite artists, select their genre/artist preferences, and receive personalized recommendations that adapt as they interact with the app.

EchoFinder integrates with a **Express backend** and a **FastAPI recommendation engine** to deliver dynamic, data-driven music suggestions.

---

## 🎯 Purpose

EchoFinder is developed as part of a complete music recommendation system.
The mobile app serves as the user-facing layer of this system, demonstrating how preference collection, interaction logging, and recommendation delivery can be combined into a smooth product experience.

The goal is to provide:
- A clean and intuitive UI
- A responsive, state-driven architecture
- A practical showcase of integrating ML-powered recommendations into a mobile app

---

## 🧠 Tech Stack

### Frontend (Mobile)
- [React Native (Expo)](https://expo.dev/)
- TypeScript
- Expo Router
- React Query (with persistent caching)
- React Native Paper
- React Context + Reducer
- AsyncStorage
- React Native Reanimated

### Backend(Connected via Express server)
- [Express.js](https://expressjs.com/) — handles requests between app, APIs, and recommender system  
- [FastAPI](https://fastapi.tiangolo.com/) — hosts the recommendation model  
- [MongoDB](https://www.mongodb.com/) — stores user data and preferences
- Spotify, Billboard, Last.fm integrations

> **Note:** Backend code (Express & FastAPI) will be uploaded soon.

---

## ✨ Features

### 🔍 Explore & Discover
- Trending songs
- Personalized recommendations
- Songs from preferred artists


### 🎨 Personalization
- Select preferred genres
- Select preferred artists
- Dynamic recommendations that improve with interactions

### ❤️ User Interaction
- Like / Dislike songs
- Undo snackbar for quick reversal
- Preferences page to view:
  - Liked genres
  - Liked artists
  - Disliked songs
  - Delete account

### ⚙️ App Experience
- React Query persistent caching
- Smooth navigation with Expo Router
- Custom Reanimated skeleton loader for home screen

---

## 🔧 Folder Structure

```
Echofinder/
|
|--- app/ # Expo Router app directory
| |--- _layout.tsx
│ |--- index.tsx
| |--- home/
| |     |--- index.tsx
| |--- onboarding/
│ |     |--- genre-selection.tsx
│ |     |--- genre-selection.tsx
| |--- preferences/
│ |     |--- edit.tsx
| |     |--- index.tsx
│ |--- songs/
│       |── list.tsx
|
|--- src/
│ |--- api/ # API services and query definitions
│ |--- components/ # Reusable UI components
│ |--- context/ # React contexts (e.g., user preferences)
│ |--- data/ # Static or seed data
│ |--- lib/ # React contexts
│ |--- types/ # TypeScript types
|
|--- assets/ # Fonts, icons, images
|--- app.json # Expo configuration
|--- .gitignore

```
---

## 🧩 Architecture Overview

`
React Native App ⇄ Express Server ⇄ FastAPI (Recommender)
↓
MongoDB (user data)
`


- The mobile app calls the **Express server** for all interactions.  
- The **Express server** fetches metadata (songs, artists, genres) from **Spotify** and **Last.fm APIs**.  
- It then queries the **FastAPI service** to fetch **real-time recommendations** generated using custom ML algorithms.  

---

## 🌟 Technical Highlights

### 🔎 React Query With Persistent Caching

Handles trending, recommendations, and artist data with background refetching and AsyncStorage persistence for responsive state updates.

### 🧠 Context + Reducer for Preferences

Centralized state management for genres, artists, and dislike lists ensures predictable and maintainable logic.

### 🧭 Modular Navigation With Expo Router

File-based routing keeps the app structure clean and makes flows easy to scale.

### ↩️ Undo Snackbar With Optimistic Updates

Immediate UI updates improve responsiveness, with server synchronization handled after user confirmation.

### 📡 Decoupled Backend Integration

The mobile app communicates only with the Node.js API, which aggregates all external sources and the FastAPI recommendation engine.

### ✨ Custom Reanimated Skeleton Loader

A handcrafted loader improves perceived performance during data fetches.

---

## 🚀 Getting Started

1. Clone the repository
` 
git clone https://github.com/yourusername/echofinder-mobile.git
cd echofinder-mobile
`

2. Install dependencies
`
npm install
`

3. Create a .env file
`API_URL=https://your-node-server-url.com`

4. Start the app
`npx expo start
`

Use Expo Go or any simulator to run the app.

### Requirements

Ensure the following services are running:
- Node.js backend
- FastAPI recommender server
---
## 🧪 Future Enhancements

- 🎧 Add in-app **song preview / playback** feature  
- 🔍 Add serach functionality
- 💅 UI / UX enhancements (animations, theming)  
- 🧠 Expand recommender system with **hybrid models** (e.g., content + collaborative filtering)

---

## 🪪 Data & API Credits

- [Spotify Web API](https://developer.spotify.com/documentation/web-api) — for song and artist metadata  
- [Last.fm API](https://www.last.fm/api) — for additional artist and track info  
- Billboard - for trending songs

> Data is used only for educational and demonstration purposes.

---

## 🧍‍♂️ Author

**Priyanka Pandey**  
📧 prnkpandey00@gmail.com

---
