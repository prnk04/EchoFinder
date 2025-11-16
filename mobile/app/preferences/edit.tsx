import CardComponent from "@/src/components/CardComponent";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("screen");

export default function EditPreferencesScreen() {
  const params = useLocalSearchParams();
  const { title, data } = params;
  const [incomingData, setIncomingData] = useState<string[]>(new Array());

  const [selectedArtists, setSelectedArtists] = useState<string[]>(new Array());

  const getArtisytStyle = useCallback(
    (genre: string) => [
      styles.genreButton,
      selectedArtists.includes(genre)
        ? styles.genreSelected
        : styles.genreUnselected,
    ],
    [selectedArtists]
  );

  const toggleArtist = useCallback((genre: string) => {
    // setSelectedArtists((prev) =>
    //   prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    // );
  }, []);

  useEffect(() => {
    if (typeof data === "string") {
      let tempData = data?.split(",");
      setIncomingData(tempData);
      setSelectedArtists(tempData);
    } else {
      setIncomingData(data);
      setSelectedArtists(data);
    }
  }, [data, title]);

  return (
    <View
      style={{
        flex: 1,
        height: "100%",
        width: "100%",
        backgroundColor: "#141E23",
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["transparent", "transparent", "#FF000052"]}
        style={{
          flex: 1,
        }}
      >
        <SafeAreaView>
          <View
            style={{
              justifyContent: "center",
              paddingTop: SCREEN_HEIGHT * 0.04,
              paddingBottom: SCREEN_HEIGHT * 0.04,
            }}
          >
            <View
              style={{
                flexDirection: "row",
              }}
            >
              <View
                style={{
                  alignContent: "center",
                  justifyContent: "center",
                  // backgroundColor: "pink",
                  flex: 0.2,
                  alignItems: "center",
                }}
              >
                <TouchableHighlight onPress={() => router.back()}>
                  <FontAwesome5 name="angle-left" size={40} color="white" />
                </TouchableHighlight>
              </View>
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 30,
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  {title}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.genreContainer}>
              {incomingData?.map((artist, index) => (
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
        </SafeAreaView>
      </LinearGradient>
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
