import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { asyncStoragePersister } from "./persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      retryOnMount: false,
      refetchOnMount: false,
    },
    mutations: {
      onError: (error) => {
        console.log("🌍 Global mutation error:", error);
      },
    },
  },
});

// Enable persistence
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});
