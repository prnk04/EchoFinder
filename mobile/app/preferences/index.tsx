import { useFetchUserLikedSongs } from "@/src/api/queries/songs";
import { useUserDetails } from "@/src/context/UserDetailsContext";
import { useUserPreferences } from "@/src/context/UserPreferencesContext";
import { clearAllUserData } from "@/src/lib/clearAllUserData";
import { TrackType } from "@/src/types";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { Portal, Provider, Snackbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("screen").height;
const SCREEN_WIDTH = Dimensions.get("screen").width;

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();

  const userPrefs = useUserPreferences();
  const userDetails = useUserDetails();

  const [showConfimationModal, setShowConfirmationModal] = useState(false);
  const [visibleSnackbar, setVisibleSnackbar] = useState(false);

  const genres = userPrefs?.state.genres;
  const artists = userPrefs?.state.artists;

  const userId = userDetails?.state.userId ?? "";

  const {
    isPending: isUserLikedSongsPending,
    isError: isUserLikedSongsError,
    isSuccess: isUserLikedSongsSuccess,
    data: userLikedSongsData,
  } = useFetchUserLikedSongs(userId);

  const deletAccount = async () => {
    try {
      setTimeout(async () => {
        
        console.log("-----------------------");
        console.log("I want to delete user account");
        userDetails?.deleteAccount();
        console.log("I want to delete user pref");
        userPrefs?.deletePreferences();
        clearAllUserData();
        let p = await AsyncStorage.getItem("genres_selected");
        console.log("p is: ", p);
        // deleteAccount(); // clear context + AsyncStorage
        // clearPreferences(); // another reducer context
      }, 600);
      router.dismissAll();
      router.replace("../../");
    } catch (error) {
      console.log("error in delete account: ", error);
    }
  };

  const editPref = (title: string, data: string[]) => {
    try {
      router.push({
        pathname: "/preferences/edit",
        params: { title: title, data: data },
      });
    } catch (error) {
      console.log("Error in moving to edit pref: ", error);
    }
  };

  const moveToSongList = () => {
    router.push({
      pathname: "/songs/list",
      params: { typeOfData: "dislikedSongs", title: "Out-of-vibe songs" },
    });
  };

  const HeaderComponent_Preferences = () => {
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
            // backgroundColor: "blue"
          }}
        >
          <TouchableOpacity
            style={{
              paddingTop: Dimensions.get("screen").height * 0.02,
              justifyContent: "flex-start",
              alignContent: "flex-start",
              alignItems: "flex-start",
            }}
            onPress={() => router.back()}
          >
            <FontAwesome5 name="angle-left" size={34} color="#FF000080" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 9,
            // backgroundColor: "white",
            alignSelf: "center",
            // alignContent:"center"
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
                fontSize: 28,
                color: "#FF000080",
                textAlignVertical: "center",
                fontWeight: "500",
                textAlign: "center",
                lineHeight: 40,
              }}
            >
              Preferences
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const ConfirmationModal = () => {
    return (
      <Modal
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: "#141E23",
          flex: 1,
        }}
        visible={showConfimationModal}
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
              justifyContent: "space-between",
            }}
          >
            {/* <View>
              <View
                style={{
                  alignContent: "flex-end",
                  alignItems: "flex-end",
                  padding: "2%",
                }}
              >
                <TouchableHighlight onPress={() => setShowConfirmationModal(false)}>
                  <Ionicons name="close" size={30} color="white" />
                </TouchableHighlight>
              </View>
            </View> */}

            <View
              style={{
                paddingTop: "5%",
              }}
            >
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
                  {`Delete Account?`}
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
                    {`This will permanently delete your account and all preferences. Are you sure you want to continue?`}
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                paddingVertical: "5%",
                // borderWidth:1,
                // borderStyle: "solid",
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                borderBottomRightRadius: 2,
                borderBottomLeftRadius: 2,
                backgroundColor: "#47030348",
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: "100%",
                  width:"100%"

                  // paddingVertical: "2%",
                  // paddingHorizontal: "2%"
                }}
              >
                <TouchableOpacity
                style={{
                  flex: 1,
                  height: "100%",
                  width: "100%"
                }}
                
                  onPress={() => {
                    setShowConfirmationModal(false);
                    setVisibleSnackbar(true);
                    deletAccount()
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "white",
                      lineHeight: 25,
                      alignContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      textAlignVertical: "center",
                    }}
                  >
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  // width: 2,
                  backgroundColor: "#5e0404ff",
                  height: "220%",
                  alignSelf: "center",
                  flex: 0.02,
                }}
              ></View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowConfirmationModal(false)}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "white",
                      lineHeight: 25,
                      alignContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      textAlignVertical: "center",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }}></View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={PrefScreenStyleSheet.body}>
      <Stack.Screen
        options={{ header: (props) => <HeaderComponent_Preferences /> }}
      />
      <ConfirmationModal />
      <LinearGradient
        colors={["transparent", "transparent", "#FF000052"]}
        style={PrefScreenStyleSheet.linearGradientContainer}
      >
        {/* view for artist and genre data */}
        <View style={PrefScreenStyleSheet.dataContainerView}>
          <TouchableHighlight
            style={PrefScreenStyleSheet.genresTouchableHighlight}
            onPress={() => editPref("Genres You Like", genres ? genres : [])}
          >
            <View style={PrefScreenStyleSheet.genresWrapperView}>
              <View style={PrefScreenStyleSheet.genresTextView}>
                <Text style={PrefScreenStyleSheet.genresText}>
                  {`Genres You like`}
                </Text>
                <Text
                  style={PrefScreenStyleSheet?.genresData}
                  numberOfLines={1}
                >
                  {genres?.join(", ")}
                </Text>
              </View>
              <View style={PrefScreenStyleSheet.moreButtonView}>
                <FontAwesome name="angle-right" size={48} color="#FF000080" />
              </View>
            </View>
          </TouchableHighlight>

          {/* </TouchableHighlight> */}

          <View style={PrefScreenStyleSheet.lineSeparator} />

          <TouchableHighlight
            style={PrefScreenStyleSheet.artistsContainerView}
            onPress={() => editPref("Artists You Like", artists ? artists : [])}
          >
            <View style={PrefScreenStyleSheet.genresWrapperView}>
              <View style={PrefScreenStyleSheet.artistTextView}>
                <Text style={PrefScreenStyleSheet.genresText}>
                  Artists You like
                </Text>
                <Text style={PrefScreenStyleSheet.genresData} numberOfLines={1}>
                  {artists?.join(", ")}
                </Text>
              </View>
              <View style={PrefScreenStyleSheet.moreButtonView}>
                <FontAwesome name="angle-right" size={48} color="#FF000080" />
              </View>
            </View>
          </TouchableHighlight>

          <View style={PrefScreenStyleSheet.lineSeparator} />

          {/* View for unliked songs */}
          {userLikedSongsData?.data?.fav_tracks
            ?.filter((a: TrackType) => a?.score && a?.score < 0)
            ?.flatMap((a: TrackType) => a.title)
            ?.join(", ")?.length > 0 ? (
            <View>
              <TouchableHighlight
                style={PrefScreenStyleSheet.artistsContainerView}
                onPress={() => moveToSongList()}
              >
                <View style={PrefScreenStyleSheet.genresWrapperView}>
                  <View style={PrefScreenStyleSheet.artistTextView}>
                    <Text style={PrefScreenStyleSheet.genresText}>
                      Out-of-vibe songs
                    </Text>
                    <Text
                      style={PrefScreenStyleSheet.genresData}
                      numberOfLines={1}
                    >
                      {userLikedSongsData?.data?.fav_tracks
                        ?.filter((a: TrackType) => a?.score && a?.score < 0)
                        ?.flatMap((a: TrackType) => a.title)
                        ?.join(", ")}
                    </Text>
                  </View>
                  <View style={PrefScreenStyleSheet.moreButtonView}>
                    <FontAwesome
                      name="angle-right"
                      size={48}
                      color="#FF000080"
                    />
                  </View>
                </View>
              </TouchableHighlight>

              <View style={PrefScreenStyleSheet.lineSeparator} />
            </View>
          ) : (
            <></>
          )}

          {/* view for delete account button */}

          <View style={PrefScreenStyleSheet.deleteAccountContainer}>
            <TouchableHighlight onPress={() => setShowConfirmationModal(true)}>
              <View style={PrefScreenStyleSheet.deleteAccountTH}>
                <MaterialCommunityIcons
                  // name="delete-circle-outline"
                  name="delete-outline"
                  size={30}
                  color="#FFFFFF"
                />
                <Text style={PrefScreenStyleSheet.deleteAccountText}>
                  Delete Account
                </Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
        <View style={{ top: SCREEN_HEIGHT*0.53}}>
          <Provider>
            <Portal>
              <Snackbar
                visible={visibleSnackbar}
                duration={3000}
                wrapperStyle={{
                  // backgroundColor: "#262b2eff",
                }}
                style={{
                  flexDirection: "row",
                  backgroundColor:"#580101bb"
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
                      paddingLeft: "1%",
                      textAlignVertical: "center",
                      color:"#ffffff9a"
                    }}
                  >
                    The track ends here — your account has been deleted.
                  </Text>
                </View>
              </Snackbar>
            </Portal>
          </Provider>
        </View>
      </LinearGradient>
    </View>
  );
}

const PrefScreenStyleSheet = StyleSheet.create({
  body: {
    height: "100%",
    width: "100%",
    backgroundColor: "#141E23",
    flex: 1,
  },

  linearGradientContainer: {
    flex: 1,
  },
  genresContainerView: {
    flex: 3,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingTop: SCREEN_WIDTH * 0.08,
  },
  dataContainerView: {
    paddingTop: SCREEN_HEIGHT * 0.01,
    paddingBottom: SCREEN_HEIGHT * 0.02,
    paddingHorizontal: "2%",
    // pad
  },
  genresWrapperView: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genresTextView: {
    maxWidth: SCREEN_WIDTH * 0.82,
  },
  genresText: {
    fontSize: 20,
    color: "#FFFFFF",
    lineHeight: 40,
  },
  genresTouchableHighlight: {
    paddingVertical: "5%",
    paddingHorizontal: "3%",
  },
  genresData: {
    fontSize: 16,
    color: "#FFFFFF90",
  },
  moreButtonView: {
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  lineSeparator: {
    borderBottomColor: "#6c535380",
    borderBottomWidth: 1,
    paddingVertical: SCREEN_HEIGHT * 0.002,
  },
  artistsContainerView: {
    paddingTop: SCREEN_HEIGHT * 0.02,
    paddingBottom: SCREEN_HEIGHT * 0.02,
    paddingHorizontal: "3%",
  },
  artistTextView: {
    paddingRight: SCREEN_WIDTH * 0.1,
    maxWidth: SCREEN_WIDTH * 0.82,
  },
  deleteAccountContainer: {
    paddingTop: SCREEN_HEIGHT * 0.03,
    paddingBottom: SCREEN_WIDTH * 0.04,
  },
  deleteAccountTH: {
    flexDirection: "row",
  },
  deleteAccountText: {
    fontSize: 20,
    // color: "#FF000080"
    color: "#FFFFFF",
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    textAlignVertical: "center",
    lineHeight: 30,
  },
});
