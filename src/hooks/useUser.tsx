"use client";

import React, { createContext, useContext } from "react";
import type { Doc } from "../../convex/_generated/dataModel";

export type AppUser = (Doc<"users"> & { username?: string }) | null;

const UserContext = createContext<AppUser | undefined>(undefined);

interface UserProviderProp {
  children: React.ReactNode;
  user: AppUser | undefined;
}

export function UserProvider({ children, user }: UserProviderProp) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  return context;
}