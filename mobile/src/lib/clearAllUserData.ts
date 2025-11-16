// src/lib/clearAllUserData.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { asyncStoragePersister } from "./persister";
import { queryClient } from "./queryClient";

export async function clearAllUserData() {

  
  try {
    console.log("🔄 Starting full app reset...");

    // 1. Remove React Query persisted cache
    await asyncStoragePersister.removeClient();
    console.log("✓ React Query cache cleared");

    // 2. Fully wipe AsyncStorage
    await AsyncStorage.clear();
    console.log("✓ AsyncStorage cleared");

    // 3. Reset in-memory query cache
    queryClient.clear();
    console.log("✓ React Query in-memory cache cleared");

  } catch (err) {
    console.log("❌ Error in app reset:", err);
  }
}
