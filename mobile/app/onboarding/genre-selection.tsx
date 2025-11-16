import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useUpdateUser } from "@/src/api/mutations/users";
import CardComponent from "@/src/components/CardComponent";
import { useUserDetails } from "@/src/context/UserDetailsContext";
import { useUserPreferences } from "@/src/context/UserPreferencesContext";
import genres_Artists_Mapping from "@/src/data/genres_Artists_Mapping.json";
import { router, Stack } from "expo-router";

const GENRES = [
  "Rock",
  "Pop",
  "Classical",
  "Hip-Hop",
  "Metal",
  "Jazz",
  "K-pop",
  "R&B",
  "EDM",
  "Country",
];
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("screen");

export default function GenreSelectionScreen() {
  const [genresSelected, setGenresSelected] = useState<string[]>([]);
  const userPrefDetails = useUserPreferences();
  const userDetails = useUserDetails();

  const preferences = {
    genres: userPrefDetails?.state?.genres,
    artists: userPrefDetails?.state?.artists,
  };
  // const { preferences, savePreferences } = useUserPreferences();

  const userId = userDetails?.state.userId || "";
  const deviceId = userDetails?.state.deviceId || "";
  // const { userId, deviceId } = useUserDetails();

  const { mutateAsync } = useUpdateUser();

  useEffect(() => {
    if (!userId || userId === "") {
      userDetails?.initUser();
    }
  }, []);

  useEffect(() => {
    if (preferences?.genres?.length) {
      setGenresSelected(preferences.genres);
    }
  }, [preferences.genres]);

  const getGenreStyle = useCallback(
    (genre: string) => [
      styles.genreButton,
      genresSelected.includes(genre)
        ? styles.genreSelected
        : styles.genreUnselected,
    ],
    [genresSelected]
  );

  const toggleGenre = useCallback((genre: string) => {
    setGenresSelected((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }, []);

  const storeUserPref = async ({
    user_id,
    device_id,
    fav_artists,
    fav_genres,
  }: {
    user_id: string;
    device_id: string;
    fav_artists: string[];
    fav_genres: string[];
  }) => {
    try {
      let userDetails = {
        user_id: user_id,
        device_id: device_id,
        fav_artists: fav_artists,
        fav_genres: fav_genres,
      };
      let msgToSend;
      await mutateAsync(userDetails, {
        onSuccess: () => {
          // router.navigate("/artistSelection");

          msgToSend = { error: false, message: "success" };
        },
        onError: (error) => {
          msgToSend = { error: true, message: error };
        },
      });

      return msgToSend;
    } catch (error) {
      return { error: true, message: error };
    }
  };

  const moveToNextPage = useCallback(async () => {
    try {
      const genreMap = genres_Artists_Mapping["genres"] as Record<
        string,
        string[]
      >;
      const artistsToShow = genresSelected.flatMap(
        (g) => genreMap[g.trim().toLowerCase()] ?? []
      );

      let dataToSend = {
        user_id: userId,
        device_id: deviceId,
        fav_genres: genresSelected,
        fav_artists: [],
      };

      // let's first store it in db

      let dbRes = await storeUserPref(dataToSend);
      if (dbRes?.error)
        Alert.alert("Server unreachable! Please try again later");

      if (!dbRes?.error) {
        await userPrefDetails?.setGenres(genresSelected);

        router.push({
          pathname: "/onboarding/artist-selection",
          params: { artistsToShow: artistsToShow },
        });
      }
    } catch (error) {
      console.log("Error in genre selection :", error);
    }
  }, [genresSelected]);

  return (
    <View style={styles.body}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Choose your vibe</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.genreContainer}>
          {GENRES.map((genre, index) => (
            <CardComponent
              text={genre}
              textStyle={styles.genreText}
              backgroundStyle={styles.genreWrapper}
              buttonStyle={getGenreStyle(genre)}
              onPress={() => toggleGenre(genre)}
              underlayColor={"rgba(138,15,17,1)"}
              // id={'card_component' + Math.random().toString()}
              id={`${genre}-${index}`}
              key={`${genre}-${index}`}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={moveToNextPage}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: "#141E23",
  },
  headerContainer: {
    flex: 1,
    justifyContent: "center",
    paddingTop: SCREEN_HEIGHT * 0.04,
  },
  headerText: {
    color: "white",
    fontSize: 30,
    textAlign: "center",
    fontWeight: "600",
  },
  scrollContainer: {
    paddingVertical: SCREEN_HEIGHT * 0.02,
  },
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
  genreWrapper: {
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_HEIGHT * 0.02,
  },
  genreButton: {
    paddingHorizontal: SCREEN_WIDTH * 0.07,
    paddingVertical: SCREEN_HEIGHT * 0.02,
    borderRadius: SCREEN_HEIGHT * 0.02,
  },
  genreSelected: {
    backgroundColor: "rgba(138,15,17,1)",
  },
  genreUnselected: {
    backgroundColor: "#212c31ff",
  },
  genreText: {
    color: "white",
    fontSize: 22,
    textAlign: "center",
  },
  footer: {
    flex: 1.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SCREEN_WIDTH * 0.04,
  },
  nextButton: {
    backgroundColor: "rgba(138,15,17,1)",
    paddingVertical: SCREEN_HEIGHT * 0.015,
    borderRadius: SCREEN_WIDTH * 0.2,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  nextText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
});
