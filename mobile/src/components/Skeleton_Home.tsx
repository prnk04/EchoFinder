import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";
import * as Animatable from "react-native-animatable";


export default function Skeleton_Home({viewWidth}: {viewWidth: number}) {
 
  return (
    <View
      style={{
        width:viewWidth,
        //  SCREEN_WIDTH * 0.35,
        aspectRatio: 1,
      }}
    >
      <View
        style={{
          height: "80%",
          aspectRatio: 1,
        }}
      >
        <View
          style={{
            height: "100%",
            aspectRatio: 1,
            marginVertical: "2%",
            backgroundColor: "#604f4fff",
            borderRadius: "10%"
          }}
        >
          <Animatable.View
            animation={{
              0: {
                opacity: 0.2,
                transform: [{ translateX: 0 }],
              },
              0.22: {
                opacity: 0.5,
              },
              0.5: {
                opacity: 1,
              },
              0.7: {
                opacity: 0.5,
              },
              1: {
                opacity: 0.2,
                transform: [{ translateX: viewWidth * 0.6 }],
              },
            }}
            easing="ease-in-out"
            iterationCount={"infinite"}
            iterationDelay={1}
            duration={1000}
            style={{
              flex: 1,
            }}
          >
            <LinearGradient
              colors={["#5d5050ff", "#33282870", "#5d5050ff"]}
              start={[0, 0]}
              end={[1, 0]}
              style={{
                height: "100%",
                aspectRatio: 0.2,
              }}
            ></LinearGradient>
          </Animatable.View>
        </View>
        <View style={{ backgroundColor: "transparent" }}></View>

        <View
          style={{
            height: "12%",
            width: "100%",
            marginTop: "4%",
            backgroundColor: "#604f4fff",
            borderRadius: "9%",
          }}
        >
          <Animatable.View
            animation={{
              0: {
                opacity: 0.2,
                transform: [{ translateX: 0 }],
              },
              0.22: {
                opacity: 0.5,
              },
              0.5: {
                opacity: 1,
              },
              0.7: {
                opacity: 0.5,
              },
              1: {
                opacity: 0.2,
                transform: [{ translateX: viewWidth * 0.6 }],
              },
            }}
            easing="ease-in-out"
            iterationCount={"infinite"}
            iterationDelay={1}
            duration={1000}
            style={{
              flex: 1,
            }}
          >
            <LinearGradient
              colors={["#5d5050ff", "#33282870", "#5d5050ff"]}
              style={{
                width: "15%",
                height: "100%",
              }}
            ></LinearGradient>
          </Animatable.View>
        </View>
      </View>
      {/* </LinearGradient> */}
    </View>
  );
}
