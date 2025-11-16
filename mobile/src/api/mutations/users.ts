import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryClient } from "../../lib/queryClient";
import { apiClient } from "../clients";
import { queryKeys } from "../queryKeys";

type UserDetailType = {
  user_id: string;
  device_id: string;
  fav_artists: string[];
  fav_genres: string[];
};

type UserSongInteractionDataType = {
  user_id: string,
  song_id: string,
  score: number
}


// Custom hook to store user details
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userDetails: UserDetailType) => {
      const res = await apiClient("/user/userDetails", {
        method: "POST",
        body: JSON.stringify(userDetails),
      });
    },
    onError: (error) => {
      console.log("❌ Mutation failed:", error.message);
    },
    onSuccess: () => {
      console.log("✅ User details successfully updated!");
      queryClient.invalidateQueries({ queryKey: [queryKeys.user.userDetails] });
    },
    onSettled: () => {
      console.log("ℹ️ Mutation settled (success or error)");
    },
  });
};



export const useUpdateUserSongInteraction = () => {
  // const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(userSongInteractionData: UserSongInteractionDataType) => {
      
      const res = await apiClient("/user/songFeedback", {
        method: "POST",
        body: JSON.stringify(userSongInteractionData)
      });

      
    },
    onError: (error) => {
      console.log("Error in mutating user song interaction: ", error)
    },
    onSuccess: () => {
      console.log("User song interaction mutation succeded")
      queryClient.invalidateQueries({queryKey: [queryKeys.songs.user_fav], exact:false})
    },
    onSettled: () => {
      console.log("Mutation for user song interaction settled")
    }
  })
};
