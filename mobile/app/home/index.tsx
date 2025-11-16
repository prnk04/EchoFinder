import { useFetchArtist } from "@/src/api/queries/artists";
import { useRecommendedSongs, useTrendingSongs } from "@/src/api/queries/songs";
import PlaceHolder from "@/src/components/PlaceHolder_home";
import Skeleton_Home from "@/src/components/Skeleton_Home";
import { useUserDetails } from "@/src/context/UserDetailsContext";
import { ArtistType, TrackType } from "@/src/types";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router, Stack } from "expo-router";

const SCREEN_HEIGHT = Dimensions.get("screen").height;
const SCREEN_WIDTH = Dimensions.get("screen").width;

export default function HomeScreen() {
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const userDetails = useUserDetails();

  const userId = userDetails?.state.userId || "";
  const isFocused = useIsFocused();

  const insets = useSafeAreaInsets();

  const [artistData, setArtistData] = useState<ArtistType[]>([]);

  const {
    isPending: isTrendingSongsResultPending,
    isError: isTrendingSongsResultError,
    isSuccess: isTrendingSongsResultSuccess,
    data: trendingSongsResultData,
  } = useTrendingSongs(userId);

  const {
    isPending: isArtistDetailResultPending,
    isError: isArtistDetailResultError,
    isSuccess: isArtistDetailResultSuccess,
    data: artistDetailResultData,
    refetch: artistDetailsRefetch,
  } = useFetchArtist(userId);

  const {
    isPending: isRecommendedSongsResultPending,
    isError: isRecommendedSongsResultError,
    isSuccess: isRecommendedSongsResultSuccess,
    data: recommendedSongsResultData,
  } = useRecommendedSongs(userId);

  const [showErrorModal, setShowErrorModal] = useState<boolean>(
    isTrendingSongsResultError &&
      isArtistDetailResultError &&
      isRecommendedSongsResultError &&
      isFocused
  );

  useEffect(() => {
    if (artistDetailResultData?.data?.length === 0) {
      artistDetailsRefetch();
    }
  }, [artistDetailResultData]);

  useEffect(() => {
    const blockBack = () => true; // prevent default
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      blockBack
    );

    return () => backHandler?.remove();
  }, []);

  useMemo(() => {
    setShowErrorModal(
      isTrendingSongsResultError &&
        isArtistDetailResultError &&
        isRecommendedSongsResultError &&
        isFocused
    );
  }, [
    isTrendingSongsResultError,
    isArtistDetailResultError,
    isRecommendedSongsResultError,
    isFocused,
  ]);

  type TracksProps = {
    item: TrackType;
  };

  type ArtistsProps = {
    item: ArtistType;
  };

  const showMore = ({ type, title }: { type: string; title: string }) => {
    router.push({
      pathname: "/songs/list",
      params: { typeOfData: type, title },
    });
  };

  const ListFooterComponent = ({
    type,
    title,
  }: {
    type: string;
    title: string;
  }) => {
    return (
      <View style={HomeScreenStyleSheet.listFooterComponent_containerView}>
        <TouchableHighlight
          onPress={() => showMore({ type, title })}
          style={HomeScreenStyleSheet.listFooterComponent_wrapper}
          disabled={!title || title === ""}
        >
          <FontAwesome5 name="angle-right" size={40} color="white" />
        </TouchableHighlight>
      </View>
    );
  };

  const RenderTracks = ({ item }: TracksProps) => {
    return (
      <View
        style={{
          maxWidth: SCREEN_WIDTH * 0.5,
          alignContent: "center",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TouchableHighlight
          style={{
            flex: 1,
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
          }}
          underlayColor="transparent"
          onPress={() => setShowInfoModal(true)}
        >
          <PlaceHolder
            imageURL={item?.image?.url}
            title1={item?.title}
            title2={item?.artistsName?.toString()}
            type="song"
          />
        </TouchableHighlight>
      </View>
    );
  };

  const RenderArtists = ({ item }: ArtistsProps) => {
    return (
      <View
        style={{
          maxWidth: SCREEN_WIDTH * 0.5,
          alignContent: "center",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TouchableHighlight
          style={{
            flex: 1,
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
          }}
          disabled={!item?.name || item?.name === ""}
          onPress={() =>
            // {item?.name && item?.name !== "" ?
            router.push({
              pathname: "/songs/list",
              params: {
                typeOfData: "artistSong",
                title: item?.name,
                spotify_id: item?.artist_spotify_id,
              },
            })
          }
        >
          <PlaceHolder
            imageURL={
              item?.image_spotify?.url
                ? item?.image_spotify?.url
                : item?.image_lastfm?.url
                ? item?.image_lastfm?.url
                : ""
            }
            title1={item?.name}
            title2=""
            type="artist"
          />
        </TouchableHighlight>
      </View>
    );
  };

  const LoadingModal = () => {
    return (
      <Modal
        style={HomeScreenStyleSheet.body}
        visible={
          isTrendingSongsResultPending &&
          isArtistDetailResultPending &&
          isRecommendedSongsResultPending &&
          isFocused
        }
        transparent
      >
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
          <ActivityIndicator size={100} color="#ff0000b6" />
        </View>
      </Modal>
    );
  };

  const InfoModal = () => {
    return (
      <Modal
        style={HomeScreenStyleSheet.body}
        visible={showInfoModal}
        transparent
      >
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
                <TouchableHighlight onPress={() => setShowInfoModal(false)}>
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
                  // justifyContent: "flex-end",
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

  const ErrorModal = () => {
    return (
      <Modal
        style={HomeScreenStyleSheet.body}
        visible={showErrorModal}
        transparent
      >
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
              // height: SCREEN_HEIGHT * 0.3,
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
                <TouchableHighlight onPress={() => setShowErrorModal(false)}>
                  <Ionicons name="close" size={30} color="white" />
                </TouchableHighlight>
              </View>
            </View>

            <View>
              <View
                style={{
                  alignContent: "center",
                  alignItems: "center",
                  alignSelf: "center",
                }}
              >
                <View
                  style={{
                    paddingVertical: "5%",
                  }}
                >
                  <MaterialIcons name="music-off" size={60} color="white" />
                </View>

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
                  {`Connection missed a beat.`}
                </Text>

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
                >{`We’ll catch it again shortly.`}</Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }}></View>
        </View>
      </Modal>
    );
  };

  const HeaderComponent_Main = () => {
    return (
      <View
        style={{
          backgroundColor: "#141E23",
          paddingTop: insets.top,
          justifyContent: "space-between",
          alignContent: "flex-end",
          alignItems: "flex-end",
          flexDirection: "row",
          paddingHorizontal: Dimensions.get("screen").width * 0.03,
          paddingBottom: Dimensions.get("screen").height * 0.01,
        }}
      >
        <View
          style={{
            paddingTop: Dimensions.get("screen").height * 0.02,
          }}
        >
          <Text
            style={{
              fontSize: 26,
              color: "white",
              fontWeight: "700",
            }}
          >
            EchoFinder
          </Text>
        </View>
        <View>
          <TouchableOpacity
            style={{
              paddingTop: Dimensions.get("screen").height * 0.02,
            }}
            onPress={() => {
              router.push("/preferences");
            }}
          >
            <Feather name="menu" size={40} color="#FF000080" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={HomeScreenStyleSheet.body}>
      <Stack.Screen options={{ header: (props) => <HeaderComponent_Main /> }} />
      <LoadingModal />
      <ErrorModal />
      <InfoModal />
      <ScrollView
        automaticallyAdjustContentInsets={true}
        automaticallyAdjustsScrollIndicatorInsets={true}
        centerContent={true}
        indicatorStyle="white"
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={true}
        scrollEnabled={true}
        style={HomeScreenStyleSheet.containerScrollView}
      >
        <LinearGradient
          colors={["transparent", "transparent", "#FF000052"]}
          style={HomeScreenStyleSheet.containerLinearGradientView}
        >
          {isTrendingSongsResultError &&
          isArtistDetailResultError &&
          isRecommendedSongsResultError ? (
            <></>
          ) : (
            <></>
          )}
          <View style={HomeScreenStyleSheet.containerView}>
            {/* View to display trending songs */}
            <View style={HomeScreenStyleSheet.warpperViewStyle}>
              <View style={HomeScreenStyleSheet.headlineView}>
                <Text
                  style={HomeScreenStyleSheet.headlineText}
                >{`Trending Songs`}</Text>
              </View>
              <View>
                {isTrendingSongsResultPending ? (
                  <View style={HomeScreenStyleSheet.skeletonWrapper}>
                    <Skeleton_Home viewWidth={SCREEN_WIDTH * 0.34} />
                    <Skeleton_Home viewWidth={SCREEN_WIDTH * 0.34} />
                    <Skeleton_Home viewWidth={SCREEN_WIDTH * 0.34} />
                  </View>
                ) : (
                  <View style={HomeScreenStyleSheet.skeletonWrapper}>
                    <FlatList
                      data={JSON.parse(
                        trendingSongsResultData
                      ).trendingSongs.slice(0, 7)}
                      keyExtractor={(item) => item.song_id}
                      renderItem={({ item }) => <RenderTracks item={item} />}
                      horizontal={true}
                      ItemSeparatorComponent={() => (
                        <View
                          style={{ paddingHorizontal: SCREEN_HEIGHT * 0.01 }}
                        ></View>
                      )}
                      ListFooterComponent={() => (
                        <ListFooterComponent
                          type="trendingSongs"
                          title="Trending Songs"
                        />
                      )}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* View to display fav artists */}
            <View style={HomeScreenStyleSheet.warpperViewStyle}>
              <View style={HomeScreenStyleSheet.headlineView}>
                <Text
                  style={HomeScreenStyleSheet.headlineText}
                >{`Artists You Like`}</Text>
              </View>
              <View>
                {isArtistDetailResultPending ? (
                  <View style={HomeScreenStyleSheet.skeletonWrapper}>
                    <Skeleton_Home viewWidth={SCREEN_WIDTH * 0.34} />
                    <Skeleton_Home viewWidth={SCREEN_WIDTH * 0.34} />
                    <Skeleton_Home viewWidth={SCREEN_WIDTH * 0.34} />
                  </View>
                ) : (
                  <View style={HomeScreenStyleSheet.skeletonWrapper}>
                    <FlatList
                      data={artistDetailResultData?.data?.slice(0, 7)}
                      keyExtractor={(item, index) =>
                        item.artist_spotify_id + index.toString()
                      }
                      renderItem={({ item }) => <RenderArtists item={item} />}
                      horizontal={true}
                      ItemSeparatorComponent={() => (
                        <View
                          style={{ paddingHorizontal: SCREEN_HEIGHT * 0.01 }}
                        ></View>
                      )}
                      ListFooterComponent={() => (
                        <ListFooterComponent
                          type="favArtists"
                          title="Artists You Like"
                        />
                      )}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* View to display recommended songs */}

            <View style={HomeScreenStyleSheet.warpperViewStyle}>
              {isRecommendedSongsResultError ? (
                <></>
              ) : (
                <>
                  <View style={HomeScreenStyleSheet.headlineView}>
                    <Text
                      style={HomeScreenStyleSheet.headlineText}
                    >{`You might also like`}</Text>
                  </View>
                  <View>
                    {isRecommendedSongsResultPending ? (
                      <View style={HomeScreenStyleSheet.skeletonWrapper}>
                        <Skeleton_Home viewWidth={SCREEN_WIDTH * 0.34} />
                        <Skeleton_Home viewWidth={SCREEN_WIDTH * 0.34} />
                        <Skeleton_Home viewWidth={SCREEN_WIDTH * 0.34} />
                      </View>
                    ) : (
                      <View style={HomeScreenStyleSheet.skeletonWrapper}>
                        <FlatList
                          data={recommendedSongsResultData?.data?.rec_songs?.slice(
                            0,
                            7
                          )}
                          keyExtractor={(item) => item.song_id}
                          renderItem={({ item }) => (
                            <RenderTracks item={item} />
                          )}
                          horizontal={true}
                          ItemSeparatorComponent={() => (
                            <View
                              style={{
                                paddingHorizontal: SCREEN_HEIGHT * 0.01,
                              }}
                            ></View>
                          )}
                          ListFooterComponent={() => (
                            <ListFooterComponent
                              type="recommendedSongs"
                              title="Recommended For You"
                            />
                          )}
                        />
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const HomeScreenStyleSheet = StyleSheet.create({
  body: {
    height: "100%",
    width: "100%",
    backgroundColor: "#141E23",
    flex: 1,
  },
  containerScrollView: {
    flex: 1,
    height: "100%",
    width: "100%",
    flexGrow: 1,
  },
  containerLinearGradientView: {
    flex: 1,
    height: "100%",
    width: "100%",
    flexGrow: 1,
  },
  containerView: {
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    paddingBottom: SCREEN_HEIGHT * 0.015,
    flex: 1,
  },
  warpperViewStyle: {
    flex: 1,
  },
  headlineView: {
    paddingBlock: SCREEN_HEIGHT * 0.03,
    paddingTop: SCREEN_HEIGHT * 0.03,
    paddingBottom: SCREEN_HEIGHT * 0.01,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headlineText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
  },
  skeletonWrapper: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    flex: 1,
  },

  listFooterComponent_containerView: {
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    height: SCREEN_WIDTH * 0.34,
    width: SCREEN_WIDTH * 0.34,
  },

  listFooterComponent_wrapper: {
    backgroundColor: "#604f4fff",
    height: SCREEN_WIDTH * 0.17,
    width: SCREEN_WIDTH * 0.17,
    borderRadius: SCREEN_WIDTH * 0.17 * 2,
    alignContent: "center",
    alignItems: "center",
    alignSelf: "center",

    justifyContent: "center",
  },
});
