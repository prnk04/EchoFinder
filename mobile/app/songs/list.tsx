import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";

import { useUpdateUserSongInteraction } from "@/src/api/mutations/users";
import { useFetchArtist } from "@/src/api/queries/artists";
import {
  useFetchArtistSongs,
  useFetchUserLikedSongs,
  useRecommendedSongs,
  useTrendingSongs,
} from "@/src/api/queries/songs";
import { SongTile } from "@/src/components/SongTile";
import { useUserDetails } from "@/src/context/UserDetailsContext";
import { ArtistType, TrackType } from "@/src/types";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Portal, Provider, Snackbar } from "react-native-paper";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const SCREEN_HEIGHT = Dimensions.get("screen").height;
const SCREEN_WIDTH = Dimensions.get("screen").width;

type DeletedSong = {
  score: number;
  song_id: string;
  user_id: string;
};

export default function SongsListScreen() {
  const routeParams = useLocalSearchParams();
  const { typeOfData, title } = routeParams;
  const [headerTitle, setHeaderTitle] = useState<string>(title?.toString());
  const [showModal, setShowModal] = useState(false);
  const [spotify_id, setSpotify_id] = useState<string>("");

  const [prevRecommendedSongList, setPrevRecommendedSongList] = useState<
    TrackType[]
  >([]);

  const [visibleSnackbar, setVisibleSnackbar] = React.useState(false);

  const onToggleSnackBar = () => setVisibleSnackbar(true);
  const [deletedSongDetails, setDeletedSongDetails] = useState<DeletedSong[]>(
    []
  );

  const [recommendedSongsData, setRecommendedSongsData] = useState<TrackType[]>(
    []
  );
  const [artistData, setArtistData] = useState<ArtistType[]>([]);
  const [artistSongList, setArtistSongList] = useState<TrackType[]>([]);

  const [dislikedSongs, setDislikedSongs] = useState<TrackType[]>([]);
  
  const userDetails = useUserDetails()
  const userId = userDetails?.state.userId

  const {
    isPending: isArtistDetailResultPending,
    isError: isArtistDetailResultError,
    isSuccess: isArtistDetailResultSuccess,
    data: artistDetailResultData,
  } = useFetchArtist(userId ||"");

  const {
    isPending: isRecommendedSongsResultPending,
    isError: isRecommendedSongsResultError,
    isSuccess: isRecommendedSongsResultSuccess,
    data: recommendedSongsResult,
  } = useRecommendedSongs(userId || "");

  const {
    isPending: isTrendingSongsResultPending,
    isError: isTrendingSongsResultError,
    isSuccess: isTrendingSongsResultSuccess,
    data: trendingSongsResult,
  } = useTrendingSongs(userId);

  const {
    isPending: isUserLikedSongsPending,
    isError: isUserLikedSongsError,
    isSuccess: isUserLikedSongsSuccess,
    data: userLikedSongsData,
    refetch: refetchUserLikedData,
  } = useFetchUserLikedSongs(userId || "");

  const insets = useSafeAreaInsets();

  const [trendingsongsList, setTrendingSongsList] = useState<TrackType[]>([]);

  const {
    isPending: isFetchArtistSongPending,
    isError: isFetchArtistSongError,
    isSuccess: isFetchArtistSongSuccess,
    data: artistSongData,
  } = useFetchArtistSongs(
    userId || "",
    routeParams?.spotify_id?.toString() || spotify_id,
    routeParams?.title?.toString() || ""
  );

  const { mutate } = useUpdateUserSongInteraction();

  useEffect(() => {
    if (typeOfData === "favArtists") {
      setHeaderTitle("Your Favorite Artists");
      if (artistDetailResultData) {
        setArtistData(artistDetailResultData?.data);
      }
    }
  }, [artistDetailResultData]);

  useEffect(() => {
    if (typeOfData === "recommendedSongs") {
      setHeaderTitle("Recommended for You");
      if (isRecommendedSongsResultSuccess) {
        setRecommendedSongsData(recommendedSongsResult?.data?.rec_songs);
      }
    }
  }, [recommendedSongsResult, isRecommendedSongsResultSuccess]);

  useEffect(() => {
    if (typeOfData === "trendingSongs") {
      setHeaderTitle("Trending Songs");
      if (isTrendingSongsResultSuccess) {
        setTrendingSongsList(JSON.parse(trendingSongsResult)?.trendingSongs);
      }
    }
  }, [trendingSongsResult, isTrendingSongsResultSuccess]);



  useEffect(() => {
    if (typeOfData === "dislikedSongs") {
      if (isUserLikedSongsSuccess && userLikedSongsData) {
        setDislikedSongs(
          userLikedSongsData?.data?.fav_tracks?.filter(
            (a: TrackType) => a?.score && a?.score < 0
          ) || []
        );
      }
    }
  }, [isUserLikedSongsSuccess, userLikedSongsData]);

  useEffect(() => {
    if (typeOfData === "artistSong") {
      setHeaderTitle(title?.toString());
      if (isFetchArtistSongSuccess) {
        setArtistSongList(artistSongData?.data?.tracks);
      }
    }
  }, [artistSongData, isFetchArtistSongSuccess]);

  useEffect(() => {
    return onDismissSnackBar()
  }, [])

  const checkImage = (imageURL: string) => {
    let fallbackIamgeSrc = { uri: imageURL };
    if (!imageURL || imageURL === "") {
      fallbackIamgeSrc =
        typeOfData === "recommendedSongs" || typeOfData === "trendingSongs"
          ? require("../../assets/images/record.png")
          :
          require("../../assets/images/artist.png")
    }
    return fallbackIamgeSrc;
  };



  const registerLikeOrDislike = ({
    data,
    button,
  }: {
    data: TrackType;
    button: string;
  }) => {
    let newScore = 0;
    let score = data?.score || 0;

    if (score === 0) {
      newScore = button === "like" ? 5 : -1;
    } else if (score === -1) newScore = button === "like" ? 5 : 0;
    else if (score === 5) {
      newScore = button === "like" ? 0 : -1;
    }
    // updateUserSongInteraction({
    //   user_id: userId,
    //   song_id: data?.song_id,
    //   score: newScore,
    // });
    // mutate({ score: newScore, song_id: data?.song_id, user_id: userId });
    data.score = newScore;
    if (newScore < 0) {
      if (typeOfData === "recommendedSongs") {
        const updatedList = recommendedSongsData?.filter(
          (a) => a.song_id !== data?.song_id
        );
        setPrevRecommendedSongList(recommendedSongsData);
        setRecommendedSongsData(updatedList);
      } else {
        mutate({ score: newScore, song_id: data?.song_id, user_id: userId || "" });
      }

      let existingSongsToDelete = deletedSongDetails;
      let songToDelete = {
        score: newScore,
        song_id: data?.song_id,
        user_id: userId || "",
      };
      existingSongsToDelete.push(songToDelete);
      setDeletedSongDetails(existingSongsToDelete);

      onToggleSnackBar();

    } else if (newScore >= 0 && typeOfData === "dislikedSongs") {
      const updatedList = dislikedSongs?.filter(
        (a) => a.song_id !== data?.song_id
      );
      setDislikedSongs(updatedList);
      mutate({ score: newScore, song_id: data?.song_id, user_id: userId || "" });

    } else {
      mutate({ score: newScore, song_id: data?.song_id, user_id: userId || "" });
    }

    return newScore;
  };

  const onDismissSnackBar = () => {
    if (deletedSongDetails && deletedSongDetails?.length > 0) {
      let songsToDelete = [...deletedSongDetails];
      songsToDelete.map((song) => {
        mutate({ score: song.score, song_id: song?.song_id, user_id: userId || "" });
      });
    }
    setVisibleSnackbar(false);
  };

  const undoRemoval = () => {
    let existingSongsToDelete = deletedSongDetails;
    existingSongsToDelete.pop();
    setDeletedSongDetails(existingSongsToDelete);

    if (typeOfData === "recommendedSongs") {
      setRecommendedSongsData(prevRecommendedSongList);
    }
  };

  const RenderTracks = ({ item }: { item: TrackType }) => {
    return (
      <SongTile
        item={item}
        changeModalState={changeModalState}
        registerLikeOrDislike={registerLikeOrDislike}
        likedSongs={userLikedSongsData?.data?.fav_tracks}
      />
    );
  };

  const RenderArtists = ({ item }: { item: ArtistType }) => {
    return (
      // main view for each song/artist tile
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
          <TouchableHighlight
            onPress={() =>
              router.push({
                pathname: "/songs/list",
                params: {
                  typeOfData: "artistSong",
                  title: item?.name,
                  spotify_id: item?.artist_spotify_id,
                },
              })
            }
            style={{
              flexDirection: "row",
              flex: 1,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                flex: 1,
              }}
            >
              {/* This would be wrapper for song image, title and artist name */}
              <View
                style={{
                  flex: 8,
                  justifyContent: "space-between",
                  flexDirection: "row",
                }}
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
                      source={checkImage(
                        item?.image_spotify?.url
                          ? item?.image_spotify?.url
                          : item?.image_lastfm?.url
                      )}
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
                    <Text
                      numberOfLines={1}
                      style={SongsListStyleSheet.songNameText}
                    >
                      {item?.name}
                    </Text>
                  </View>
                </View>
              </View>

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
                <TouchableHighlight>
                  {/* <FontAwesome name="thumbs-o-up" size={30} color="#FF000080" /> */}
                  <FontAwesome name="thumbs-up" size={30} color="#FF000080" />
                </TouchableHighlight>

                {/* liked button */}

                {/* disline button */}
                <TouchableHighlight>
                  {/* <FontAwesome name="thumbs-o-down" size={30} color="#FF000080" /> */}
                  <FontAwesome
                    name="thumbs-o-down"
                    size={30}
                    color="#FF000080"
                  />
                </TouchableHighlight>
              </View>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    );
  };

  const InfoModal = () => {
    return (
      <Modal style={SongsListStyleSheet.body} visible={showModal} transparent>
        <View
          style={{
            flex: 1,
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1f07072e",
            height: "100%",
            width: "100%",
          }}
        >
          <View style={{ flex: 1 }}></View>
          <View
            style={{
              backgroundColor: "#5e0404ff",
              width: SCREEN_WIDTH * 0.8,
              borderRadius: SCREEN_WIDTH * 0.1 * 0.5,
              padding: "2%",
              flex: 1,
            }}
          >
            <View>
              <View
                style={{
                  alignContent: "flex-end",
                  alignItems: "flex-end",
                  padding: "2%",
                }}
              >
                <TouchableHighlight onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={30} color="white" />
                </TouchableHighlight>
              </View>
            </View>

            <View
              style={{
                paddingTop: "5%",
              }}
            >
              <View
                style={{
                  justifyContent: "center",
                  alignContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="headphones-off"
                  size={40}
                  color="white"
                />
              </View>
              <View
                style={{
                  alignContent: "center",
                  alignItems: "center",
                  alignSelf: "center",
                  paddingTop: "5%",
                  paddingHorizontal: "5%",
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    color: "white",
                    lineHeight: 60,
                    alignContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    textAlignVertical: "center",
                  }}
                >
                  {`Playback is coming soon!!!`}
                </Text>

                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      color: "white",
                      lineHeight: 25,
                      alignContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      textAlignVertical: "center",
                      fontStyle: "italic",
                    }}
                  >
                    {`Keep exploring — every like and dislike makes your recommendations smarter.`}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }}></View>
        </View>
      </Modal>
    );
  };

  const changeModalState = (value: boolean) => {
    refetchUserLikedData();
    setShowModal(value);
  };

  const HeaderComponent_SongList = () => {
    return (
      <View
        style={{
          backgroundColor: "#141E23",
          paddingTop: insets.top,
          justifyContent: "space-between",
          alignContent: "flex-end",
          alignItems: "flex-end",
          flexDirection: "row",
          paddingHorizontal: Dimensions.get("screen").width * 0.06,
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <TouchableOpacity
            style={{
              paddingTop: Dimensions.get("screen").height * 0.02,
            }}
            onPress={() => router.back()}
          >
            <FontAwesome5 name="angle-left" size={40} color="#FF000080" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 9,
            alignSelf: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              paddingTop: Dimensions.get("screen").height * 0.02,
            }}
          >
            <Text
              style={{
                fontSize: 30,
                color: "#FF000080",
                textAlignVertical: "center",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {headerTitle}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const RenderListOfArtistSongs = () => {
    console.log("I am inside 1: ", artistSongData);
    return (
      <Animated.FlatList
        itemLayoutAnimation={LinearTransition}
        data={artistSongList}
        keyExtractor={(item) => item.song_id}
        renderItem={({ item }) => <RenderTracks item={item} />}
        ItemSeparatorComponent={() => (
          <View style={{ paddingVertical: SCREEN_HEIGHT * 0.005 }}></View>
        )}
        ListFooterComponent={() => (
          <View style={{ paddingVertical: SCREEN_HEIGHT * 0.05 }} />
        )}
      />
    );
  };

  const RenderListOfArtists = () => {
    return (
      <FlatList
        data={artistDetailResultData?.data?.slice(0, 20)}
        keyExtractor={(item, index) => item.artist_spotify_id+index.toString()}
        renderItem={({ item }) => <RenderArtists item={item} />}
        ItemSeparatorComponent={() => (
          <View style={{ paddingVertical: SCREEN_HEIGHT * 0.005 }}></View>
        )}
        ListFooterComponent={() => (
          <View style={{ paddingVertical: SCREEN_HEIGHT * 0.05 }} />
        )}
      />
    );
    // }
  };

  return (
    <View style={SongsListStyleSheet.body}>
      <InfoModal />
      <Stack.Screen
        options={{
          header: (props) => <HeaderComponent_SongList />,
        }}
      />

      <LinearGradient
        colors={["transparent", "transparent", "#FF000052"]}
        style={{
          flex: 1,
          height: "100%",
          width: "100%",
          flexGrow: 1,
        }}
      >
        {/* View for name of playlist */}
        <View
          style={{
            paddingLeft: SCREEN_WIDTH * 0.04,
            paddingRight: SCREEN_WIDTH * 0.02,
            paddingTop: SCREEN_HEIGHT * 0.02,
            paddingBottom: SCREEN_HEIGHT * 0.1,
          }}
        >
          {/* View for displaying the songs list */}
          {typeOfData === "recommendedSongs" ? (
            <Animated.FlatList
              itemLayoutAnimation={LinearTransition}
              data={recommendedSongsData}
              keyExtractor={(item) => item.song_id}
              renderItem={({ item }) => <RenderTracks item={item} />}
              ItemSeparatorComponent={() => (
                <View style={{ paddingVertical: SCREEN_HEIGHT * 0.005 }}></View>
              )}
              ListFooterComponent={() => (
                <View style={{ paddingVertical: SCREEN_HEIGHT * 0.05 }} />
              )}
            />
          ) : typeOfData === "trendingSongs" ? (
            <Animated.FlatList
              itemLayoutAnimation={LinearTransition}
              data={trendingsongsList}
              keyExtractor={(item) => item.song_id}
              renderItem={({ item }) => <RenderTracks item={item} />}
              ItemSeparatorComponent={() => (
                <View style={{ paddingVertical: SCREEN_HEIGHT * 0.005 }}></View>
              )}
              ListFooterComponent={() => (
                <View style={{ paddingVertical: SCREEN_HEIGHT * 0.05 }} />
              )}
            />
          ) : typeOfData === "artistSong" ? (
            <RenderListOfArtistSongs></RenderListOfArtistSongs>
          ) : typeOfData === "dislikedSongs" ? (
            <Animated.FlatList
              itemLayoutAnimation={LinearTransition}
              data={dislikedSongs}
              keyExtractor={(item) => item.song_id}
              renderItem={({ item }) => <RenderTracks item={item} />}
              ItemSeparatorComponent={() => (
                <View style={{ paddingVertical: SCREEN_HEIGHT * 0.005 }}></View>
              )}
              ListFooterComponent={() => (
                <View style={{ paddingVertical: SCREEN_HEIGHT * 0.05 }} />
              )}
            />
          ) : (
            <RenderListOfArtists />
          )}

          {/* <View style={{ paddingVertical: SCREEN_HEIGHT * 0.005 }}></View> */}
          {visibleSnackbar && typeOfData === "recommendedSongs" ? (
            <View style={{ position: "fixed", bottom: 30, right: 5 }}>
              <Provider>
                <Portal>
                  <Snackbar
                    visible={visibleSnackbar}
                    onDismiss={() => onDismissSnackBar()}
                    duration={5000}
                    action={{
                      label: "Undo",
                      onPress: () => {
                        undoRemoval();
                        console.log("Undo Pressed");
                      },
                      textColor: "#FF000080",
                    }}
                    wrapperStyle={{
                      backgroundColor: "#262b2eff",
                    }}
                    style={{
                      flexDirection: "row",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          paddingLeft: "2%",
                          textAlignVertical: "center",
                        }}
                      >
                        Track dropped from your mix.
                      </Text>
                    </View>
                  </Snackbar>
                </Portal>
              </Provider>
            </View>
          ) : (
            <View style={{ paddingVertical: SCREEN_HEIGHT * 0.005 }}></View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const SongsListStyleSheet = StyleSheet.create({
  body: {
    backgroundColor: "#141E23",
    height: "100%",
    width: "100%",
  },

  listNameText: {
    color: "white",
    fontSize: 28,
  },
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
  tracksContainerView: {
    backgroundColor: "#262b2eff",
    padding: SCREEN_HEIGHT * 0.015,
  },
  tracksWrapperView: {
    flexWrap: "wrap",
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
  },
  containerScrollView: {
    flex: 1,
    height: "100%",
    width: "100%",
    flexGrow: 1,
  },
});
