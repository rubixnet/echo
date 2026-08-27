import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useHeartbeat(userId?: Id<"users">) {
    const sendHeartbeat = useMutation(api.users.heartbeat);

    useEffect(() => {
        if (!userId) return;

        sendHeartbeat({ userId });

        const interval = setInterval(() => {
            sendHeartbeat({ userId });
        }, 30_000);

        return () => clearInterval(interval);
    }, [userId, sendHeartbeat]);
}