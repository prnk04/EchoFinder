import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

// Export ONLY the persister
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});
