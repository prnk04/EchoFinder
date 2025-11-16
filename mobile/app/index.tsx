
import { useUserDetails } from "@/src/context/UserDetailsContext";
import { router, Stack } from "expo-router";
import React, { useEffect } from "react";
import {
  BackHandler,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";

export default function IndexScreen() {
  const screenHeight = Dimensions.get("screen").height;
  const screenWidth = Dimensions.get("screen").width;

  const userDetails = useUserDetails();

  const userId = userDetails?.state.userId

  const moveToNextPage = async () => {
    router.push("/onboarding/genre-selection");
  };

   useEffect(() => {
    const blockBack = () => true; // prevent default
    const backHandler = BackHandler.addEventListener("hardwareBackPress", blockBack);

    return () => backHandler?.remove()
  }, []);

 
  return (
    <View style={IndexStyle.body}>
      <Stack.Screen options={{headerShown: false}}/>
      {/* View for image */}
      <View
        style={{
          flex: 4,
          justifyContent: "flex-end",
          alignContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={require("../assets/images/Image.png")}
          height={screenHeight * 0.4}
          width={screenHeight * 0.4}
          resizeMethod="scale"
          resizeMode="contain"
        />
      </View>
      {/* View for welcome to echofind */}
      <View
        style={{
          flex: 2,
          justifyContent: "center",
          // paddingVertical:screenHeight*0.15
          // justifyContent:"space-evenly"
        }}
      >
        <View>
          <Text
            style={{
              color: "white",
              fontSize: 28,
              textAlign: "center",
              lineHeight: 50,
            }}
          >
            Welcome to
          </Text>
        </View>
        <View>
          <Text
            style={{
              color: "white",
              fontSize: 32,
              textAlign: "center",
              fontWeight: "800",
              lineHeight: 60,
            }}
          >
            EchoFind
          </Text>
        </View>
      </View>
      {/* View for get started button */}
      <View
        style={{
          flex: 3,
          justifyContent: "flex-start",
        }}
      >
        <View
          style={{
            paddingHorizontal: screenWidth * 0.04,
          }}
        >
          <TouchableHighlight
            style={{
              backgroundColor: "#FF000080",
              paddingVertical: screenHeight * 0.02,
              borderRadius: screenWidth * 0.4 * 0.5,
              alignContent: "center",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={moveToNextPage}
          >
            <Text
              style={{
                color: "white",
                fontSize: 30,
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              Get Started
            </Text>
          </TouchableHighlight>
        </View>
      </View>
    </View>
  );
}

const IndexStyle = StyleSheet.create({
  body: {
    height: "100%",
    width: "100%",
    backgroundColor: "#141E23",
    flex: 1,
  },
});
