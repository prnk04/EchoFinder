import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { asyncStoragePersister } from "../src/lib/persister";
import { queryClient } from "../src/lib/queryClient";

import LoadingBackground from "../src/components/Loading/starter/LoadingBackground";
import { AppContextProvider, useAppContext } from '../src/context/AppContextProvider';
import { UserDetailsProvider, useUserDetails } from "../src/context/UserDetailsContext";
import { PreferencesProvider, useUserPreferences } from "../src/context/UserPreferencesContext";


import React, { useEffect } from "react";
import { useColorScheme } from "react-native";

export default function RootProviders() {
  // NavigationBar.setBackgroundColorAsync("#000");

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <QueryClientProvider client={queryClient}>
        <UserDetailsProvider>
          <PreferencesProvider>
            <AppContextProvider>
              <RootLayoutWrapper />
            </AppContextProvider>
          </PreferencesProvider>
        </UserDetailsProvider>
      </QueryClientProvider>
    </PersistQueryClientProvider>
  );
}

function RootLayoutWrapper() {
  // const appContext = useAppContext();
  // const appResetKey = appContext?.appResetKey
  return <RootLayout  />;
}

// --------------------------
// THE REAL ROUTE DECIDER
// --------------------------
function RootLayout(key: any) {
  const appContextVal = useAppContext();
  const isAppReady = appContextVal?.isAppReady

  const userPrefVal = useUserPreferences()
  const  onboardingComplete = userPrefVal?.state.onboardingCompleted;
  const preferences= {
    "genres": userPrefVal?.state.genres,
    "artists": userPrefVal?.state.artists,
  }

  const userDetails = useUserDetails();
  const userId = userDetails?.state.userId;

  const colorScheme = useColorScheme();
    useEffect(() => {
        SystemUI.setBackgroundColorAsync(
            colorScheme === "dark" ? "#141E23" : "#141E23"
        );
    }, [colorScheme]);

  // 1. Show loading UI 
  if (!isAppReady) {
    return <LoadingBackground />;
  }

   
  

 const initialRouteName = onboardingComplete && preferences?.genres?.length ? "home/index" :
  preferences?.artists?.length ? "onboarding/artist-selection" :
  preferences?.genres?.length ? "onboarding/genre-selection" :
  // userId ? "onboarding/genres-selection" :
  "index"

  // 3. Render stack only after readiness & decision
  return (
    <Stack
      initialRouteName={initialRouteName}
      screenOptions={{
        // headerShown: false,
        headerShown: true,
        animation: "slide_from_right",
        animationDuration: 300,
        contentStyle: {backgroundColor: "black"}
      }}
    />
  );
}
