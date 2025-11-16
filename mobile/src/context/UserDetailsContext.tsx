import * as Device from "expo-device";
import React, { ActionDispatch, createContext, useContext, useEffect, useReducer } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from "uuid";

type UserState = {
  userId: string | null;
  deviceId: string | null;
  loading: boolean;  // important for splash screen
};

const initialState: UserState = {
  userId: null,
  deviceId: null,
  loading: true,
};

type Action =
  | { type: "SET_IDS", payload: { userId: string, deviceId: string } }
  | { type: "CLEAR_IDS" }
  | { type: "STOP_LOADING" };

function userReducer(state: UserState, action: Action): UserState {
  switch (action.type) {
    case "SET_IDS":
      return {
        ...state,
        userId: action.payload.userId,
        deviceId: action.payload.deviceId,
      };
    case "CLEAR_IDS":
      return {
        ...state,
        userId: null,
        deviceId: null,
      };
    case "STOP_LOADING":
      return { ...state, loading: false };
    default:
      return state;
  }
}

type UserDetailContextType = {
    state: UserState,
    dispatch: ActionDispatch<[action: Action]>,
    initUser: () => Promise<void>,
    deleteAccount: () => Promise<void>
}


const UserDetailsContext = createContext<UserDetailContextType | null>(null);

export function UserDetailsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
        
      let userId = await AsyncStorage.getItem("user_id");
      let deviceId = await  AsyncStorage.getItem("device_id");


      // Generate only if missing
      if (!userId) {
        userId = uuidv4();
        await AsyncStorage.setItem("user_id", userId);
      }

      if (!deviceId) {
        deviceId = Device.osInternalBuildId ?? `dev-${Date.now()}`;
        await AsyncStorage.setItem("device_id", deviceId);
      }

      dispatch({ type: "SET_IDS", payload: { userId, deviceId } });
    } catch (err) {
      console.log("Init error:", err);
    } finally {
      dispatch({ type: "STOP_LOADING" });
    }
  };

  const deleteAccount = async () => {
    await AsyncStorage.removeItem("user_id");
    await AsyncStorage.removeItem("device_id");

    dispatch({ type: "CLEAR_IDS" });
  };

  return (
    <UserDetailsContext.Provider value={{ state, dispatch, initUser, deleteAccount }}>
      {children}
    </UserDetailsContext.Provider>
  );
};

export const useUserDetails = () => useContext(UserDetailsContext);





// // UserDetailsContext.tsx
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Device from "expo-device";
// import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
// import 'react-native-get-random-values';
// import { v4 as uuidv4 } from "uuid";

// type UserDetailsType = {
//   userId: string | null;
//   setUserId: Dispatch<SetStateAction<string | null>>;
//   setDeviceId: Dispatch<SetStateAction<string | null>>;
//   deviceId: string | null;
//   loaded: boolean;
// };

// const UserDetailsContext = createContext<UserDetailsType | null>(null);

// export function UserDetailsProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [userId, setUserId] = useState<string | null>(null);
//   const [deviceId, setDeviceId] = useState<string | null>(null);
//   const [loaded, setLoaded] = useState<boolean>(false);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         let storedUserId = await AsyncStorage.getItem("userId");
//         let storedDeviceId = await AsyncStorage.getItem("deviceId");

//         if (!storedDeviceId) {
//           storedDeviceId = Device.osInternalBuildId ?? `dev-${Date.now()}`;
//           await AsyncStorage.setItem("deviceId", storedDeviceId);
//         }

//         if(!storedUserId) {
//          storedUserId =  uuidv4()
//          await AsyncStorage.setItem("userId", storedUserId);
//         }

//         setUserId(storedUserId ?? null);
//         setDeviceId(storedDeviceId);
        
//         console.log("uer d: ", storedUserId)
//         console.log("device id: ", storedDeviceId)
//       } finally {
//         setLoaded(true);
        
//         console.log("uer d: ", userId)
//         console.log("device id: ", deviceId)
//       }
//     };

//     load();
    
//   }, []);

//   return (
    
//     <UserDetailsContext.Provider
//       value={{ userId, setUserId,setDeviceId, deviceId, loaded }}
//     >
//       {children}
//     </UserDetailsContext.Provider>
//   );
// }

// export const useUserDetails = () => useContext(UserDetailsContext);
