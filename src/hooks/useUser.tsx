"use client";

import React, { createContext, useContext } from "react";
import type { Doc } from "../../convex/_generated/dataModel";

export type AppUser = (Doc<"users"> & { username?: string }) | null;

const UserContext = createContext<AppUser>(null);

interface UserProviderProp {
  children: React.ReactNode;
  user: AppUser;
}

export function UserProvider({ children, user }: UserProviderProp) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
