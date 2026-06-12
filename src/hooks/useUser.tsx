"use client"

import React, { createContext, useContext } from "react";

const UserContext = createContext<any>(null)

interface UserProviderProp {
    children: React.ReactNode;
    user: any;
}

export function UserProvider({ children, user }: UserProviderProp) {
    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    )
} 

export function useUser() {
    const context = useContext(UserContext) 
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider")
    }
    return context;
}