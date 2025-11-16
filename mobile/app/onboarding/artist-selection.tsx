import { useUserPreferences } from "@/src/context/UserPreferencesContext";
import React, { useCallback, useEffect, useState } from "react";
import {
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
import genres_Artists_Mapping from "@/src/data/genres_Artists_Mapping.json";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("screen");

export default function ArtistSelectionScreen() {
  const params = useLocalSearchParams();
  // const { itemId, category } = params;
  const {artistsToShowFromReq} = params;
  const [selectedArtists, setSelectedArtists] = useState<string[]>(new Array());
  const userDetails = useUserDetails();
  const userId = userDetails?.state.userId
  const deviceId = userDetails?.state.deviceId
  const userPrefDetails = useUserPreferences();
  const preferences = 
  {
    "genres": userPrefDetails?.state?.genres,
  "artists": userPrefDetails?.state?.artists
}

  const insets = useSafeAreaInsets();

  const [artistsToShow, setArtistsToShow] = useState<string[]>();

  const { mutateAsync } = useUpdateUser();

  useEffect(() => {
    if (preferences?.genres?.length) {
      setSelectedArtists(preferences.artists ?? []);
    }
  }, []);

  useEffect(() => {
    
    if (!artistsToShowFromReq || artistsToShowFromReq?.length === 0 ) {
      let genres = preferences?.genres;
      const genreMap = genres_Artists_Mapping["genres"] as Record<
        string,
        string[]
      >;
      let artistsToShowHere = genres?.flatMap(
        (g) => genreMap[g.trim().toLowerCase()] ?? []
      );

      let artistSet = new Set(artistsToShowHere);
      artistsToShowHere = Array.from(artistSet);

      // artistsToShowHere = [... new Set(artistsToShowHere)]

      // if (artistsToShowHere) setArtistsToShow(artistsToShowHere);
      if (artistsToShowHere) {
        artistsToShowHere = shuffle(artistsToShowHere)
        setArtistsToShow(artistsToShowHere)
      };
    } else {
      let artistSet = new Set(artistsToShowFromReq);
      
      let artistsToShowHere = Array.from(artistSet);

      if (artistsToShowHere) {
        artistsToShowHere = shuffle(artistsToShowHere)
        setArtistsToShow(artistsToShowHere)
      };
    }
  }, []);

  function shuffle(array: string[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array
}

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
          msgToSend = { error: false, message: "success" };
        },
        onError: (error) => {
          msgToSend = { error: true, message: error };
        },

        // on
      });

      return msgToSend
    } catch (error) {
      return { error: true, message: error };
    }
  };

  async function moveToNextPage() {
    try {
      
      // lets first store data in db
      let dataToSend = {
        user_id: userId || "",
        device_id: deviceId || "",
        fav_genres: preferences?.genres ? preferences.genres : [],
        fav_artists: selectedArtists,
      };


      let dbRes = await storeUserPref(dataToSend);

      if (!dbRes?.error) {
        userPrefDetails?.setOnboardingStatus()
        userPrefDetails?.setArtists(selectedArtists)
        
        router.replace("/home")
      }
      
    } catch (error) {
      console.log("Error in moving to next page: ", error);
    }
  }

  const getArtisytStyle = useCallback(
    (genre: string) => [
      styles.genreButton,
      selectedArtists.includes(genre)
        ? styles.genreSelected
        : styles.genreUnselected,
    ],
    [selectedArtists]
  );

  const toggleArtist = useCallback((artist: string) => {
    setSelectedArtists((prev) =>
      prev.includes(artist) ? prev.filter((a) => a !== artist) : [...prev, artist]
    );
  }, []);


  return (
    
    <View style={styles.body}>
      <Stack.Screen options={{headerShown: false}}/>

      <View
        style={{
          backgroundColor: "#141E23",
          paddingTop: insets.top,
          justifyContent: "space-between",
          alignContent: "flex-end",
          // alignItems: "flex-end",
          flexDirection: "row",
          paddingHorizontal: Dimensions.get("screen").width * 0.06,
          // backgroundColor: "blue",
        }}
      >
        <View
          style={{
            flex: 1,
            // backgroundColor: "pink",
            alignSelf:"center"
          }}
        >
          <TouchableOpacity
            style={{
              // paddingTop: Dimensions.get("screen").height * 0.02,
              justifyContent: "center"
            }}
            // onPress={() => router.back()}
          >
            <FontAwesome5 name="angle-left" size={35} color="white" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 9,
            alignSelf: "center",
            justifyContent: "center",
            // backgroundColor: "green"
          }}
        >
          <View
            // style={{
            //   paddingTop: Dimensions.get("screen").height * 0.02,

            // }}
            style={styles.headerContainer}
          >
            {/* <Text
              style={{
                fontSize: 30,
                color: "#FF000080",
                textAlignVertical: "center",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {`Your playlist, your icons`}
            </Text> */}
             <Text style={styles.headerText}>Your playlist, Your icons</Text>
          </View>
        </View>
      </View>
       
      
      {/* <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Your playlist, your icons</Text>
      </View> */}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
       
        <View style={styles.genreContainer}>
          {artistsToShow?.map((artist, index) => (
            <CardComponent
              text={artist}
              textStyle={styles.genreText}
              backgroundStyle={styles.genreWrapper}
              buttonStyle={getArtisytStyle(artist)}
              onPress={() => toggleArtist(artist)}
              underlayColor={"rgba(138,15,17,1)"}
              key={`${artist}_${index}`}
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
    // flex: 1,
    justifyContent: "center",
    paddingTop: SCREEN_HEIGHT * 0.04,
    paddingBottom: SCREEN_HEIGHT * 0.04,
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
    // paddingHorizontal: SCREEN_WIDTH * 0.02,
    // paddingVertical: SCREEN_HEIGHT * 0.02,
    paddingHorizontal: SCREEN_WIDTH * 0.01,
    paddingVertical: SCREEN_HEIGHT * 0.01,
  },
  genreButton: {
    paddingHorizontal: SCREEN_WIDTH * 0.07,
    paddingVertical: SCREEN_HEIGHT * 0.02,
    borderRadius: SCREEN_HEIGHT * 0.02,
    width: SCREEN_WIDTH * 0.45,
    height: SCREEN_WIDTH * 0.4,
    justifyContent: "center",
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
    flex: -1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: SCREEN_HEIGHT * 0.02,
    height: SCREEN_HEIGHT * 0.18,
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
