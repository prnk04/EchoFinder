import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  Text,
  View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("screen").height;
const SCREEN_WIDTH = Dimensions.get("screen").width;

export default function PlaceHolder({
  imageURL,
  title1,
  title2,
  type,
}: {
  imageURL: string;
  title1: string;
  title2: string;
  type: string;
}) {
  const [fallbackIamgeSrc, setFallbackImageSrc] = useState<ImageSourcePropType>(
    { uri: imageURL }
  );

  const checkImage = async () => {
    if (!imageURL || imageURL === "") {
      if (type === "song")
          setFallbackImageSrc(require("../../assets/images/record.png"));
        else setFallbackImageSrc(require("../../assets/images/artist.png"));
    } else {
      try {
        let res = await fetch(imageURL);
        if (!res?.ok) {
          if (type === "song")
          setFallbackImageSrc(require("../../assets/images/record.png"));
        else setFallbackImageSrc(require("../../assets/images/artist.png"));
        }
      } catch (error) {
        if (type === "song")
          setFallbackImageSrc(require("../../assets/images/record.png"));
        else setFallbackImageSrc(require("../../assets/images/artist.png"));
      }
    }
  };

  useEffect(() => {
    checkImage();
  }, []);

  //   this works good with data

  return (
    <View
      style={{
        flex: 1,
        paddingVertical: "1%",
      }}
    >
      <View>
        <Image
          source={fallbackIamgeSrc}
          height={SCREEN_WIDTH * 0.33}
          width={SCREEN_WIDTH * 0.33}
          resizeMethod="resize"
          resizeMode="cover"
          alt={title1}
          // tintColor={"#490606"}
          style={{
            borderRadius: SCREEN_WIDTH * 0.35 * 0.2,
            maxHeight: SCREEN_WIDTH * 0.33,
            maxWidth: SCREEN_WIDTH * 0.33,
            backgroundColor: "transparent",
            // tintColor:"#4906062e",
          }}
        ></Image>
      </View>

      <View
        style={{
          maxWidth: SCREEN_WIDTH * 0.32,
          // maxWidth: "100%"
          paddingTop: "5%",
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: "#f7dfdfff",
            fontSize: 16,
            lineHeight: 24,
            textAlign: "center",
          }}
        >
          {title1}
        </Text>

        {type === "song" ? (
          <Text
            numberOfLines={1}
            style={{
              color: "white",
              fontSize: 12,
              maxWidth: SCREEN_WIDTH * 0.32,
              textAlign: "center",
            }}
          >
            {title2}
          </Text>
        ) : (
          <></>
        )}
      </View>
    </View>
  );
}
