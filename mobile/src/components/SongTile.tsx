import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { TrackType } from "../types";

import FontAwesome from "@expo/vector-icons/FontAwesome";

const SCREEN_HEIGHT = Dimensions.get("screen").height;
const SCREEN_WIDTH = Dimensions.get("screen").width;

export const SongTile = ({
  item,
  changeModalState,
  registerLikeOrDislike,
  likedSongs,
}: {
  item: TrackType;
  changeModalState: (value: boolean) => void;
  registerLikeOrDislike: ({
    data,
    button,
  }: {
    data: TrackType;
    button: string;
  }) => number;
  likedSongs: TrackType[];
}) => {
  const [likeButtonName, setLikeButtonName] = useState("thumbs-o-up");
  const [dislikeButtonName, setDislikeButtonName] = useState("thumbs-o-down");
  


  useEffect(() => {
    // if(item?.spotify_id )
    let isPresent = likedSongs?.find((a) => a.spotify_id === item?.spotify_id);
    if (isPresent) {
      let isPresentScore = isPresent?.score || 0;
      if (isPresentScore > 0) {
        setLikeButtonName("thumbs-up");
        setDislikeButtonName("thumbs-o-down");
      } else {
        setLikeButtonName("thumbs-o-up");
        setDislikeButtonName("thumbs-down");
      }
    } else {
      setLikeButtonName("thumbs-o-up");
      setDislikeButtonName("thumbs-o-down");
    }
  }, [likedSongs]);



  const callRegsiterLikeOrDislike = ({
    data,
    button,
  }: {
    data: TrackType;
    button: string;
  }) => {
    let newScore = registerLikeOrDislike({
      data: data,
      button: button,
    });
    
  };

  const checkImage = (
    image: { url: any; height?: number; width?: number } | string
  ) => {
    if (typeof image == "string") {
      // image = JSON.parse(image)
    }
    let imageURL = image?.url;
    let fallbackIamgeSrc = { uri: imageURL };

    if (!imageURL || imageURL === "") {
      fallbackIamgeSrc = require("../../assets/images/record.png");
    }
    return fallbackIamgeSrc;
  };

  return (
    <View
      style={{
        flex: 1,
        paddingVertical: "1%",
        backgroundColor: "#262b2eff",
      }}
    >
      {/* This would be the view for wrapping image, song and like dislike button so that we can add padding */}
      <View
        style={{
          paddingVertical: "1%",
          paddingHorizontal: "1%",
          flex: 1,
          flexDirection: "row",
        }}
      >
        {/* This would be wrapper for song image, title and artist name */}
        <TouchableHighlight
          style={{
            flex: 8,
            justifyContent: "space-between",
            flexDirection: "row",
          }}
          onPress={() => changeModalState(true)}
        >
          <View
            style={{
              flexDirection: "row",
              alignContent: "center",
              alignItems: "center",
            }}
          >
            {/* View for image */}
            <View>
              <Image
                source={checkImage(item?.image)}
                resizeMethod="resize"
                resizeMode="cover"
                style={{
                  maxHeight: 50,
                  maxWidth: 50,
                }}
                height={50}
                width={50}
              />
            </View>

            {/* View for text */}
            <View style={{ paddingHorizontal: "10%" }}>
              <Text numberOfLines={1} style={SongsListStyleSheet.songNameText}>
                {item?.title}
              </Text>

              <Text
                numberOfLines={1}
                style={SongsListStyleSheet.artistNameText}
              >
                {item?.artistsName?.toString()}
              </Text>
            </View>
          </View>
        </TouchableHighlight>

        {/* This would be teh wrapper for the 3 icons */}
        <View
          style={{
            flex: 3,
            justifyContent: "space-around",
            flexDirection: "row",
            alignContent: "center",
            alignItems: "center",
          }}
        >
          {/* neutral button */}
          <TouchableHighlight
            onPress={() =>
              callRegsiterLikeOrDislike({
                data: item,
                button: "like",
              })
            }
          >
            {/* <FontAwesome name="thumbs-o-up" size={30} color="#FF000080" /> */}
            <FontAwesome name={likeButtonName} size={30} color="#FF000080" />
          </TouchableHighlight>

          {/* liked button */}

          {/* disline button */}
          <TouchableHighlight
            onPress={() =>
              callRegsiterLikeOrDislike({
                data: item,
                button: "dislike",
              })
            }
          >
            {/* <FontAwesome name="thumbs-o-down" size={30} color="#FF000080" /> */}
            <FontAwesome name={dislikeButtonName} size={30} color="#FF000080" />
          </TouchableHighlight>
        </View>
      </View>
    </View>
  );
};

const SongsListStyleSheet = StyleSheet.create({
  songNameText: {
    fontSize: 18,
    color: "white",
    lineHeight: 25,
    maxWidth: SCREEN_WIDTH * 0.4,
  },
  artistNameText: {
    fontSize: 12,
    color: "white",
    opacity: 0.7,
    maxWidth: SCREEN_WIDTH * 0.4,
  },
});
