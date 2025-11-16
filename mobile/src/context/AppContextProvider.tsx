// AppContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useUserDetails } from "./UserDetailsContext";
import { useUserPreferences } from "./UserPreferencesContext";

type AppContextType = {
  isAppReady: boolean | false;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppContextProvider({ children }:  { children: React.ReactNode }) {
  const userdetails = useUserDetails();
  const userLoaded = userdetails?.state?.loading;

  const userPref = useUserPreferences();
  const prefsLoaded = userPref?.state?.loading


  const [isAppReady, setIsAppReady] = useState(false);



  useEffect(() => {
    if (!userLoaded && !prefsLoaded) {
      setIsAppReady(true);
    }
  }, [userLoaded, prefsLoaded]);

  return (
    <AppContext.Provider value={{ isAppReady}}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
