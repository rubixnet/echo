"use client";

import { useEffect, useState, useRef } from "react";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { calculateServerOffset } from "@/lib/delay";

export function useServerTimeOffset() {
  const [serverOffset, setServerOffset] = useState<number>(0);
  const convex = useConvex();
  const calibratedRef = useRef(false);

  useEffect(() => {
    if (calibratedRef.current) return;

    async function calibrate() {
      try {
        const sendTime = Date.now();
        const serverTime = await convex.query(api.rooms.getServerTime, {});
        const receiveTime = Date.now();
        const offset = calculateServerOffset(sendTime, serverTime, receiveTime);
        setServerOffset(offset);
        calibratedRef.current = true;
      } catch (e) {
        console.error("Failed to calibrate server clock offset:", e);
      }
    }

    calibrate();
  }, [convex]);

  return serverOffset;
}