import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  ActionDispatch,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";

type PreferencesState = {
  genres: string[] | null;
  artists: string[] | null;
  onboardingCompleted: boolean;
  loading: boolean;
};

const initialState: PreferencesState = {
  genres: null,
  artists: null,
  onboardingCompleted: false,
  loading: true,
};

type Action =
  | { type: "SET_GENRES"; payload: { genres: string[] } }
  | { type: "SET_ARTISTS"; payload: { artists: string[] } }
  | { type: "SET_ONBOARDING" }
  | { type: "STOP_LOADING" }
  | { type: "RESET_PREFERENCES" };

function preferencesReducer(
  state: PreferencesState,
  action: Action
): PreferencesState {
  switch (action.type) {
    case "SET_GENRES":
      return {
        ...state,
        genres: action.payload.genres,
      };

    case "SET_ARTISTS":
      return {
        ...state,
        artists: action.payload.artists,
      };

    case "RESET_PREFERENCES":
      return {
        ...state,
        artists: null,
        genres: null,
        onboardingCompleted: false,
      };

    case "STOP_LOADING":
      return { ...state, loading: false };

    case "SET_ONBOARDING":
      return { ...state, onboardingCompleted: true };

    default:
      return state;
  }
}

type PreferencesContextType = {
  state: PreferencesState;
  dispatch: ActionDispatch<[action: Action]>;
  setGenres: (genres: string[]) => Promise<void>;
  setArtists: (artists: string[]) => Promise<void>;
  setOnboardingStatus: () => Promise<void>;
  deletePreferences: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(preferencesReducer, initialState);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      let storedOnboardingStatus = await AsyncStorage.getItem(
        "onboarding_status"
      );
      let genresStored = await AsyncStorage.getItem("genres_selected");
      let artistsStored = await AsyncStorage.getItem("artists_selected");

      if (storedOnboardingStatus) {
        dispatch({ type: "SET_ONBOARDING" });
      }
      if(genresStored) {
        dispatch({type: "SET_GENRES", payload: {genres: JSON.parse(genresStored)}})
      }

      if(artistsStored) {
        dispatch({type: "SET_ARTISTS", payload: {artists: JSON.parse(artistsStored)}})
      }
    } catch (error) {
      console.log("Init error for user pref context:", error);
    } finally {
      dispatch({ type: "STOP_LOADING" });
    }

    return;
  };

  const setGenres = async (genres: string[]) => {
    await AsyncStorage.setItem("genres_selected", JSON.stringify(genres));
    
    dispatch({ type: "SET_GENRES", payload: { genres: genres } });
  };

  const setArtists = async (artists: string[]) => {
    await AsyncStorage.setItem("artists_selected", JSON.stringify(artists));
    dispatch({ type: "SET_ARTISTS", payload: { artists: artists } });
  };

  const deletePreferences = async () => {
    await AsyncStorage.removeItem("genres_selected");
    await AsyncStorage.removeItem("artists_selected");
    await AsyncStorage.setItem("onboarding_status", "false");

    dispatch({ type: "RESET_PREFERENCES" });
  };

  const setOnboardingStatus = async () => {
    await AsyncStorage.setItem("onboarding_status", "true");
    dispatch({ type: "SET_ONBOARDING" });
  };

  return (
    <PreferencesContext.Provider
      value={{
        state,
        dispatch,
        setGenres,
        setArtists,
        setOnboardingStatus,
        deletePreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export const useUserPreferences = () => useContext(PreferencesContext);
// // UserPreferencesContext.tsx
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import React, { createContext, useContext, useEffect, useState } from "react";

// type UserPreferences = {
//   genres: string[];
//   artists: string[];
// };

// type PreferencesContextType = {
//   preferences: UserPreferences | null;
//   savePreferences: (data: UserPreferences) => Promise<void>;
//   onboardingComplete: boolean;
//   completeOnboarding: () => Promise<void>;
//   loaded: boolean;
// };

// const UserPreferencesContext = createContext<PreferencesContextType | null>(
//   null
// );

// export function UserPreferencesProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [preferences, setPreferences] = useState<UserPreferences | null>(null);
//   const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
//   const [loaded, setLoaded] = useState<boolean>(false);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const storedPrefs = await AsyncStorage.getItem("preferences");
//         const storedFlag = await AsyncStorage.getItem("onboardingComplete");

//         setPreferences(
//           storedPrefs
//             ? JSON.parse(storedPrefs)
//             : {
//                 genres: [],
//                 artists: [],
//               }
//         );

//         setOnboardingComplete(storedFlag === "true");
//       } finally {
//         setLoaded(true);
//       }
//     };

//     load();
//   }, []);

//   // Saves when preferences change
//   const savePreferences = async (prefs: UserPreferences) => {
//     setPreferences(prefs);
//     await AsyncStorage.setItem("preferences", JSON.stringify(prefs));
//   };

//   const completeOnboarding = async () => {
//     setOnboardingComplete(true);
//     await AsyncStorage.setItem("onboardingComplete", "true");
//   };

//   return (
//     <UserPreferencesContext.Provider
//       value={{
//         preferences,
//         savePreferences,
//         onboardingComplete,
//         completeOnboarding,
//         loaded,
//       }}
//     >
//       {children}
//     </UserPreferencesContext.Provider>
//   );
// }

// export const useUserPreferences = () => useContext(UserPreferencesContext);
